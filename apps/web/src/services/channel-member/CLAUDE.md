# Service : channel-member

Gère les membres d'un canal de discussion (`ChannelMember`), leurs droits d'accès et leur état de sourdine (`mutedAt`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/channel-member.queries.ts` | `isChannelMember`, `getChannelMember`, `getChannelMemberIds`, `getChannelRecipients`, `getChannelMuteByUser` |
| `database/channel-member.mutations.ts` | `updateChannelMuteByUser` |
| `cache.ts` | `CHANNEL_MEMBER_GRAPH` — événement `CHANNEL_MEMBER_MUTE_UPDATED` |
| `validation.ts` | `getChannelMuteByUserSchema`, `updateChannelMuteSchema`, `updateChannelMuteDataSchema` |
| `actions/channel-member.queries.ts` | `getChannelMemberAction`, `getChannelMuteByUserAction` |
| `actions/channel-member.mutations.ts` | `updateChannelMuteByUserAction` |
| `server.ts` | Exports serveur (`isChannelMember`, `getChannelMemberIds`, `getChannelRecipients`) pour les autres services |

## Invariants

- `mutedAt` nullable (`DateTime?`) : `null` = notifications actives, non-nul = sourdine active.
- Pas de `"use cache"` sur la sourdine : l'effet de coupure et de réactivation des notifications est immédiat.
- Scoping organisationnel : toute modification ou lecture de sourdine valide l'appartenance de l'utilisateur au canal au sein de son organisation (`channel: { orgId, deletedAt: null }`).
- Sourdine côté serveur : le push est filtré au moment de l'envoi (`notifyChannelMembers`), une réponse directe à son propre message traverse la sourdine.
