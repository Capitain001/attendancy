Voici la sourdine côté serveur, en patchs sans fichier complet. Elle règle le défaut : 
aujourd'hui `isMuted` est lu chez l'expéditeur, donc couper un canal fait taire les push de tout le monde vers les autres, alors que les vrais destinataires ne peuvent pas choisir. La sourdine devient une propriété du membre du canal, appliquée par le serveur au moment de choisir les destinataires.

## Décisions de conception

- **Portée** : la sourdine ne coupe que les push. Les messages restent visibles en temps réel dans le canal ouvert.
- **Exception** : l'auteur du message cité reçoit quand même sa notification dédiée, même s'il a coupé le canal (règle habituelle des messagerie, déjà prévue à l'étape 6).
- **Stockage** : une colonne `mutedAt DateTime?` sur le membre du canal, dans le style de `deletedAt` et `editedAt`. `null` signifie actif. Elle permettra plus tard une sourdine temporaire, sans changer le modèle.

```prisma
model ChannelMember {
  // ... champs existants
  mutedAt DateTime? // null = notifications actives
}
```

C'est nullable : pas de remplissage à prévoir.

## 1. Base de données (module `channel-member`)

Je n'ai pas vu ce module : reprends dans ces requêtes les mêmes filtres que `getChannelMemberIds` (membre actif, etc.). Aucune ne doit utiliser `'use cache'`, sinon une sourdine ne prendrait effet qu'après expiration du cache.

```ts
// database/channel-member.queries.ts
// Tous les destinataires potentiels, avec leur sourdine : le filtrage se fait dans la logique,
// parce qu'une réponse directe traverse la sourdine.
export const getChannelRecipients = ({ channelId, excludedIds }: { channelId: string; excludedIds: string[] }) =>
  prisma.channelMember.findMany({
    where: { channelId, userId: { notIn: excludedIds } },
    select: { userId: true, mutedAt: true },
  })

// État de sa propre sourdine. null = pas membre (ou pas de ce canal dans cette organisation).
//getUserChannelMute remplace getOwnMute
export const getOwnMute = ({ channelId, userId, orgId }: { channelId: string; userId: string; orgId: string }) =>
  prisma.channelMember.findFirst({
    where: { channelId, userId, channel: { orgId } },
    select: { mutedAt: true },
  })
```

```ts
// database/channel-member.mutations.ts
// updateMany : permet le filtre orgId et rend count, sans lecture préalable. 0 = pas membre.
export const setOwnMute = ({ channelId, userId, orgId, muted }: { channelId: string; userId: string; orgId: string; muted: boolean }) =>
  prisma.channelMember.updateMany({
    where: { channelId, userId, channel: { orgId } },
    data: { mutedAt: muted ? new Date() : null },
  })
```

## 2. Validation et actions

```ts
// validation.ts
export const getChannelMuteSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
})
export const setChannelMuteSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
  muted: v.boolean(), // valeur explicite plutôt qu'une bascule : un retry reste idempotent
})
export type GetChannelMuteInput = v.InferInput<typeof getChannelMuteSchema>
export type SetChannelMuteInput = v.InferInput<typeof setChannelMuteSchema>
```

```ts
// actions/channel-mute.actions.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS, ERROR_CODES } from '@/config'
import { getOwnMute, setOwnMute } from '../database'
import { getChannelMuteSchema, setChannelMuteSchema, type GetChannelMuteInput, type SetChannelMuteInput } from '../validation'

export async function getChannelMuteAction(input: GetChannelMuteInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(getChannelMuteSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const member = await getOwnMute({ channelId: parsed.output.channelId, userId: user.id, orgId })
    if (!member) return { error: 'Accès refusé' }
    return { data: { muted: member.mutedAt !== null } }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}

export async function setChannelMuteAction(input: SetChannelMuteInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(setChannelMuteSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  const { channelId, muted } = parsed.output

  try {
    // userId vient de la session : on ne peut couper que son propre canal
    const { count } = await setOwnMute({ channelId, userId: user.id, orgId, muted })
    if (count === 0) return { error: 'Accès refusé' }
    return { data: { muted } }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}
```

## 3. La logique de notification

Dans `notifyChannelMembersAction`, `getChannelMemberIds` est remplacé par `getChannelRecipients`, et le calcul des destinataires est réécrit :

```ts
const members = await getChannelRecipients({
  channelId,
  excludedIds: [senderId, ...excludedIds],
})

// L'auteur du message cité n'est notifié que s'il est dans la liste (membre, ni expéditeur ni exclu)
const replyRecipientId =
  parentUserId  && members.some((m) => m.userId === parentUserId) ? parentUserId : null

// Sourdine : coupe le canal, sauf pour une réponse directe à son propre message
const recipientIds = members
  .filter((m) => !m.mutedAt || m.userId === replyRecipientId)
  .map((m) => m.userId)
```

Le reste (`preview` et `Promise.allSettled`) ne change pas. Ce choix coûte une seule requête, la même qu'avant.

## 4. Client

**`useChat.ts`** : le client ne décide plus de rien.

```ts
const sendNotifications = useCallback(
  (targetChannelId: string, messageId: string) => {
    // Plus de `if (isMuted) return` : la sourdine de l'expéditeur ne concerne que ses propres
    // notifications, le serveur filtre selon celle de chaque destinataire.
    notifyChannelMembersAction({ channelId: targetChannelId, messageId })
      .then((res) => { if (res && 'error' in res) console.error('Notifications push refusées:', res.error) })
      .catch((error) => console.error('Erreur lors de l\'envoi des notifications push:', error))
  },
  []
)
```

`useChannelMute(channelId)` reste appelé, et `isMuted` et `toggleMute` restent exposés : l'interface ne change pas.

**`useChannelMute.ts`**, remplacé en entier. L'état vient du serveur, avec une mise à jour optimiste et un retour en arrière en cas d'échec :

```ts
'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getChannelMuteAction, setChannelMuteAction } from '@/services/channel-member/actions'

const muteKey = (channelId: string) => ['channel-mute', channelId] as const

export function useChannelMute(channelId: string) {
  const queryClient = useQueryClient()

  const { data: isMuted = false, isLoading } = useQuery({
    queryKey: muteKey(channelId),
    queryFn: async () => {
      const res = await getChannelMuteAction({ channelId })
      if (!('data' in res) || !res.data) {
        throw new Error(('error' in res && res.error) || 'Impossible de lire la sourdine')
      }
      return res.data.muted
    },
    staleTime: 60_000, // un changement fait sur un autre appareil arrive au refetch (focus inclus)
  })

  const { mutate } = useMutation({
    mutationFn: async (muted: boolean) => {
      const res = await setChannelMuteAction({ channelId, muted })
      if (!('data' in res) || !res.data) {
        throw new Error(('error' in res && res.error) || 'Impossible de modifier la sourdine')
      }
      return res.data.muted
    },
    onMutate: async (muted) => {
      await queryClient.cancelQueries({ queryKey: muteKey(channelId) })
      const previous = queryClient.getQueryData<boolean>(muteKey(channelId))
      queryClient.setQueryData(muteKey(channelId), muted)
      return { previous }
    },
    onError: (error, _muted, context) => {
      queryClient.setQueryData(muteKey(channelId), context?.previous ?? false)
      toast.error(error.message)
    },
  })

  const toggleMute = useCallback(() => {
    if (isLoading) return // état inconnu : une bascule pourrait appliquer le mauvais sens
    mutate(!isMuted)
  }, [isLoading, isMuted, mutate])

  return { isMuted, toggleMute }
}
```

## Points d'attention


- **Autres canaux de notification** (courriel, badge de non-lus) : ils ne lisent pas `mutedAt` tant qu'on ne les branche pas dessus. Dis-moi s'ils existent.

## Tests à prévoir

Sur `notifyChannelMembers` avec les services mockés :

- un membre en sourdine ne reçoit rien ;
- l'auteur du parent en sourdine reçoit la notification dédiée, et une seule ;
- le parent exclu ou ancien membre ne reçoit pas de dédiée ;
- la sourdine de l'expéditeur n'a aucun effet sur les destinataires.

Pour les actions : `setChannelMuteAction` refuse un utilisateur qui n'est pas membre, et un autre canal de la même organisation.
