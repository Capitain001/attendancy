Voici le plan corrigé. Les points que tu as listés sont appliqués. En relisant le skill, j'ai trouvé  dautres écarts de plus (le dernier point de la liste ci-dessous) : l'update ne passait pas par `validateWithId`, et la mutation n'avait ni `tryConstraint` ni `invalidateEvent`. Ils sont corrigés aussi.

La colonne `mutedAt DateTime?` sur `ChannelMember` ne change pas.

**Ce qui change par rapport au plan**
- **Logique de notification** : le calcul des destinataires et la sourdine vont dans l'opération. L'action `notifyChannelMembersAction` ne change pas, elle passe déjà `parentUserId`.
- **Soft-delete** : `channel: { orgId, deletedAt: null }` dans les deux requêtes sur la sourdine de l'utilisateur.
- **Organisation des actions** : plus de `channel-mute.actions.ts`. La lecture va dans `actions/channel-member.queries.ts`, l'écriture dans `actions/channel-member.mutations.ts`.
- **Noms alignés sur `database/`** : `getChannelMuteByUser` et `updateChannelMuteByUser`, avec le suffixe `Action` côté actions. J'ai pris `update` plutôt que `set`, car c'est le verbe du skill pour une mutation d'un modèle existant.
- **Update via `validateWithId`** : l'entrée de l'action devient `{ channelId, data: { muted } }`, avec un schéma englobant et un schéma du payload seul, comme la norme V2.
- **Mutation** : `tryConstraint` autour de Prisma et `invalidateEvent` après coup.

**Opération de notification (fichier complet)**

```typescript
// services/notification/domains/chat/operations/notification.chat.mutations.ts
import 'server-only'
import { getChannelRecipients } from '@/services/channel-member/server'
import { sendPushNotificationToUserById } from '@/services/notification/server'
import { buildMessage } from '@/services/notification/messages/message.messages'

import { MAX_NOTIFICATION_MESSAGE } from '../constants'
import type { NotifyChannelMembersOutput } from '../validation'

type NotifyChannelMembersParams = NotifyChannelMembersOutput & {
  orgId: string
  senderId: string
  senderName: string
  content: string // lu en base par l'appelant, jamais fourni par le client
  // Auteur du message cité, null si pas une réponse (ou parent supprimé / sans auteur)
  parentUserId: string | null
}

/**
 * Notifie les membres du canal, hors expéditeur, hors `excludedIds` et hors sourdine.
 * Une réponse directe traverse la sourdine du canal.
 * Ne vérifie AUCUN droit : l'appelant a établi l'appartenance au canal et la paternité du message.
 * Best-effort : un échec de push n'est pas remonté.
 */
export async function notifyChannelMembers({
  orgId,
  channelId,
  messageId,
  content,
  senderId,
  senderName,
  parentUserId,
  excludedIds,
}: NotifyChannelMembersParams) {
  const members = await getChannelRecipients({
    channelId,
    excludedIds: [senderId, ...excludedIds],
  })

  // Sourdine : coupe le canal, sauf pour l'auteur du message cité. `parentUserId` ne correspond
  // à un membre de la liste que s'il est encore membre et non exclu : pas de contrôle en plus.
  const recipientIds = members
    .filter((member) => !member.mutedAt || member.userId === parentUserId)
    .map((member) => member.userId)

  const preview = content.slice(0, MAX_NOTIFICATION_MESSAGE)

  await Promise.allSettled(
    recipientIds.map((userId) =>
      sendPushNotificationToUserById(userId, {
        orgId,
        // Le texte dépend du destinataire : la règle vit dans buildMessage
        message: buildMessage({ recipientId: userId, parentUserId, senderName, preview }),
        resourceType: 'MESSAGE',
        resourceId: messageId,
        event: 'CREATED',
        metadata: { channelId },
      }),
    ),
  )
}
```

Je n'ai pas les fichiers du service `channel-member`, donc les blocs suivants sont à ajouter dans les fichiers existants.

**Couche database**

```typescript
// services/channel-member/database/channel-member.queries.ts — à ajouter
// Tous les destinataires potentiels, avec leur sourdine : le filtrage se fait dans l'opération
// de notification, parce qu'une réponse directe traverse la sourdine.
// Pas de "use cache" : lecture faite à l'instant de l'envoi, une sourdine doit agir tout de suite.
// Reprends ici les mêmes filtres que getChannelMemberIds (membre actif, canal non supprimé…).
export async function getChannelRecipients({ channelId, excludedIds }: { channelId: string; excludedIds: string[] }) {
  return prisma.channelMember.findMany({
    where: { channelId, userId: { notIn: excludedIds } },
    select: { userId: true, mutedAt: true },
  })
}

// Sourdine de l'utilisateur sur un canal de son organisation.
// null = pas membre (ou canal supprimé). Sans "use cache" : l'UI relit l'état après chaque bascule.
export async function getChannelMuteByUser({ channelId, userId, orgId }: { channelId: string; userId: string; orgId: string }) {
  return prisma.channelMember.findFirst({
    where: { channelId, userId, channel: { orgId, deletedAt: null } },
    select: { mutedAt: true },
  })
}
```

```typescript
// services/channel-member/database/channel-member.mutations.ts — à ajouter
import type { UpdateChannelMuteDataOutput } from '../validation'

// updateMany : permet le filtre sur le canal (orgId, non supprimé) et rend count sans lecture
// préalable. count = 0 : l'utilisateur n'est pas membre de ce canal.
export async function updateChannelMuteByUser(
  { channelId, userId, orgId }: { channelId: string; userId: string; orgId: string },
  data: UpdateChannelMuteDataOutput,
) {
  const result = await tryConstraint(
    prisma.channelMember.updateMany({
      where: { channelId, userId, channel: { orgId, deletedAt: null } },
      data: { mutedAt: data.muted ? new Date() : null },
    }),
  )

  await invalidateEvent('CHANNEL_MEMBER_MUTE_UPDATED', orgId, channelId)
  return result
}
```

L'événement `CHANNEL_MEMBER_MUTE_UPDATED` est à déclarer dans `cache.ts` (`CHANNEL_MEMBER_GRAPH`). Comme aucune requête mise en cache n'expose `mutedAt`, sa liste de tags peut rester vide.

**Validation**

```typescript
// services/channel-member/validation.ts — à ajouter
import { validateWithId } from '@/utils/server/validation'

export const getChannelMuteByUserSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
})

export type GetChannelMuteByUserInput = v.InferInput<typeof getChannelMuteByUserSchema>
export type GetChannelMuteByUserOutput = v.InferOutput<typeof getChannelMuteByUserSchema>

// Payload seul. `muted` est une valeur explicite plutôt qu'une bascule : un retry reste idempotent.
// Pas de `satisfies` Prisma : `muted` n'est pas une colonne, la colonne est `mutedAt`.
export const updateChannelMuteDataSchema = v.object({ muted: v.boolean() })

export type UpdateChannelMuteDataInput = v.InferInput<typeof updateChannelMuteDataSchema>
export type UpdateChannelMuteDataOutput = v.InferOutput<typeof updateChannelMuteDataSchema>

export const updateChannelMuteSchema = validateWithId('channelId', updateChannelMuteDataSchema)

export type UpdateChannelMuteInput = v.InferInput<typeof updateChannelMuteSchema> // { channelId, data }
export type UpdateChannelMuteOutput = v.InferOutput<typeof updateChannelMuteSchema>
```

**Actions**

```typescript
// services/channel-member/actions/channel-member.queries.ts — à ajouter
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS, ERROR_CODES } from '@/config'
import { getChannelMuteByUser } from '../database'
import { getChannelMuteByUserSchema } from '../validation'
import type { GetChannelMuteByUserInput } from '../validation'

export async function getChannelMuteByUserAction(input: GetChannelMuteByUserInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(getChannelMuteByUserSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    // userId vient de la session : on ne lit que sa propre sourdine
    const member = await getChannelMuteByUser({ channelId: parsed.output.channelId, userId: user.id, orgId })
    if (!member) return { error: 'Accès refusé' }
    return { data: { muted: member.mutedAt !== null } }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}
```

```typescript
// services/channel-member/actions/channel-member.mutations.ts — à ajouter
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS, ERROR_CODES } from '@/config'
import { updateChannelMuteByUser } from '../database'
import { updateChannelMuteSchema } from '../validation'
import type { UpdateChannelMuteInput } from '../validation'

export async function updateChannelMuteByUserAction(input: UpdateChannelMuteInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(updateChannelMuteSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  const { channelId, data } = parsed.output

  try {
    // userId vient de la session : on ne peut couper que son propre canal
    const { count } = await updateChannelMuteByUser({ channelId, userId: user.id, orgId }, data)
    if (count === 0) return { error: 'Accès refusé' }
    return { data: { muted: data.muted } }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}
```

**Hook `useChannelMute.ts` (fichier complet)**

```typescript
'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getChannelMuteByUserAction, updateChannelMuteByUserAction } from '@/services/channel-member/actions'

const muteKey = (channelId: string) => ['channel-mute', channelId] as const

export function useChannelMute(channelId: string) {
  const queryClient = useQueryClient()

  const { data: isMuted = false, isLoading } = useQuery({
    queryKey: muteKey(channelId),
    queryFn: async () => {
      const res = await getChannelMuteByUserAction({ channelId })
      if (!('data' in res) || !res.data) {
        throw new Error(('error' in res && res.error) || 'Impossible de lire la sourdine')
      }
      return res.data.muted
    },
    staleTime: 60_000, // un changement fait sur un autre appareil arrive au refetch (focus inclus)
  })

  const { mutate } = useMutation({
    mutationFn: async (muted: boolean) => {
      const res = await updateChannelMuteByUserAction({ channelId, data: { muted } })
      if (!('data' in res) || !res.data) {
        throw new Error(('error' in res && res.error) || 'Impossible de modifier la sourdine')
      }
      return res.data.muted
    },
    // Mise à jour optimiste, avec retour en arrière si le serveur refuse
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


**À mettre à jour en plus**, puisque le skill le compte dans le livrable :
- le `CLAUDE.md` du service `channel-member` : les deux nouvelles fonctions, la colonne `mutedAt` et l'événement de cache ;
- `generated.types.ts` : à régénérer par le script pour obtenir `GetChannelMuteByUserDto`.