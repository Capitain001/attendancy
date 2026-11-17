# `@attendancy/chat`

## Role

Moteur TypeScript independant du framework pour composer le chat local hors
ligne, synchroniser les messages en attente avec le serveur et echanger des
enveloppes entre pairs via un ou plusieurs transports.

## Donnees et stockage

- `Envelope` est le format commun des messages entre pairs; `OutboxItem`,
  `ChatMessage` et `PersistedMessage` representent les etats locaux et serveur.
- `KVStore<T>` definit l'interface minimale `get/set/del/entries`.
  `memoryStore` fournit une implementation memoire.
- L'entree secondaire `@attendancy/chat/idb` expose `idbStore(dbName)`,
  une implementation IndexedDB. Elle utilise un magasin separe et n'est pas
  effacee par le persister React Query de `@attendancy/cache`.
- `createOutbox` filtre les elements par utilisateur et gere leurs etats
  pending/failed; l'option `crossTab` notifie les autres onglets.
- `createInbox` dedoublonne les messages recus, conserve leur heure de
  reception, permet de les confirmer ou de purger les plus anciens.

## Synchronisation et reconciliation

`createChatSync` combine une outbox, une inbox, un callback d'envoi serveur et
des transports. Les messages sont ajoutes localement avant l'envoi. Une erreur
reseau levee laisse le message pending; une reponse `{ error }` le marque
failed. `flush()` serialize les envois et reessaie periodiquement. A la
reconnexion d'un transport, les messages en attente sont renvoyes aux pairs.

`mergeMessages` fusionne les messages serveur, inbox et outbox par identifiant:
les donnees serveur sont prioritaires, puis les messages pairs non verifies,
puis les envois locaux. Le resultat est trie par date et identifiant.
`clampSentAt` borne les dates fournies par un client hors ligne avant
l'enregistrement serveur.

## Pairing et transport LAN

`encodePairing`/`decodePairing` produisent et valident l'URI
`attendancy://chat`. Le decodeur n'accepte que des hotes locaux, un port valide,
un jeton et un identifiant de session. `createLanTransport` implemente
`ChatTransport` sur WebSocket avec reconnexion, ACK avec timeout et fermeture
sur rejets fatals.

Le type `ChatTransport` permet d'ajouter un autre transport sans changer le
moteur. Le relais Rust correspondant est documente dans
[`crates/chat-relay`](../../crates/chat-relay/README.md).

## Etat d'integration

Le package est autonome et n'est pas encore consomme par `apps/web`,
`apps/teacher` ou `apps/desktop`. Le seul adaptateur present dans le module chat
web est un brouillon commente dans
`apps/web/src/modules/chat/message/queued.ts`. Le branchement au hook, au
transport RPC et au cycle de vie Tauri est encore a faire; voir
[`specs/chat-offline-integration.md`](../../../../specs/chat-offline-integration.md).

## Dependances et verification

Le runtime principal n'impose pas de stockage. `idb-keyval` est un
peerDependency optionnel necessaire seulement a l'entree `/idb`.

```powershell
bun --filter @attendancy/chat test
bun --filter @attendancy/chat typecheck
```
