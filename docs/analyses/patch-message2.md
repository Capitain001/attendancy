
. Si le serveur remplace createdAt par l’heure courante, le cache de l’expéditeur garde la date du client (via toEntityPatch) jusqu’au prochain refetch, et le message sauterait de place à ce moment-là. Il faut donc renvoyer createdAt : le retour serveur est déjà prioritaire dans la fusion à trois couches de useCrudEntity.

dans apps\web\src\services\message\database\message.mutations.ts
```ts
const findOwn = ({ id, userId, channelId }: { id: string; userId: string; channelId: string }) =>
  prisma.message.findFirst({ where: { id, userId, channelId }, select: { createdAt: true } })

export async function createMessage({ orgId, ...data }: CreateMessageOutput & { userId: string; orgId: string }) {
  const now = new Date()
  // R3 : la date du client n'est retenue que si elle est plausible, sinon heure du serveur
  const createdAt = data.createdAt && isTrustedCreatedAt(data.createdAt, now) ? data.createdAt : now

  if (data.parentId) {
    const parent = await prisma.message.findUnique({
      where: { id: data.parentId },
      select: { channelId: true, deletedAt: true },
    })
    const refusal = checkParent(parent, data.channelId)
    if (refusal) {
      // Un rejeu légitime passe d'abord (ack perdu, parent supprimé entre-temps)
      const own = await findOwn(data)
      if (own) return { id: data.id, created: false, createdAt: own.createdAt }
      const e = MESSAGE.ERRORS[refusal]
      throw new AppError({ message: e.error, code: e.code })
    }
  }

  const { count } = await tryConstraint(
    prisma.message.createMany({ data: [{ ...data, createdAt }], skipDuplicates: true }),
  )
  if (count > 0) {
    await invalidateEvent('MESSAGE_CREATED', orgId, data.channelId)
    return { id: data.id, created: true, createdAt }
  }

  // Rejeu : la ligne d'origine fait foi, date comprise
  const own = await findOwn(data)
  if (!own) throw new AppError({ message: ERRORS.UNIQUE.ID, code: ERROR_CODES.CONFLICT })
  return { id: data.id, created: false, createdAt: own.createdAt }
}
```
Côté client : diffuser la date du serveur

Dans persist, le broadcast partait avec la date du brouillon. Si le serveur l’a remplacée, les autres afficheraient la fausse date jusqu’à leur refetch :

```ts

//apps\web\src\hooks\chat\useChat.ts ligne 207
let created
try {
  created = await persistMessage?.({ id, ...draft })
} catch {
  setOutbox((current) => ({ ...current, [id]: { ...draft, status: 'failed' } }))
  return
}

// Date retenue par le serveur (R3) : celle du brouillon peut avoir été refusée
const createdAt = created?.createdAt ? new Date(created.createdAt).toISOString() : draft.createdAt
sendRealtimeMessage({ id, content: draft.content, createdAt, parentId: draft.parentId })
  .catch((error) => console.error('Erreur lors de la diffusion temps réel:', error))

```


patch policy 

export type MessageRefusal = /* ... */ | 'PARENT_DELETED'
// dans la table ERRORS (hors RETRYABLE_CODES, donc définitif) :
PARENT_DELETED: { error: 'Message parent supprimé', code: ERROR_CODES.BAD_REQUEST },

export function checkParent(
  parent: { channelId: string; deletedAt: Date | null } | null,
  channelId: string,
): MessageRefusal | null {
  if (!parent) return 'PARENT_MISSING'
  // Canal avant suppression : n'indique pas l'état d'un message d'un autre canal
  if (parent.channelId !== channelId) return 'PARENT_WRONG_CHANNEL'
  return parent.deletedAt ? 'PARENT_DELETED' : null
}