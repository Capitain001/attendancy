# Analyse de l’intégration chat offline pour les étudiants

## Contexte et conclusion

Le dossier [`chat-offline/`](../../_integrations/chat-offline/) contient un prototype d’échange de messages entre étudiants sur un réseau local, lorsque le serveur Internet est indisponible. L’enseignant héberge un hub sur son appareil Tauri; les étudiants s’y connectent par QR code. Les messages sont ensuite synchronisés avec le serveur dès qu’un client retrouve Internet.

**Avis : le prototype est pertinent pour ce besoin étudiant, mais il n’est pas encore prêt à intégrer.** Il est cohérent de le conserver comme travail préparatoire, sans le brancher à l’application avant d’avoir clarifié l’identité des participants, l’isolation des données locales et les contraintes de déploiement Tauri/Android.

Cette analyse porte sur le contenu présent dans `chat-offline/`; elle ne constitue pas une demande d’implémentation.

## Architecture proposée

Le prototype sépare trois responsabilités :

- [`chat-offline/src/outbox.ts`](../../chat-offline/chat-offline/src/outbox.ts) garde les messages rédigés localement en attente d’acceptation par le serveur.
- [`chat-offline/src/inbox.ts`](../../chat-offline/chat-offline/src/inbox.ts) conserve temporairement les messages reçus d’un pair, explicitement non vérifiés.
- [`chat-offline/src/engine.ts`](../../chat-offline/chat-offline/src/engine.ts) relaie les messages via un transport LAN et vide l’outbox quand l’action serveur accepte les messages.

Le hub Rust est un relais temporaire, non la source de vérité. Les messages envoyés par le hub restent en attente locale jusqu’à confirmation du serveur. À la réception de la version persistée, la copie LAN non vérifiée est supprimée. Le modèle évite donc de traiter une donnée relayée localement comme un message officiellement enregistré.

## Adéquation avec les conventions du projet

Mon objection précédente selon laquelle le hook serait incompatible avec Tauri parce qu’il importe une Server Action était erronée. [`docs/techs/hooks-partages.md`](../techs/hooks-partages.md) prévoit précisément que les hooks partagés importent les actions depuis `@/services/<service>/actions`, et que Vite remplace cet import au build par le stub RPC. Le hook d’intégration peut donc être partagé entre Web et Tauri si ses imports et l’action respectent cette architecture.

Le prototype devra toutefois suivre le workflow documenté :

1. Placer le hook partagé sous `apps/web/src/hooks/`.
2. Importer l’action avec le chemin `@/services/chat/actions` (et non `@/services/chat` comme dans l’exemple actuel).
3. Vérifier la signature à argument unique `input`, l’allowlist RPC et le stub généré.
4. Utiliser le type `NetworkError` du client RPC pour que React Query conserve son cache offline lors d’une coupure réseau.

`@attendancy/chat-offline` a vocation à contenir la logique indépendante du framework (outbox, inbox, fusion, moteur de sync et transport), tandis que le hook React partagé l’adapte aux actions RPC et à l’UI.

## Points forts

### Écriture locale et synchronisation différée

`createChatSync.send()` ajoute d’abord le message à l’outbox puis tente le transport LAN et le serveur. L’envoi serveur est séquentiel. Une exception réseau laisse l’élément en attente; une réponse `{ error }` le marque comme échoué pour retry manuel. L’identifiant stable permet les renvois et la déduplication.

### Le serveur reste la source de vérité

Le hub conserve les messages en mémoire et les relaie aux clients autorisés; il ne confirme pas la persistance serveur. C’est une bonne limite de responsabilité pour une intégration qui doit fonctionner localement sans faire croire qu’un message non synchronisé est durable.

### Découpage testable

Le cœur TypeScript utilise une interface `KVStore` et fournit un store mémoire pour les tests. Les tests unitaires couvrent notamment outbox, retry, fusion des versions serveur/LAN/locales, dates et appairage. Des tests de bout en bout utilisent le binaire Rust réel du hub.

## Réserves avant intégration

### 1. Isoler l’inbox par compte

L’outbox filtre les entrées par `userId` et son `BroadcastChannel` inclut l’identifiant du compte. L’inbox, elle, est créée avec un store commun et ses entrées ne portent pas de `userId`. Sur un appareil utilisé avec plusieurs comptes, les messages LAN non vérifiés d’un compte pourraient donc être listés ou confirmés par un autre compte.

**À décider avant intégration :** partitionner l’inbox par compte, ou inclure l’identité dans sa clé de stockage et dans ses opérations `list`, `confirm` et `knownIds`. L’isolation doit également couvrir l’organisation/la session si un même compte peut utiliser plusieurs contextes hors ligne.

### 2. Définir la confiance accordée à l’identité LAN

Le client transmet son `userId` dans le handshake et dans l’enveloppe. Le hub vérifie que l’auteur de l’enveloppe correspond à ce `userId`, et vérifie l’appartenance au canal à partir de la table `members` fournie à sa configuration. Mais le client contrôle le `userId` qu’il annonce : cela ne constitue pas une preuve d’identité.

Le QR fournit un jeton de session partagé; le transport est `ws://` sans chiffrement. Un pair du réseau local qui obtient le QR peut tenter de se connecter et d’usurper un identifiant autorisé. L’UI doit donc continuer à marquer ces messages comme non vérifiés, et le périmètre de menace doit être accepté explicitement avant un usage en classe.

### 3. Lier le QR à la session/canaux attendus

`Pairing` contient `sessionId`, mais `LanOptions`, le handshake du protocole et le hook d’intégration ne l’utilisent pas. L’URL et le jeton ne lient donc pas actuellement le QR à une session métier donnée. Il faut définir si cette valeur doit restreindre les canaux, déterminer sa durée de validité et empêcher sa réutilisation hors de la séance concernée.

### 4. Le hub ne garantit pas la conservation après arrêt

Le backlog du hub est en mémoire et borné. À l’arrêt ou au redémarrage de l’app hébergeant, les messages non encore synchronisés par le serveur disparaissent du hub. Les auteurs gardent leur propre outbox, mais un pair qui n’a reçu qu’une copie LAN peut la perdre si son stockage local est effacé ou si sa période de conservation arrive à échéance.

Il faut décider si cette perte temporaire est acceptable pour le besoin étudiant; sinon, prévoir une persistance locale du hub et une politique de conservation/quotas.

### 5. Clarifier les erreurs serveur et les retries

Dans le moteur, une exception de `sendToServer` signifie « réseau indisponible » et conserve le message en attente; un résultat `{ error }` signifie « échec définitif » et demande un retry manuel. L’action d’intégration fournie convertit toutefois toute exception en `{ error }`. Il faut distinguer les refus métier (accès, validation) des erreurs serveur transitoires pour ne pas classer une panne temporaire comme un échec définitif.

### 6. Compléter le cycle d’intégration du hook partagé

L’exemple [`integration/5-useOfflineChat.ts`](../../chat-offline/integration/5-useOfflineChat.ts) appelle `sendMessageAction` depuis un chemin qui ne suit pas l’alias RPC prévu. Le contrat devra aussi vérifier que les actions sont exportées dans l’allowlist et que les stubs sont générés.

Par ailleurs, `idb-keyval` est déclaré dans `apps/desktop`, mais pas dans `apps/web` d’après les manifests examinés. Si le hook partagé importe l’entrée `@attendancy/chat-offline/idb`, chaque application qui bundle ce hook doit pouvoir résoudre cette dépendance, ou le store IndexedDB doit être injecté depuis l’application hôte.

### 7. Valider les contraintes Tauri et Android sur appareils réels

Le README identifie déjà les risques de `ws://` en WebView HTTPS, du cleartext Android, de la suspension du hub en arrière-plan et de l’isolation Wi-Fi des clients. Ce sont des contraintes structurantes : elles conditionnent si l’enseignant peut réellement héberger le hub et si les appareils étudiants peuvent s’y connecter.

## Structure et validation du dépôt

Le code est actuellement sous `chat-offline/chat-offline/` et `chat-offline/hub/`, plutôt que dans les workspaces `packages/*`. Le prototype n’est pas encore déclaré comme workspace Bun/Cargo. Le dossier `chat-offline/` apparaît non suivi par Git dans l’état du dépôt consulté.

Les tests n’ont pas pu être confirmés dans cet environnement :

- `npm test` dans le package TypeScript échoue car `vitest` n’est pas installé dans ce dossier.
- `cargo test` dans `hub/` échoue car Cargo le détecte sous le workspace racine sans que ce package soit déclaré parmi ses membres ou exclusions.

Ces échecs de lancement ne prouvent pas que les tests ou le code sont incorrects; ils indiquent que les commandes documentées ne sont pas exécutables depuis la structure actuelle du monorepo sans configuration ou installation supplémentaire.

## Proposition de trajectoire, sans implémentation immédiate

1. **Confirmer le scénario produit étudiant** : qui héberge, quels appareils se connectent, durée d’une séance, volume maximal, et niveau de perte acceptable lors de l’arrêt du hub.
2. **Arrêter le modèle de confiance et d’isolation** : identité LAN, durée/portée du jeton, cloisonnement inbox/outbox, séparation par compte/session/canal.
3. **Rendre les packages exécutables dans le monorepo** : emplacement workspace du package TypeScript et du hub Rust, dépendances déclarées, commandes de tests reproductibles.
4. **Brancher l’action et le hook conformément aux hooks partagés** : contrat RPC, classification des erreurs réseau/métier, cache React Query et UI des états `pending`, `failed`, `unverified`, `sent`.
5. **Valider sur les plateformes cibles** : WebView Tauri, Android en premier plan/arrière-plan, réseau Wi-Fi d’établissement et hotspot.

**Décision recommandée :** conserver ce dossier comme prototype d’architecture pour un futur chat étudiant offline. Le cœur outbox/inbox/reconciliation est une base utile; l’intégration métier, la sécurité LAN, l’isolation locale et la compatibilité opérationnelle restent à spécifier et valider avant tout déploiement.
