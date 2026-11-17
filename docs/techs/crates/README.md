# Crates Rust

Les crates Rust reutilisables du monorepo sont documentes ici. Leur integration
au workspace Cargo racine se configure dans le `Cargo.toml` racine, et leur
utilisation par une application se declare comme dependance Cargo.

| Crate | Role |
| --- | --- |
| [`chat-relay`](./chat-relay/README.md) | Relais ephemere WebSocket du chat sur le LAN |

`chat-relay` est deplace ici mais n'est pas encore membre du workspace Cargo ni
dependance des applications Tauri.
