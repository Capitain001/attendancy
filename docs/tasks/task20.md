# Passation : chantier « chat LAN » (projet « chat app »)

**Légende.**
- **[VÉRIFIÉ]** : compilé et exécuté par moi (bac à sable : Rust 1.75, `tokio` épinglé 1.43, `tokio-tungstenite` 0.24, Node 22, vitest 2.1.9 avec `ws`), ou lu dans un fichier fourni.
- **[RAPPORTÉ]** : dit par l'utilisateur, non vu.
- **[SUPPOSÉ]** : déduit, jamais vu.
- **[ACTÉ]** : décidé par l'utilisateur.

**Avertissement central.** Je n'ai jamais vu l'état actuel de `packages/chat/src/*.ts`, ni les `Cargo.toml`, ni le projet Tauri. Mes tests TypeScript ont tourné contre une **reconstruction** de `lan-transport.ts`, pas contre le vrai fichier.

**Conventions [ACTÉ].** Français. Plan validé avant tout code. Chemin en première ligne de chaque fichier (`//packages\chat\tests\x.ts`, barres inverses). Ne pas renvoyer en entier les fichiers à peine modifiés. L'utilisateur exécute les tests en local. Il est sous Windows (chemins `C:\PROJECTS\…`).

## 1. Objectif et vision [ACTÉ]

- **Moteur LAN générique**, sans notion métier. Quatre primitives : héberger, rejoindre, échanger, appairer.
- **Le métier ne fournit que des paramètres** : classe (le QR revient à l'enseignant), DM à deux, propriétaire de canal, événement. Le `sessionId` est opaque pour le moteur. Le seul point d'entrée métier est la liste `channels` du `hello`.
- **Construire brique par brique**, tester les primitives avant tout usage métier. La cible : un hôte qu'on crée, un autre utilisateur qui s'y connecte, le tout testé. L'interface et les profils viennent après.
- **Découpage [ACTÉ, arborescence fournie par l'utilisateur]** :
  - `packages/ui/src/components/chat/` : `useDelayedFlag.ts`, `lan/{lan-status.ts, QrScanner.tsx, JoinLan.tsx, HostLan.tsx}`. Ce sont des composants purs, contrôlés, qui n'importent pas le moteur.
  - `apps/web/src/modules/chat/lan/` : `useSyncCounts.ts`, `LanPanel.tsx`. C'est la seule colle moteur↔interface.
  - `apps/chat/src/routes/_app/local.tsx`.
- **Cas d'usage listés par l'IA interne de l'utilisateur** : classe, DM, propriétaire, événement, salle d'examen. Non faisables avec l'architecture en étoile : maillage BLE, mDNS complet. Je corrige l'une de ses affirmations : « 100 % prêt » pour l'enseignant est faux, car l'hôte natif et le choix de l'adresse manquent.

## 2. Décisions actées

1. **Relais embarqué en bibliothèque** (pas en sidecar).
   - *Raison* : un sidecar est impossible sur iOS et très limité sur Android. `HubHandle` est `Send + Sync` (test). L'arrêt et le port sont contrôlables dans le processus.
   - *Remise en cause* : l'essai appareil montre que l'hôte ne survit pas en arrière-plan, ou seul l'hôte bureau est utile.
2. **Connexion des clients côté Rust** (`tauri-plugin-websocket`), via un adaptateur de `WebSocketCtor`.
   - *Raison* : ni contenu mixte ni CSP depuis Rust, et `createLanTransport` accepte déjà `WebSocketImpl`.
   - *Remise en cause* : le plugin ne garantit pas `onclose` exactement une fois. Le comportement du plugin est **[SUPPOSÉ]**, jamais vu.
3. **Identité de l'hôte réservée** (version minimale).
   - L'identifiant de l'hôte est refusé aux clients réseau (`author_reserved`, au `hello` comme sur les messages). L'hôte publie par une API locale du relais, et non par une socket.
   - Entre élèves, l'identité reste **déclarée** : l'interface doit l'afficher comme telle. Le justificatif signé (`credential`, champ réservé dans le `hello`, distinct de `sig`) est différé pour l'examen et les canaux privés.
   - *Remise en cause* : un besoin d'examen ou de canal privé, ou une attaque réelle.
4. **Débit** : plafond généreux (100 d'un coup, puis 50 par seconde), refus `rate_limited` avec délai conseillé, et réessai côté transport.
   - *Raison* : hors ligne, le LAN est le seul chemin vers les autres élèves, donc un refus ne doit pas perdre un message.
5. **Compteur de génération** dans le transport (course `stop()`/`start()` pendant `known()`, diagnostic confirmé).
6. **Essai jetable sur appareil avant l'interface** : Android d'abord, puis iOS.
7. **Dates** : seule règle R3 du serveur (`isTrustedCreatedAt`). `clampSentAt` est abandonné. Renommage `sentAt` → `createdAt` sans compatibilité (développement).
8. **Déféré** : envoi de fichiers (la taille de message est configurable), signature `sig`, `credential` vérifié, mDNS, mesh, profils métier, source de `--members`, hôte natif, interface LAN.

## 3. Architecture

### Contrats

```ts
// À écrire (brique 4). Aucune notion métier.
interface LanHost {
  start(o: { token: string; port?: number; bind?: string; members?: Record<string, string[]> }): Promise<{ port: number }>
  stop(): Promise<void>
}
type LocalAddresses = () => Promise<string[]> // IPv4 privées candidates : sujet à part
```

`hostUserId` manque au contrat (question 3 de la section 6). `current()` a été retiré : la reprise de séance relève de l'application.

```ts
// lu dans lan-transport.ts (première version fournie) [VÉRIFIÉ]
type WebSocketLike = { send(data: string): void; close(): void
  onopen: ((ev: unknown) => void) | null;  onmessage: ((ev: { data: unknown }) => void) | null
  onclose: ((ev: unknown) => void) | null; onerror: ((ev: unknown) => void) | null }
type WebSocketCtor = new (url: string) => WebSocketLike

// ChatTransport (engine.ts, version ancienne) : name, start(), stop(), status(), send(env): Promise<void>,
//   onReceive(cb), onStatus(cb). status() ∈ 'idle' | 'connecting' | 'connected' | 'closed'.
//   Ajout de ma part : failure?(): string | null.
```

**Contrat de comportement exigé de tout `WebSocketCtor` [SUPPOSÉ, suite `webSocketCtorContract` à écrire]** :
- `onclose` appelé **exactement une fois**, y compris après un échec de connexion. Sans lui, la reconnexion ne se déclenche jamais.
- `onopen` appelé une fois.
- `data` reçu sous forme de chaîne.
- `close()` idempotent.
- Gestionnaires posés juste après la construction.
- `readyState` n'est pas utilisé.

```rust
// API publique du relais [VÉRIFIÉ : compilée et testée]
pub async fn start(cfg: HubConfig, bind: &str) -> Result<HubHandle, StartError>
impl HubHandle { pub addr: SocketAddr
  fn snapshot(&self) -> Vec<Envelope>;  fn peer_count(&self) -> usize
  fn subscribe(&self) -> broadcast::Receiver<Envelope>              // messages venus du réseau, pas ceux de l'hôte
  fn post_as_host(&self, env: Envelope) -> Result<bool, &'static str> // Ok(false) = doublon
  async fn stop(self) }                                              // Drop : déclenche seulement l'arrêt
enum StartError { PortInUse{bind}, PermissionDenied{bind}, AddressNotAvailable{bind}, Io(io::Error) } // Display en français
```

### Protocole [VÉRIFIÉ]
- **Enveloppe** : `v` (=1), `id`, `channelId`, `authorId`, `authorName?`, `content`, `parentId?`, `createdAt`, `sig?`.
- **Client → relais** : `hello {token, userId, name?, channels, known, credential?}`, `msg {env}`, `ping`.
- **Relais → client** : `welcome {backlog, peers}`, `msg {env}`, `ack {id, dup}`, `reject {id?, reason, retryAfterMs?}`, `pong`.
- **Raisons de refus du relais** : `bad_hello`, `bad_token`, `author_reserved`, `not_member`, `bad_frame`, `bad_version`, `bad_id`, `bad_channel`, `bad_content`, `author_mismatch`, `channel_limit`, `rate_limited`. Détectées par le transport : `insecure_context`, `unsupported`.
- **Fatales côté transport** : `bad_token`, `not_member`, `bad_hello`, `author_reserved`, et **seulement si le `reject` n'a pas d'`id`** (niveau `hello`). Avec un `id`, seul ce message échoue. Un `rate_limited` avec `id` est renvoyé au plus 5 fois, après `min(retryAfterMs, 5 s)` (500 ms par défaut).
- **Fermetures** : 1001 à l'arrêt du relais, 1008 pour inondation. Une connexion refusée avant la poignée de main (relais plein) ne reçoit aucun message.
- **Valeurs par défaut de `HubConfig`** : message 64 Kio, 256 connexions, 32 sans `hello`, 64 canaux, 64 canaux déclarés au `hello`, 1000 ids connus, 500 messages gardés par canal, `hello` sous 5 s, débit 100 puis 50/s, 20 refus consécutifs avant coupure, délai de grâce de 2 s.
- **CLI** : `--token`, `--port`, `--bind`, `--members`, `--host-user`, `--rate-burst`, `--rate-per-sec`. Écrit `LISTENING <adresse>` sur stdout.

### Rôles
- `crates/chat/relay` : relais Rust (bibliothèque et binaire `chat-relay`).
- `packages/chat` : moteur hors ligne (outbox et inbox persistantes, `createChatSync`, `createLanTransport`, `encodePairing`/`decodePairing`, `limits`). **[VÉRIFIÉ par les tests de l'utilisateur]** : `createChatSync` accepte `onSent`, `acceptsChannel`, `attach`, `retry(id, change)`, et `SendResult` peut valoir `{ error, retryable? }`. L'appairage `attendancy://chat?h&p&t&s` accepte `10/8`, `127/8`, `192.168/16`, `172.16/12`, `169.254/16`, `localhost` et `*.local`. Il refuse les hôtes publics, l'IPv6 et les ports invalides.
- Côté application (hors LAN) : `ChatSyncProvider`, `useChat`, hooks de messages, interface du fil. Ma proposition de `ChatSyncProvider` est **[SUPPOSÉ]**, jamais compilée.

## 4. État par brique (plan en 7 étapes, validé)

| # | Brique | État |
|---|---|---|
| 1 | Décisions | Actées, sauf les valeurs par défaut (section 6) |
| 2 | Relais Rust | **Livré et vérifié** |
| 3 | Essai jetable sur appareil | Non fait |
| 4 | Hôte Node (`LanHost`) et faux relais | Faux relais livré ; `relay-host.ts` et `hostContract` non faits |
| 5 | Tests du transport ; compléments e2e et unitaires | Transport livré (sur reconstruction) ; compléments non faits |
| 6 | Provider, composants `packages/ui`, `LanPanel`, route | Non fait. Mes premières versions sont rejetées (annexe) |
| 7 | Adaptateur Tauri, suite de contrat du `WebSocketCtor`, hôte natif, transport local de l'hôte, profils métier | Non fait |

**Brique 2 [VÉRIFIÉ].** Arrêt propre (`stop().await` et `Drop`), plafonds, limites de connexions, débit, identité de l'hôte, port occupé typé : 37 tests (33 d'intégration, 4 unitaires sur le seau à jetons). Test de mutation : 6 casses volontaires (signal d'arrêt ignoré, débit retiré, place sans `hello` non rendue, port gardé pendant le délai de grâce, protection de l'hôte retirée, plafond de taille retiré), toutes détectées. **[RAPPORTÉ]** : l'utilisateur dit que les tests fonctionnent chez lui, avec `tokio-tungstenite` 0.24.

**Brique 5 [VÉRIFIÉ sur la reconstruction].** 25 tests : 22 contre le faux relais (`lan-transport.test.ts`) et 3 contre le vrai binaire (`e2e-relay-limits.test.ts`). Sur ma reconstruction sans compteur de génération, la course est reproduite (deux sockets ouvertes, dont une orpheline). Un mutant survit : la garde `acks.get(id) !== p`, redondante.

**Relance (par l'utilisateur).** `cargo test -p chat-relay`. Puis `cargo build -p chat-relay` et vitest dans `packages/chat`. La variable `CHAT_RELAY_BIN` surcharge le chemin du binaire (mon e2e) ; son e2e d'origine a un chemin fixe. Le test d'arrêt par signal est ignoré sous Windows.

## 5. Non couvert ou fragile

- **File de sortie du relais** [lu dans le code] : une file non bornée par client, sans éviction d'un lecteur lent. Un client qui ne lit plus fait grossir la mémoire. Aucun test.
- **Inactivité** : seuls les clients envoient des pings (20 s, silence détecté à 2,5 fois). Le relais n'a ni battement ni délai d'inactivité : une connexion à moitié morte reste comptée dans `peers` jusqu'à l'erreur TCP **[effet SUPPOSÉ]**.
- **Taille du `welcome`** : tout l'historique (jusqu'à 500 messages par canal, jusqu'à 64 canaux) part dans **une** trame, sans plafond en sortie. Peut dépasser ce qu'un client accepte **[SUPPOSÉ]**.
- **Identité déclarée** : `userId` du `hello` n'est pas prouvé. `--members` filtre des identités déclarées, ce n'est **pas** un contrôle d'accès. Sans lui, quiconque voit le QR écrit dans n'importe quel canal. Chez les pairs, un message d'intrus reste « non confirmé » jusqu'à la purge de 7 jours.
- **Envois en parallèle** : les réessais `rate_limited` repartent tous ensemble, et 5 essais ne suffisent pas. Le moteur envoie en séquence (`pushTo`), donc il n'est pas concerné. Limite documentée, non corrigée.
- **Après épuisement des réessais** : le message reste en attente jusqu'à la reconnexion suivante (renvoi seulement à la transition vers `connected`).
- **Relais plein** : coupure silencieuse avant la poignée de main. L'élève voit une panne réseau, sans raison.
- **Adresse à publier** : plusieurs interfaces (Wi-Fi, VPN, Docker). `0.0.0.0` est refusé par l'appairage. IPv6 refusé.
- **Hôte** : il ne peut plus se connecter comme client. Il faut un transport local (`post_as_host` / `subscribe`), jamais conçu.
- **Mobile [SUPPOSÉ]** : iOS suspend l'hébergement en arrière-plan et exige l'autorisation « réseau local ». Android demande un service de premier plan (petit plugin Kotlin) pour héberger écran éteint. Windows et macOS : invite du pare-feu au premier lancement.
- **Contenu mixte** : `ws://` bloqué depuis une page `https` hors `localhost` **[SUPPOSÉ]**, non testé. Le transport détecte la `SecurityError` (testé avec un constructeur factice).
- **Dépendances côté serveur** : le canal doit exister côté serveur, sinon la resynchronisation refuse tout. Les réponses à un message non confirmé reposent sur `PARENT_MISSING` retryable. Dans la `policy.ts` vue, un parent supprimé reste mappé sur ce code retryable (correction `PARENT_DELETED` proposée, application inconnue).
- **Autres** : inbox sans plafond d'entrées, `ChatSyncProvider` reçoit `channelIds={[]}` (vu dans `route.tsx`), donc `acceptsChannel` rejetterait tout.

## 6. Questions ouvertes (avec recommandation)

1. **Valeurs par défaut de `HubConfig`** (section 3) : les garder ? *Recommandation : oui, à réviser après l'essai appareil.*
2. **Flags `--rate-burst` / `--rate-per-sec`** : les garder dans le binaire ? *Oui, inoffensifs.*
3. **`LanHost.start` doit-il prendre `hostUserId` ?** *Oui.* Et le second `start` d'un même hôte : refus explicite plutôt qu'idempotence silencieuse.
4. **Transport local de l'hôte** : *un `ChatTransport` branché sur `post_as_host` et `subscribe` (commandes et événements Tauri), même enveloppe.*
5. **Choix de l'adresse** : *fonction pure en Rust (filtre loopback, link-local, interfaces virtuelles) et liste affichée s'il y a plusieurs candidats.*
6. **Priorité mobile** : Android d'abord pour l'essai. *Oui.*
7. **`--members` hors ligne** : liste mise en cache avant la séance ? *Différer, mais ne pas présenter le LAN comme contrôlé.*
8. **`welcome` volumineux** : *plafonner par canal ou envoyer l'historique en plusieurs trames ; trancher à l'essai appareil.*
9. **Relais** : ajouter un battement serveur et une file de sortie bornée avec éviction. *Oui, petit chantier.*
10. **Où en sont les correctifs du transport chez l'utilisateur ?** (généreration, réessai, `author_reserved`). Si ses tests TS passent, ils y sont **[à confirmer]**.

## 7. Prochaine étape exacte

D'abord, récupérer les vrais fichiers de la liste A (au minimum `lan-transport.ts` et `engine.ts` actuels). Ensuite **brique 4** :
- trancher la forme de `LanHost.start` (`hostUserId`, double `start`) ;
- écrire `packages/chat/tests/helpers/relay-host.ts` : un `LanHost` qui lance le binaire (`--port 0`, lecture de `LISTENING`, `--members` via un fichier temporaire, `--host-user`, arrêt par signal, avec le cas Windows) ;
- écrire la suite `hostContract(host)` : port réel renvoyé, `start` après `stop`, `stop` idempotent, port occupé donnant une erreur lisible ;
- rebrancher les e2e existants dessus.

La preuve de l'arrêt de la bibliothèque reste dans les tests Rust, pas dans cette suite.

## Annexe : erreurs et revirements de la session

- **`onSent`** : j'avais écrit « push seulement si `created` ». Faux : un rejeu après ack perdu ne notifierait jamais. Corrigé : on notifie à chaque `onSent`.
- **`clampSentAt`** recommandé puis retiré : il place un message trop vieux au milieu de l'historique (trou de pagination). La règle R3 de l'utilisateur est meilleure.
- **Interface `ChatTransport`** à extraire : abandonnée après lecture du package. Le transport ne concerne que les pairs, le serveur passe par `sendToServer`.
- **Interface LAN livrée trop tôt** (`LanPanel`, `HostLan` avec un `HubController` mêlant lancement, adresse et reprise, `JoinLan`, `QrScanner`, `lan-status`, `useSyncCounts`, route `/local`) : rejetée. Elle épousait le cas enseignant. Seule idée récupérable : les composants purs et contrôlés.
- **`HostLan` se connectait à son propre relais par `127.0.0.1`** : invalide depuis l'identité réservée.
- **Avis de l'IA interne** : « 100 % prêt » et « messages bloqués à la resynchro » corrigés (section 1 et section 5).
- **Défauts de tungstenite** : j'avais écrit 16 Mio par message ; en réalité 64 Mio par message et 16 Mio par trame.
- **Plan** : essai appareil d'abord prévu après l'interface, avancé avant elle. `Drop` « avec la même logique » : corrigé, `Drop` ne fait que déclencher. `hostContract` : je lui prêtais la preuve de l'arrêt, or tuer un processus libère tout ; la preuve est dans les tests Rust.
- **Vérification Rust** : un échec apparent (test de libération du port) venait de ma méthode : le dossier de mutation partageait le répertoire de compilation avec le vrai projet. Refait proprement, aucun défaut du relais. Une mutation (port gardé) a survécu au premier jeu de tests : test ajouté.
- **Test de rafale** : mon premier test envoyait en parallèle et échouait. Cela a révélé la limite des envois parallèles ; test réécrit en séquence.

## Liste A : fichiers réels à ajouter aux connaissances du projet

**Ne pas ajouter mes reconstructions comme si c'étaient les fichiers réels.**

| Chemin | Rôle | Statut |
|---|---|---|
| `packages/chat/src/lan-transport.ts` (actuel) | Transport LAN réel, jamais revu depuis les correctifs | **À modifier** |
| `packages/chat/src/engine.ts` (actuel) | `createChatSync` (`onSent`, `attach`, `receive` strict) | À modifier |
| `packages/chat/src/{limits, inbox, outbox, types, pairing, store, merge, index, idb-store}.ts` (actuels) | Moteur hors ligne (je n'ai vu que l'ancienne version) | Référence |
| `packages/chat/package.json`, config vitest, `tsconfig` | Gestionnaire de paquets et lanceur inconnus | Référence |
| `Cargo.toml` racine du workspace, `crates/chat/relay/Cargo.toml`, `Cargo.lock` | Versions, fonctionnalités, MSRV | Référence |
| `crates/chat/relay/src/*.rs` | Seulement s'ils diffèrent de ma livraison | Référence |
| `lan-chat.md` (spec d'intégration citée par l'IA interne) | Jamais vue | Référence |
| `src-tauri/` : `Cargo.toml`, `tauri.conf.json`, capacités, commandes et état existants, config iOS/Android | Nécessaire à la brique 7 | Référence |
| `packages/ui/src/components/chat/**` (si déjà présents) | Composants LAN existants | À modifier |
| `packages/chat/tests/unit.test.ts`, `e2e-relay.test.ts` (versions actuelles) | Tests de l'utilisateur | Référence |

**À NE PAS ajouter** : `lan-transport.reconstruction.ts` (ma reconstruction), et mes composants LAN de la livraison prématurée (`LanPanel`, `HostLan`, `JoinLan`, `QrScanner`, `lan-status`, `useSyncCounts`, `local.tsx`), dont les noms coïncident avec l'arborescence de l'utilisateur mais dont le contenu est rejeté.

## Liste B : autres fichiers de la session à passer au contexte du projet

En plus des derniers envoyés (relais Rust, `lan-transport.test.ts`, `e2e-relay-limits.test.ts`, `faux-relay.ts`, qui sont des références) :

| Chemin | Rôle | Statut |
|---|---|---|
| `src/services/message/policy.ts` | Règles R1 à R3, `RETRYABLE_CODES` | Référence (à modifier : `PARENT_DELETED`) |
| `src/services/message/database/message.mutations.ts` | Création idempotente, parent, `editedAt` | À modifier (R3 : renvoyer `createdAt`) |
| `src/services/message/validation.ts`, `types.ts` | Schémas valibot | Référence |
| `src/hooks/entity/useEntity.ts`, `useCrudEntity.ts` | Moteur de cache (`reconcileOnRefetch`, `updateItems`) | Référence |
| `src/hooks/data/chat/{useMessages, useOlderMessages, reconcile}.ts` | Données, pagination, réconciliation | Référence |
| `src/hooks/chat/{useChat, use-realtime-chat, types, utils}.ts` (versions locales) | Fusion, outbox, temps réel | À modifier (branchement LAN) |
| `src/modules/chat/ChatSyncProvider.tsx` | Mon adaptateur : **proposition non validée** | À modifier |
| `src/modules/chat/ui/*` | Mon interface du fil : **jamais compilée** | Référence |
| `apps/chat/src/routes/_app/route.tsx` | Montage du provider (`channelIds={[]}`) | À modifier |

## Message de démarrage (à coller en premier dans la nouvelle session)

> Reprends le chantier « chat LAN » du projet « chat app » avec le document de passation ci-joint : lis-le en entier, y compris la légende [VÉRIFIÉ]/[RAPPORTÉ]/[SUPPOSÉ]/[ACTÉ] et l'annexe des erreurs.
> Prochaine étape : brique 4, `LanHost` implémenté par un helper Node qui lance le binaire `chat-relay`, plus la suite `hostContract`.
> Avant de coder, demande-moi les vrais fichiers de la liste A (au minimum `lan-transport.ts` et `engine.ts` actuels) et la décision sur `hostUserId` dans `LanHost.start`.
> Ne recompile rien et ne relance aucun test dans cette session : je les exécute en local.
> Travaille par petites étapes, en proposant le plan avant tout code, avec un chemin `//dossier\fichier.ts` en première ligne de chaque fichier.
> Ne renvoie pas en entier les fichiers à peine modifiés.
> Distingue toujours ce que tu as vu de ce que tu supposes.