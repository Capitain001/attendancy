# Catalogue des tests par mutation (`chat-relay`)

Ce document recense les mutations (casses volontaires) permettant de vérifier que chaque garde-fou de `crates/chat/relay` fait bien échouer un test précis.

> **Règle :** appliquer **une seule** mutation à la fois, lancer la commande associée (qui **doit échouer** avec un code de sortie non nul), puis annuler immédiatement la modification avant de passer à la suivante.

---

## 1. `src/host.rs` et `src/addr.rs` (Brique 7 — Livraison 2)

| # | Fichier | Mutation (casse volontaire) | Test qui doit échouer | Commande de vérification |
|---|---|---|---|---|
| M1 | `src/host.rs` | Retirer `if self.active.lock().unwrap().is_some() { return Err(HostError::AlreadyStarted); }` dans `HostService::start` | `second_start_refuse_stop_idempotent_et_restart_permis`, `deux_start_simultanes_un_seul_passe` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test host second_start_refuse` |
| M2 | `src/host.rs` | Retirer le bloc `if !members.values().any(|users| users.contains(host))` (`HostNotInMembers`) dans `validate` | `host_absent_de_tous_les_canaux_refuse_sans_rien_lancer` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test host host_absent_de_tous_les_canaux` |
| M3 | `src/host.rs` | Supprimer `cfg.max_connections = n;` dans `HostService::start` | `max_connections_est_applique` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test host max_connections_est_applique` |
| M4 | `src/host.rs` | Supprimer `cfg.max_pending_hello = n;` dans `HostService::start` | `max_pending_hello_est_applique` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test host max_pending_hello_est_applique` |
| M5 | `src/host.rs` | Ne pas affecter `cfg.members` dans `HostService::start` | `members_est_applique_aux_clients` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test host members_est_applique_aux_clients` |
| M6 | `src/addr.rs` | Désactiver le filtre `if is_virtual(&i.name)` dans `pick_addresses` | `addr::tests::interfaces_virtuelles_ecartees_si_un_vrai_reseau_existe` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --lib addr::tests::interfaces_virtuelles_ecartees` |
| M7 | `src/addr.rs` | Autoriser `100.64/10` (`a == 100`) dans `is_pairable` | `addr::tests::ignore_loopback_public_cgnat_et_non_specifiee` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --lib addr::tests::ignore_loopback_public_cgnat` |

---

## 2. `src/backlog.rs` et `src/hub.rs` (Étape B — `welcome` plafonné en octets)

| # | Fichier | Mutation (casse volontaire) | Test qui doit échouer | Commande de vérification |
|---|---|---|---|---|
| B1 | `src/backlog.rs` | Supprimer `if cost > budget { break; }` dans `select_backlog` | `backlog::tests::limite_exacte_respectee` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --lib backlog::tests::limite_exacte_respectee` |
| B2 | `src/backlog.rs` | Trier sur `created_at` au lieu de `seq` dans `select_backlog` | `backlog::tests::garde_les_plus_recents_dans_l_ordre_de_sequence` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --lib backlog::tests::garde_les_plus_recents` |
| B3 | `src/hub.rs` | Forcer `omitted: 0` lors de l'envoi de `ServerFrame::Welcome` dans `handle()` | `welcome_plafonne_garde_les_plus_recents_tous_canaux_et_annonce_omitted` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test welcome_plafonne` |
| B4 | `src/hub.rs` | Supprimer `s.next_seq += 1;` dans `store_and_fan_out()` | `welcome_plafonne_garde_les_plus_recents_tous_canaux_et_annonce_omitted` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test welcome_plafonne` |

---

## 3. `src/hub.rs` (Étape C — Inactivité, file bornée et `write_timeout`)

| # | Fichier | Mutation (casse volontaire) | Test qui doit échouer | Commande de vérification |
|---|---|---|---|---|
| C1 | `src/hub.rs` | Supprimer `idle.as_mut().reset(Instant::now() + cfg.idle_timeout);` dans `handle()` | `les_pings_gardent_la_connexion` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test les_pings_gardent_la_connexion` |
| C2 | `src/hub.rs` | Remplacer `cfg.idle_timeout` par `Duration::from_secs(3600)` dans `tokio::time::sleep` | `inactif_est_coupe_avec_close` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test inactif_est_coupe_avec_close` |
| C3 | `src/hub.rs` | Remplacer `mpsc::channel::<Message>(cfg.out_queue_capacity.max(1))` par `mpsc::channel::<Message>(1_000_000)` | `lecteur_lent_est_evince` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test lecteur_lent_est_evince` |
| C4 | `src/hub.rs` | Supprimer la boucle `for id in evicted { s.clients.remove(&id); }` dans `store_and_fan_out()` | `lecteur_lent_est_evince` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test lecteur_lent_est_evince` |
| C5 | `src/hub.rs` | Supprimer `close_with(&mut sink, CloseCode::Again, "slow_consumer", cfg.write_timeout).await;` dans l'arm `evict` | `lecteur_evince_recoit_close_puis_rattrape` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test lecteur_evince_recoit_close_puis_rattrape` |
| C6 | `src/hub.rs` | Dans `send_within`, remplacer `tokio::time::timeout(limit, sink.send(msg))` par `sink.send(msg)` | `ecriture_bloquee_ne_retient_pas_l_arret` | `cargo test --manifest-path crates/chat/relay/Cargo.toml --test hub_integration_test ecriture_bloquee_ne_retient_pas_l_arret` |
