Code de l'étape B. Les blocs sont des remplacements ciblés, avec le chemin du fichier en première ligne de chaque bloc.

## 1. Nouveau module pur, avec ses tests

```rust
//crates\chat\relay\src\backlog.rs
use crate::protocol::Envelope;

/// Marge réservée à l'enveloppe du `welcome` : {"t":"welcome","backlog":[],"peers":N,"omitted":N}
pub const WELCOME_OVERHEAD: usize = 256;

/// Garde les messages les plus récents (plus grande séquence d'insertion) qui tiennent dans
/// `max_bytes` une fois sérialisés, rendus par séquence croissante, avec le nombre d'omis.
/// S'arrête au premier message qui ne tient pas : l'historique gardé reste contigu.
/// Le tri porte sur la séquence du relais, jamais sur `createdAt` (fourni par les pairs).
pub fn select_backlog(
    mut candidates: Vec<(u64, &Envelope)>,
    max_bytes: usize,
) -> (Vec<Envelope>, usize) {
    candidates.sort_unstable_by(|a, b| b.0.cmp(&a.0));
    let mut budget = max_bytes.saturating_sub(WELCOME_OVERHEAD);
    let mut kept: Vec<Envelope> = Vec::new();
    for &(_, env) in &candidates {
        // +1 : la virgule du tableau JSON
        let cost = serde_json::to_string(env).map_or(usize::MAX, |s| s.len().saturating_add(1));
        if cost > budget {
            break;
        }
        budget -= cost;
        kept.push(env.clone());
    }
    let omitted = candidates.len() - kept.len();
    kept.reverse();
    (kept, omitted)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn env(id: &str) -> Envelope {
        Envelope {
            v: 1,
            id: id.into(),
            channel_id: "c1".into(),
            author_id: "a".into(),
            author_name: None,
            content: "x".repeat(100),
            parent_id: None,
            created_at: "2026-10-26T10:00:00.000Z".into(),
            sig: None,
        }
    }

    fn cost(e: &Envelope) -> usize {
        serde_json::to_string(e).unwrap().len() + 1
    }

    fn ids(v: &[Envelope]) -> Vec<&str> {
        v.iter().map(|e| e.id.as_str()).collect()
    }

    #[test]
    fn garde_les_plus_recents_dans_l_ordre_de_sequence() {
        // m1 a le createdAt le plus récent : si le tri s'appuyait dessus, m1 serait gardé
        let mut e1 = env("m1");
        e1.created_at = "2099-01-01T00:00:00.000Z".into();
        let (e2, e3) = (env("m2"), env("m3"));
        let c = cost(&e1);
        assert_eq!(c, cost(&e2));

        let (kept, omitted) =
            select_backlog(vec![(3, &e3), (1, &e1), (2, &e2)], WELCOME_OVERHEAD + 2 * c);
        assert_eq!(ids(&kept), vec!["m2", "m3"]);
        assert_eq!(omitted, 1);
    }

    #[test]
    fn limite_exacte_respectee() {
        let (e1, e2, e3) = (env("m1"), env("m2"), env("m3"));
        let c = cost(&e1);
        let cands = || vec![(1, &e1), (2, &e2), (3, &e3)];

        let (kept, omitted) = select_backlog(cands(), WELCOME_OVERHEAD + 3 * c);
        assert_eq!((kept.len(), omitted), (3, 0));

        let (kept, omitted) = select_backlog(cands(), WELCOME_OVERHEAD + 3 * c - 1);
        assert_eq!((kept.len(), omitted), (2, 1));
    }

    #[test]
    fn un_message_plus_gros_que_le_budget_donne_un_backlog_vide() {
        let e = env("m1");
        let (kept, omitted) = select_backlog(vec![(1, &e)], WELCOME_OVERHEAD + cost(&e) - 1);
        assert!(kept.is_empty());
        assert_eq!(omitted, 1);
    }

    #[test]
    fn budget_inferieur_a_la_marge_et_aucun_candidat() {
        let e = env("m1");
        let (kept, omitted) = select_backlog(vec![(1, &e)], 10);
        assert_eq!((kept.len(), omitted), (0, 1));

        let (kept, omitted) = select_backlog(vec![], 10_000);
        assert_eq!((kept.len(), omitted), (0, 0));
    }
}
```

## 2. `lib.rs` : déclarer le module

```rust
//crates\chat\relay\src\lib.rs
// ajouter, avec les autres `pub mod` :
pub mod backlog;
```

## 3. `protocol.rs` : champ `omitted` dans `Welcome`

```rust
//crates\chat\relay\src\protocol.rs
// Dans `enum ServerFrame`, remplacer la variante Welcome :
    Welcome {
        backlog: Vec<Envelope>,
        peers: usize,
        /// Messages non joints car le `welcome` aurait dépassé `max_welcome_bytes` (les plus
        /// anciens d'abord). Absent si zéro. Le client les rattrape en se reconnectant (`known`).
        #[serde(default, skip_serializing_if = "is_zero")]
        omitted: usize,
    },

// et ajouter en bas du fichier :
fn is_zero(n: &usize) -> bool {
    *n == 0
}
```

`ServerFrame` n'a que `Serialize`. `#[serde(default)]` y est donc inutile mais inoffensif. Tu peux le retirer si le compilateur ou clippy le signale.

## 4. `hub.rs` : cinq remplacements

**a) Import, `HubConfig` et défaut**

```rust
//crates\chat\relay\src\hub.rs
// imports : ajouter
use crate::backlog::select_backlog;

// dans `struct HubConfig`, après `max_message_bytes` :
    /// Taille maximale du `welcome` (backlog sérialisé), en octets. Au-delà, les messages les
    /// plus anciens sont omis (`omitted`) et rattrapés à la reconnexion via `known`.
    /// Doit rester supérieure à un message pire cas (`6 * max_content_len + 1024`).
    pub max_welcome_bytes: usize,

// dans `HubConfig::new`, après `max_message_bytes: 64 * 1024,` :
            max_welcome_bytes: 256 * 1024,
```

**b) Structures**

```rust
// remplacer `struct Channel` :
struct Stored {
    /// Rang d'insertion dans le relais (global, croissant) : sert à couper le `welcome`.
    seq: u64,
    env: Envelope,
}

#[derive(Default)]
struct Channel {
    order: VecDeque<String>,
    by_id: HashMap<String, Stored>,
}

// dans `struct State`, après `next_id: u64,` :
    next_seq: u64,

// dans `start()`, dans l'initialisation de State, après `next_id: 0,` :
        next_seq: 0,
```

**c) `snapshot()`**

```rust
// remplacer la ligne du flat_map :
            .flat_map(|c| {
                c.order
                    .iter()
                    .filter_map(|id| c.by_id.get(id).map(|st| st.env.clone()))
            })
```

**d) `handle()` : construction du backlog et `Welcome`**

```rust
// remplacer le bloc `let (client_id, backlog, peers) = { ... };` par :
    let (client_id, backlog, omitted, peers) = {
        let mut s = state.lock().unwrap();
        pre.release_in(&mut s);
        s.next_id += 1;
        let id = s.next_id;

        let (backlog, omitted) = {
            let mut candidates: Vec<(u64, &Envelope)> = Vec::new();
            for ch in &allowed {
                if let Some(c) = s.channels.get(ch) {
                    for mid in &c.order {
                        if known.contains(mid) {
                            continue;
                        }
                        if let Some(st) = c.by_id.get(mid) {
                            candidates.push((st.seq, &st.env));
                        }
                    }
                }
            }
            select_backlog(candidates, cfg.max_welcome_bytes)
        };

        s.clients.insert(
            id,
            Client {
                channels: allowed.clone(),
                tx,
            },
        );
        let peers = s.clients.len();
        (id, backlog, omitted, peers)
    };

// et remplacer l'envoi du welcome :
    if sink
        .send(text(&ServerFrame::Welcome {
            backlog,
            peers,
            omitted,
        }))
        .await
        .is_err()
```

**e) `store_and_fan_out()` : attribuer la séquence**

```rust
// remplacer le début de la fonction, jusqu'à `channel.by_id.insert(...)` inclus :
    let mut guard = state.lock().unwrap();
    let s = &mut *guard; // références disjointes sur les champs (canal et compteur)

    if !s.channels.contains_key(&env.channel_id) && s.channels.len() >= cfg.max_channels {
        return Err("channel_limit");
    }
    let channel = s.channels.entry(env.channel_id.clone()).or_default();
    if channel.by_id.contains_key(&env.id) {
        return Ok(false);
    }

    let seq = s.next_seq;
    s.next_seq += 1;
    channel.order.push_back(env.id.clone());
    channel.by_id.insert(
        env.id.clone(),
        Stored {
            seq,
            env: env.clone(),
        },
    );
// la suite (while ... max_backlog, fan-out, events) reste inchangée : `s.clients`, `s.events` marchent tels quels.
```

Risque de compilation, point à surveiller : l'emprunt disjoint de `s.channels` (via `channel`) et de `s.next_seq` dans `store_and_fan_out`. Il doit passer parce que `s` est un `&mut State` simple. Si le compilateur proteste, lis `next_seq` avant `entry()` et incrémente-le après le test de doublon.

## 5. Tests d'intégration

```rust
//crates\chat\relay\tests\hub.integration.test.rs
// à ajouter dans la section « plafonds » (helpers existants : hub_with, join_in, open, send, recv, hello_in, env_in)

fn backlog_ids(w: &Value) -> Vec<String> {
    w["backlog"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| e["id"].as_str().unwrap().to_string())
        .collect()
}

#[tokio::test]
async fn welcome_plafonne_garde_les_plus_recents_tous_canaux_et_annonce_omitted() {
    // ~1150 octets par message : 3 tiennent dans 4000 (marge comprise), pas 4
    let h = hub_with(|c| c.max_welcome_bytes = 4000).await;
    let mut a = join_in(&h, "a", vec!["c1", "c2"]).await;
    let gros = "x".repeat(1000);

    // canaux entrelacés : l'ordre de coupe est global, pas par canal
    for (i, ch) in ["c1", "c2", "c1", "c2", "c1"].iter().enumerate() {
        send(&mut a, env_in(ch, &format!("m{}", i + 1), "a", &gros)).await;
        assert_eq!(recv(&mut a).await["t"], "ack");
    }

    let mut late = open(&h).await;
    send(&mut late, hello_in("tok", "b", vec!["c1", "c2"], vec![])).await;
    let w = recv(&mut late).await;
    assert_eq!(w["t"], "welcome");
    assert_eq!(backlog_ids(&w), vec!["m3", "m4", "m5"], "les plus récents, ordre croissant");
    assert_eq!(w["omitted"], 2);

    // à la reconnexion, `known` suffit à récupérer le reste : le rattrapage converge
    let mut again = open(&h).await;
    send(
        &mut again,
        hello_in("tok", "b2", vec!["c1", "c2"], vec!["m3", "m4", "m5"]),
    )
    .await;
    let w2 = recv(&mut again).await;
    assert_eq!(backlog_ids(&w2), vec!["m1", "m2"]);
    assert!(w2["omitted"].is_null(), "rien d'omis : le champ est absent");
}

#[tokio::test]
async fn welcome_complet_n_annonce_pas_omitted() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;
    for i in 1..=3 {
        send(&mut a, env(&format!("m{i}"), "a", "t")).await;
        recv(&mut a).await;
    }
    let mut late = open(&h).await;
    send(&mut late, hello("tok", "b", vec![])).await;
    let w = recv(&mut late).await;
    assert_eq!(backlog_ids(&w), vec!["m1", "m2", "m3"]);
    assert!(w["omitted"].is_null());
}
```

## 6. Mutations à faire toi-même (chacune doit faire échouer un test)

| Casse volontaire | Test qui doit échouer |
|---|---|
| Supprimer `if cost > budget { break; }` dans `select_backlog` | `limite_exacte_respectee` et `welcome_plafonne_garde_les_plus_recents…` |
| Trier sur `created_at` au lieu de `seq` (en passant `created_at` dans les candidats) | `garde_les_plus_recents_dans_l_ordre_de_sequence` |
| Forcer `omitted` à `0` dans `handle()` | `welcome_plafonne_garde_les_plus_recents…` (`w["omitted"] == 2`) |
| Ne pas incrémenter `s.next_seq` | `welcome_plafonne_garde_les_plus_recents…` (la coupe n'est plus déterministe) |

## Notes

- Aucun changement TS dans B : le transport ignore `omitted`. Une brique ultérieure pourra s'en servir pour se reconnecter, mais ce n'est pas décidé.
- Hypothèse de calcul : environ 1146 octets par enveloppe de 1000 caractères. 3 messages font 3441, sous 3744 disponibles. 4 messages font 4588, au-dessus. Si le test est flaky, change la taille du contenu, pas la logique.
- `max_welcome_bytes` n'a pas de flag CLI,

Dis-moi ce que donnent les tests, ou passe-moi les erreurs de compilation éventuelles.