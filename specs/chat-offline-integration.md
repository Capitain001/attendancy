# Plan : intégration du chat offline dans les apps clientes

## Contexte

Le prototype de [`_integrations/chat-offline`](../_integrations/chat-offline/README.md) fournit une outbox/inbox IndexedDB, une fusion de messages, un moteur de synchronisation, un transport LAN et un hub Rust/Tauri. Le périmètre utilisateur est constitué des apps clientes Tauri : `apps/teacher` héberge le hub; `apps/desktop` peut servir de client de test ou de participant si son écran chat est retenu.

Il n’ajoute pas de parcours offline ni de WebSocket à l’interface Next.js. `apps/web` reste nécessaire côté serveur pour les actions métier et le point d’accès RPC que les apps Tauri utilisent lorsqu’elles retrouvent Internet. Le hook partagé peut rester dans `apps/web/src/hooks` selon la convention du dépôt, mais il n’est pas branché à l’UI Next.js.

Ce plan complète, sans les dupliquer, l’[analyse d’intégration](../docs/analyses/chat-offline.md), la [fiche produit](../docs/features/chat-offline-etudiants.md) et la [spécification technique chat offline](../docs/rapport/2026-10-26-feature-chat-offline.md). Il ne couvre pas le BLE mesh ni la RPC de synchronisation par un pair tiers.

**Recommandation de transport :** dans les apps Tauri, utiliser `@tauri-apps/plugin-websocket` comme implémentation injectable de `WebSocketImpl`. La connexion part de Rust et évite les restrictions propres au WebView; elle ne chiffre toutefois pas `ws://`. Garder le LAN hors production tant que l’identité des pairs et le chiffrement attendu ne sont pas définis.

## Analyse domaine et propriété des modèles

| Modèle / donnée | Existe ? | Service owner | Conséquence |
|---|---|---|---|
| `Message` | Oui, avec `id`, `createdAt`, `signature`, `channelId`, `parentId` | `chat` | Pas de migration requise pour l’outbox de l’auteur; utiliser l’UUID client comme `Message.id` et `sentAt` comme date proposée. |
| `Channel` / `ChannelMember` | Oui | `chat` | Les lectures, participants et envois doivent vérifier l’adhésion au canal et l’organisation active. |
| Outbox / inbox / états offline | Non, données locales | package `chat-offline` | Elles restent sur l’appareil; définir isolation, rétention et suppression au changement de compte. |
| Session de QR / identité cryptographique d’un appareil | Pas dans le contrat du prototype | à décider | Ne pas supposer que le `sessionId` du QR ou un `userId` envoyé par le client authentifie un pair. |

1. **La donnée existe-t-elle déjà ?** Oui : `Message` et ses requêtes sont dans `apps/web/src/services/chat`. La requête actuelle prend les 50 plus anciens messages; la récupération offline devra charger les plus récents avec un ordre stable.
2. **La fonction transforme-t-elle ou fusionne-t-elle ?** Oui : fusionner les messages serveur, les copies LAN non vérifiées et l’outbox locale constitue le rôle du moteur du package. Les actions service restent responsables de valider et persister, pas de réimplémenter cette fusion.
3. **Qui fournit les données ?** L’écran fournit le `channelId` et les messages serveur; l’identité auteur vient de la session authentifiée, jamais d’un `userId` reçu du client. L’application hôte fournit le contexte de compte/session au stockage local.

## Arborescence cible

### Package et transports

```text
packages/chat-offline/
  package.json                    → package workspace et scripts reproductibles
  src/                            → outbox, inbox, fusion, sync, pairing et transport
  src/idb.ts                      → store IndexedDB avec portée explicite
  tests/                          → tests unitaires et E2E adaptés au workspace

packages/chat-hub/
  Cargo.toml                      → crate Rust du relais LAN
  src/                            → code actuellement dans _integrations/chat-offline/hub

Cargo.toml                        → déclarer chat-hub dans le workspace Cargo
apps/teacher/src-tauri/Cargo.toml → dépendance locale chat-hub
apps/teacher/src-tauri/src/lib.rs → commandes start/stop et état Tauri géré
```

Le contenu est déplacé depuis `_integrations/chat-offline/chat-offline` et `_integrations/chat-offline/hub`; conserver le dossier prototype jusqu’à validation des tests et du build. Déclarer `idb-keyval` comme dépendance réelle du package ou injecter le store; ne pas compter sur une dépendance transitive ou peer optionnelle absente des applications.

### Service chat

```text
apps/web/src/services/chat/
  CLAUDE.md                       → conventions du service à créer
  validation.ts                   → entrée avec id, sentAt, channelId, contenu, parentId
  types.ts                        → DTOs utilisés par actions et hook
  database/message.queries.ts     → membership, parent, messages récents, participants
  database/message.mutations.ts   → création idempotente et collision d’UUID
  actions/message.queries.ts      → lectures authentifiées et autorisées
  actions/message.mutations.ts    → sendMessageAction authentifiée
  .api/                           → contrats générés à synchroniser
  __tests__/                      → cas de sécurité et d’idempotence

apps/web/src/lib/rpc/actions.ts   → allowlist des actions chat
packages/rpc/src/generated/chat.ts → stub régénéré, ne pas éditer manuellement
```

### Hook et interfaces

```text
apps/web/src/hooks/chat/useOfflineChat.ts → orchestration partagée hook/package/RPC
apps/web/src/hooks/chat/index.ts          → export du hook
apps/teacher/src-tauri/src/lib.rs         → démarrer/arrêter le hub enseignant
apps/teacher/src/lib/chat/...             → adaptateur plugin et contrôles client Tauri
apps/teacher/package.json                 → plugin JavaScript si Teacher ouvre le hub
apps/desktop/src/lib/chat/...             → adaptateur seulement si Desktop consomme le chat
apps/desktop/package.json                 → plugin si Desktop est un client du chat
UI des apps Tauri                          → connecter les états offline au parcours validé
```

Le hook partagé reste une source commune aux builds Vite; aucune page Next.js ne consomme le mode offline. Aucun appel à `useChat()` n’a été trouvé et `apps/teacher` ne contient pas actuellement de route de chat : repérer ou valider les écrans Tauri avant de considérer le remplacement d’un hook comme une livraison fonctionnelle.

## Phase 0 — Décisions bloquantes

Valider avant d’activer le LAN en production :

1. **Périmètre Tauri** : `apps/teacher` héberge le hub; confirmer quels autres clients Tauri (notamment Desktop) ont un écran chat et participent. L’interface Next.js n’est pas une cible de cette intégration.
2. **Confiance LAN** : le QR partagé et `ws://` ne prouvent pas l’identité de l’auteur. Définir chiffrement et authentification des pairs, ou accepter explicitement que les messages LAN soient non vérifiés et empêcher leur présentation comme messages serveur.
3. **Session du QR** : lier le QR à une classe/canal et à une séance, fixer son expiration et invalider le jeton à l’arrêt. Dans le prototype, `sessionId` n’est pas appliqué par le protocole.
4. **Données locales** : isoler inbox/outbox par utilisateur et organisation; préciser le comportement au logout/changement de compte, la rétention et la perte des messages reçus si le hub s’arrête.
5. **Messages hors ligne** : confirmer la règle de date (le README propose une borne de sept jours) et si un message reçu d’un pair doit rester exclusivement non vérifié jusqu’à son acceptation par le serveur.

**Découpage recommandé :** garder le scope serveur limité à l’auteur authentifié qui synchronise sa propre outbox. La synchronisation d’un message au nom d’un autre appareil (gateway peer), la vérification de signature et le BLE relèvent d’une phase séparée de la spécification technique existante.

## Phase 1 — Prisma / schéma

- **Aucune modification Prisma ni migration** pour l’intégration de l’outbox de l’auteur : `Message.id`, `createdAt` et `signature` existent déjà, ainsi que l’adhésion au canal.
- Ne pas renseigner `Message.signature` avec une valeur factice pour marquer un message offline. Le champ ne représente une preuve d’origine que si le protocole de signature correspondant est effectivement implémenté.
- Si le périmètre retenu inclut ultérieurement un envoi par un pair tiers, traiter d’abord les clés d’appareil et la vérification de signature selon la spécification dédiée; cette évolution n’est pas implicite dans ce plan.

## Phase 2 — `database/`

### `database/message.queries.ts`

- `isChannelMember({ channelId, userId, orgId })`: vérifier membership et appartenance du canal à l’organisation active; ne pas accepter le `userId` du client.
- `getMessageChannelId({ messageId, orgId })`: retourner le canal uniquement pour un message accessible dans l’organisation; utilisé pour valider `parentId`.
- `getMessages({ channelId, limit, before? })`: sélectionner les champs nécessaires, exclure les messages supprimés, plafonner `limit` (50 par défaut), trier par `createdAt desc` puis `id desc`, et inverser les résultats si l’UI attend l’ordre chronologique.
- `getRoomParticipants({ channelId, orgId })`: sélectionner seulement les informations nécessaires et n’exposer les membres qu’à un membre autorisé du canal.
- Pas de cache Next partagé pour les messages live; l’état de requête et ses invalidations restent dans le cache React Query côté client.

### `database/message.mutations.ts`

- `createMessage({ id, content, channelId, parentId, userId, createdAt })`: persister l’id client stable et utiliser l’auteur authentifié.
- En cas de collision d’ID, relire la ligne et ne considérer l’opération comme idempotente que si auteur, canal, parent et contenu correspondent; sinon retourner un conflit. Ne pas masquer les erreurs DB non prévues.
- Ne pas persister les messages de l’inbox LAN comme auteur courant. Seule l’outbox de l’auteur passe par cette mutation.

## Phase 3 — `actions/` et RPC

### `actions/message.mutations.ts`

- `sendMessageAction(input)` : `getUserInfo()` → organisation du contexte authentifié → `v.parse()` → membership dans le canal → vérifier que `parentId` appartient au même canal → borner `sentAt` selon la décision de phase 0 → `createMessage`.
- Ignorer tout identifiant d’auteur transmis par le client. Retour strict `{ data } | { error }` pour validation, refus et erreurs applicatives; une coupure réseau du client RPC doit rester une exception `NetworkError`, pas être convertie en succès ou en `{ error }`.
- Garder une signature à un seul argument `input`, comme l’exige le transport RPC.

### `actions/message.queries.ts`

- Protéger `getMessagesAction({ channelId, limit, before? })` et l’action de participants avec la même vérification de compte, organisation et membership.
- Refuser l’accès à un canal d’une autre organisation, même si son ID est valide.

### Allowlist et génération

- Inscrire uniquement les actions consommées par les apps Tauri dans `apps/web/src/lib/rpc/actions.ts`.
- Régénérer les stubs par `bun --filter @attendancy/rpc gen`; utiliser exclusivement `@/services/chat/actions` depuis le hook partagé.
- Synchroniser les contrats générés `.api/`, les types DTO et vérifier le mode RPC par `bun --filter @attendancy/web api:check`.
- Toute mutation acceptée invalide ou met à jour la query React Query du canal, afin que le message serveur remplace sa copie outbox/inbox sans doublon.

## Phase 4 — Package offline et hook partagé

- Déplacer le cœur TypeScript et ses tests dans `packages/chat-offline`; conserver les interfaces `KVStore` et les adapters testables, puis exposer des sous-chemins stables pour le cœur et IndexedDB.
- Partitionner le stockage local : inbox au minimum par compte, organisation et canal/séance; outbox par compte et canal. Éviter qu’un changement de compte rende visibles ou confirmables les messages d’un autre utilisateur.
- Traiter explicitement logout, purge/expiration, erreurs IndexedDB et fermeture de `BroadcastChannel`; ne pas avaler silencieusement les échecs de stockage.
- Créer `useOfflineChat` sous `apps/web/src/hooks/chat`, avec imports RPC depuis `@/services/chat/actions`. Ce hook est source partagée compilée par les apps Tauri; ne pas l’utiliser pour ajouter un parcours offline à Next.js. Il compose le cache des messages persistés et les données locales, démarre/arrête le moteur, écoute le retour en ligne et expose `send`, `retry`, `discard` et l’état LAN.
- Garder des états visuels distincts `pending`, `failed`, `unverified` et `sent`. Une copie locale reçue ne devient `sent` qu’après confirmation serveur pour le même ID.
- Brancher le hook dans le véritable écran chat des apps Tauri après validation du parcours. Le QR reste masqué/désactivé si la phase 0 n’a pas validé la sécurité du transport.

## Phase 5 — Hub Rust/Tauri, WebSocket natif et pairing

- Ajouter `packages/chat-hub` au workspace Cargo racine et le référencer depuis `apps/teacher/src-tauri/Cargo.toml`.
- Adapter `start_chat_hub` / `stop_chat_hub` dans `apps/teacher/src-tauri/src/lib.rs`: état Tauri géré, démarrage unique, arrêt explicite, erreurs propagées; ne pas garder de verrou pendant un `await` et ne pas utiliser `unwrap()` sur un verrou.
- Le front ne doit obtenir que les informations nécessaires pour afficher le QR; les membres transmis au hub ne remplacent jamais le contrôle d’accès serveur.
- Ajouter et enregistrer le plugin officiel `@tauri-apps/plugin-websocket` dans les apps qui se connectent au hub; ajouter `tauri-plugin-websocket` à leur crate Rust et `websocket:default` à la capability de la fenêtre Tauri concernée.
- Implémenter l’adaptateur injectable `WebSocketImpl` autour de `connect`, `addListener`, `send` et `disconnect`. Respecter leur nature asynchrone, retirer les listeners à la fermeture et propager les erreurs d’envoi/connexion; ne pas reprendre tel quel un adaptateur qui fait `void ws.send(...)`.
- La permission Tauri autorise la connexion mais ne restreint pas l’hôte à une route ou à un écran : vérifier le schéma, l’adresse privée et le port avant tout `connect`; ne jamais exposer ni journaliser le jeton, et ne faire confiance ni au QR ni à l’identité auto-déclarée par le client.
- Pour l’enseignant sur son propre appareil, utiliser `127.0.0.1`; les autres clients utilisent l’adresse LAN annoncée dans le QR. Relier réellement jeton, canal et séance, valider l’expiration et arrêter le hub à la fin de la séance.
- Le transport Rust évite les restrictions de WebSocket propres au WebView et ne nécessite pas d’exception globale de cleartext pour ce chemin natif. Il ne supprime pas les permissions/contraintes réseau de plateforme : prévoir `NSLocalNetworkUsageDescription` sur iOS et valider sur appareils Android/iOS réels.
- Vérifier la toolchain de tous les builds Tauri : la documentation actuelle du plugin requiert Rust 1.90 minimum.
- **Gate de mise en production :** `ws://` reste en clair, même via Rust. Le champ `Message.signature` n’assure ni confidentialité ni authenticité sans signature cryptographique liée à une clé d’appareil et effectivement vérifiée. Pour passer le gate, choisir `wss://` avec validation de certificat adaptée au LAN, ou un chiffrement applicatif authentifié; définir séparément l’identité des pairs. Un pilote `ws://` éventuel doit être limité à un réseau contrôlé et afficher clairement que les messages LAN ne sont pas chiffrés.

## Phase 6 — Cache, tests et validations

### Cache / invalidations

- Aucun nouveau graphe de cache serveur attendu pour les messages temps réel.
- Le hook met à jour/invalide la query React Query du canal quand une mutation est confirmée; confirmer également les entrées multi-onglet via le mécanisme de l’outbox.

### Tests ciblés à ajouter

- Service : refus d’un non-membre, accès cross-organisation, parent d’un autre canal, idempotence du même message et conflit d’ID avec contenu/auteur différents, ordre stable des 50 messages les plus récents.
- Package : isolation inbox/outbox entre comptes, convergence message local → message serveur, retry réseau sans perte, refus serveur distinct d’une panne réseau, fermeture/purge.
- Hub : token invalide, canal non autorisé, arrêt/reprise; E2E du binaire réel avec le nouveau chemin Cargo.
- Adaptateur Tauri : cycle connexion/fermeture, évènements Close/Error, envoi rejeté, déconnexion pendant la connexion, validation d’URL/IP/port.
- Interface cliente : états `pending` / `unverified` / `failed` / `sent`, scan d’un QR expiré ou pour un autre canal, démarrage/arrêt du hub.

### Commandes post-implémentation

```powershell
bun --filter @attendancy/rpc gen
bun --filter @attendancy/web check:naming:svc -- chat
bun --filter @attendancy/web check:types:svc -- chat
bun --filter @attendancy/web generate:api:svc -- chat
bun --filter @attendancy/web api:check
bun --filter @attendancy/web test -- src/services/chat
bun --filter @attendancy/teacher check-types
bun --filter @attendancy/teacher build
bun --filter @attendancy/desktop check-types
bun --filter @attendancy/desktop build
cargo test -p chat-hub
cargo check --manifest-path apps/teacher/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```

Ajouter puis exécuter les scripts de tests du package TypeScript et de ses E2E après son transfert; mettre à jour les chemins d’exécution du binaire vers le `target/` Cargo partagé. Construire l’APK Teacher (`bun run build:android` depuis `apps/teacher`) et l’APK Desktop si cette app est retenue comme client. Valider sur appareils réels : Wi-Fi avec isolation client, hotspot, permissions réseau, passage en arrière-plan/écran éteint, perte et retour d’Internet. Le build APK seul ne valide pas le réseau local.

## Risques / décisions

| Décision | Recommandation | Alternative écartée | Risque si mal implémenté |
|---|---|---|---|
| Source de vérité | PostgreSQL confirme seul un message `sent`; garder les copies LAN marquées non vérifiées jusqu’à confirmation | Traiter un ACK du hub comme une livraison serveur | Faux indicateur de sauvegarde et perte silencieuse |
| Identité d’auteur | JWT/session pour l’envoi de sa propre outbox; auteur dérivé du serveur | Faire confiance au `userId` du handshake ou permettre le gateway tiers dès cette intégration | Usurpation et messages persistés sous une identité arbitraire |
| Transport client Tauri | Adapter injectable avec `tauri-plugin-websocket`; LAN de production conditionné par chiffrement et identité | Autoriser largement le cleartext ou croire que le plugin chiffre `ws://` | Lecture/injection de messages sur le réseau local |
| Cible | Apps clientes Tauri validées (Teacher hébergeur; Desktop si retenu); aucun mode offline Next.js, BLE ni DM | Ajouter implicitement un parcours web ou étendre à tous les clients | Surface d’accès et tests impossibles à borner |
| Identifiant/date | UUID stable client comme `Message.id`; date bornée côté serveur | Générer un nouvel ID au retry ou accepter toute date cliente | Doublons, ordre incohérent et dates manipulables |
| Stockage local | Inbox isolée par compte/organisation/canal; politique de rétention validée | Store global partagé entre comptes | Fuite de messages locaux après changement de compte |
| Schéma | Pas de migration pour l’outbox de l’auteur | Ajouter un booléen offline ou renseigner `signature` sans cryptographie | État métier trompeur et migration inutile |
