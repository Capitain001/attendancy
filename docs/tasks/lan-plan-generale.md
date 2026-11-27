Étape A : CLI (main.rs, cli.rs, global-setup)
main.rs et KNOWN_OPTIONS : inclut --token, --port, --bind, --members, --host-user, --max-connections, --rate-burst, --rate-per-sec et --stop-on-stdin-eof. Rejette les options inconnues (option inconnue : --xxx, code 2) — garde-fou de mise au point et de contrat de test (non de sécurité réseau), à assouplir si la CLI évolue vite.

Validation des valeurs : refuse les jetons vides et les valeurs illisibles (--port, --max-connections, --rate-burst, --rate-per-sec) en ERROR bad_options: <message> (code 2).

StartError::code() dans hub.rs : expose un code machine stable (port_in_use, permission_denied, address_unavailable, start_failed) formaté en ERROR <code>: <message> (code 1).

Arrêt par --stop-on-stdin-eof : écoute la fermeture de stdin dans un thread dédié pour ne pas retenir l'arrêt du runtime et sortir proprement avec code 0 (comportement sous Windows à vérifier à l'exécution).

tests/cli.rs : couvre l'arrêt via stdin, les erreurs de démarrage (ERROR <code>:), les options/valeurs refusées et l'acceptation de toutes les options connues.

tests/global-setup.ts et vitest.config.ts : compile chat-relay via cargo build -p chat-relay avant les tests Vitest (sauf si CHAT_RELAY_BIN est défini, en veillant à ce que le binaire pointé ne soit pas obsolète).

Étape B : welcome plafonné en octets
Champ max_welcome_bytes dans HubConfig : limite la taille du welcome en octets dès maintenant (sans attendre l'essai appareil), en omettant d'abord les messages les plus anciens.

Compteur de séquence d'insertion dans Channel : ordonne les messages entre canaux via un compteur de séquence local (sans se fier à createdAt envoyé par les pairs) pour trier et tronquer proprement.

Test et mutation : un test vérifie la troncature en octets et échoue si la coupure est retirée.

Étape C : battement, file bornée et write_timeout
Inactivité (idle_timeout dans HubConfig, ~60 s) : échéance persistante mise à jour uniquement à la réception d'une trame entrante (jamais réinitialisée par un envoi sortant).

File de sortie bornée et éviction : capacité configurée dans HubConfig avec try_send. Si la file est pleine, un signal d'éviction dédié déclenche la fermeture du client lent par une trame Close (sans perte silencieuse ; le rattrapage passe par known au hello).

write_timeout et tampons TCP pleins : tous les envois (réponses, relais, Close) passent par un helper avec write_timeout pour ne pas bloquer la boucle ni l'arrêt. Si les tampons TCP sont saturés et que l'écriture expire, la connexion est coupée sans garantie que la trame Close ait pu partir.

Tests et mutations : un test et une mutation pour chacun des trois ajouts (file pleine avec gros volumes de données pour saturer réellement la file, inactivité, write_timeout).


Étape D : brique 4 (relay-host.ts et contrats)
relay-host.ts : lance le binaire avec --stop-on-stdin-eof (arrêt propre aussi sous Windows) et lit LISTENING. Accepte token, hostUserId, members, port, bind et maxConnections. Vérifie avant lancement que hostUserId est présent dans members lorsque les deux sont fournis (HostNotInMembers), refuse un second start actif (AlreadyStarted), et traduit ERROR <code> en erreurs typées.

Suite hostContract : vérifie l'écoute sur un port réel, stop() puis start() autorisé, l'idempotence de stop(), et le cas du port occupé.

Branchement des E2E : rattache les tests E2E existants à ce helper.


Brique	État
1	Décisions	Actées (docs\tasks\decision-lan.md)
2	Relais Rust	Livré et vérifié
3	Essai jetable sur appareil	Validé (PC Windows ↔ iPhone OK ; essai Android packagé reporté à la brique 7)
4	Hôte Node (LanHost) et faux relais	Livré et vérifié (relay-host.ts, host.contract.test.ts, E2E branchés)
5	Tests du transport ; compléments e2e et unitaires	Livré et vérifié
6	Provider, composants packages/ui, LanPanel, route	livre et verifier
7	Adaptateur Tauri, suite de contrat du WebSocketCtor, hôte natif, transport local de l'hôte, profils métier	Prochaine étape (à faire)

## Prochaine étape : Brique 6 (Provider, composants `packages/ui`, `LanPanel`, route)
- Brancher `ChatSyncProvider` avec `createLanTransport` et l'UI (`LanPanel`, QR code / URL / jeton, mention « identité déclarée »).
- Puis Brique 7 : adaptateur Tauri (hôte natif `chat_relay::start`, tri IP Rust, transport local hôte `post_as_host`/`subscribe`/`snapshot`, profils métier `maxConnections`) et validation sur Android packagé.