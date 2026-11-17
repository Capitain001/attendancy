# Packages techniques

Cette documentation couvre les packages partages sous `packages/`. Le crate
Rust est documente separement sous
[`crates/chat-relay`](../crates/chat-relay/README.md).
Chaque fiche decrit le role du package, ses interfaces et son cycle de generation
ou de verification.

## Fiches

| Package                      | Role                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| [`app`](./app/README.md)     | Shell partage des applications React et TanStack Router     |
| [`auth`](./auth/README.md)   | Session Supabase, authentification client et transport RPC  |
| [`cache`](./cache/README.md) | React Query et persistance locale IndexedDB                 |
| [`chat`](./chat/README.md)   | Moteur client de chat, synchronisation et stockage offline  |
| [`db`](./db/README.md)       | Client et types Prisma generes                              |
| [`rpc`](./rpc/README.md)     | Adaptateurs generes pour les Server Actions exposees en RPC |
| [`types`](./types/README.md) | Contrat TypeScript partage du RPC                           |
| [`ui`](./ui/README.md)       | Composants, providers, styles et primitives d'interface     |

## Integrations presentes

```text
apps/teacher ─┐
apps/desktop ─┼─> @attendancy/app ─> @attendancy/auth ─> @attendancy/rpc
              │                  ├─> @attendancy/cache
              │                  └─> @attendancy/ui
              └─> @attendancy/types

apps/web ───────> @attendancy/ui, @attendancy/types, packages/db (Prisma genere)
```

Le RPC conserve les Server Actions et Prisma sur le serveur web. Les packages
clients ne contiennent que le shell, le transport, le cache et les contrats
partages. Les fiches de [RPC](./rpc/README.md) et de [types](./types/README.md)
completent [`rpc-systeme.md`](../rpc-systeme.md).

## Chat hors ligne : integration a faire

`@attendancy/chat` et le crate `chat-relay` existent, mais ne sont pas
encore branches aux applications. Le package TypeScript n'est une dependance
d'aucune app; le code d'adaptation dans `apps/web/src/modules/chat/message/queued.ts`
est commente. Le crate Rust n'est pas membre du workspace Cargo racine et n'est
pas une dependance des crates Tauri. Le flux Tauri/hub reste donc une cible
d'integration, decrite dans [`specs/chat-offline-integration.md`](../../../specs/chat-offline-integration.md).
