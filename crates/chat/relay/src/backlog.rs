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
