# `chat-relay` (crate Rust)

## Role

Relais WebSocket ephemere sur le reseau local pour le chat hors ligne. Le crate
expose une bibliotheque utilisable par un hote Rust et un binaire
`chat-relay`. Il conserve en memoire un backlog borne par canal et relaie les
messages aux clients connectes abonnes au canal.

## Modules et protocole

- `protocol.rs` definit `Envelope`, `ClientFrame` (`Hello`, `Msg`, `Ping`) et
  `ServerFrame` (`Welcome`, `Msg`, `Ack`, `Reject`, `Pong`). Serde convertit
  les noms Rust en camelCase pour correspondre au type TypeScript
  `Envelope` de `@attendancy/chat`.
- `hub.rs` expose `start`, `HubConfig` et `HubHandle`. La configuration contient
  un jeton de session, une liste facultative des membres par canal, une limite
  de backlog et une longueur maximale de contenu. `snapshot()` et
  `peer_count()` permettent d'inspecter l'etat du relais.
- `main.rs` demarre le binaire, exige `--token` et accepte `--bind`, `--port`
  et `--members`. Le fichier `--members` est un objet JSON `{ canal: [users] }`.

Le client commence par `Hello`. Le hub valide le jeton et filtre les canaux
selon les membres configures, renvoie les messages de backlog non connus, puis
accepte les messages verifies et les diffuse aux autres pairs du canal. Les
identifiants de message servent a la deduplication; les messages les plus
anciens sont retires au-dela de `max_backlog`.

## Limites d'execution

L'etat du hub est en memoire et n'est pas durable. L'authentification du hub
repose sur le jeton de session et, si configure, la liste des membres; le hub ne
remplace pas l'autorisation du serveur principal. Les messages rejets sont
retournes avec une raison explicite.

Le crate n'est pas encore membre du workspace Cargo racine et n'est reference
par aucun crate Tauri. Les commandes de demarrage/arret et le passage de
configuration depuis l'application enseignante restent a implementer. Le plan
est detaille dans [`specs/chat-offline-integration.md`](../../../../specs/chat-offline-integration.md).

## Verification

Apres l'ajout du crate au workspace Cargo racine, les commandes seront :

```powershell
cargo test -p chat-relay
cargo run -p chat-relay -- --token <jeton> [--bind IP] [--port N]
```
