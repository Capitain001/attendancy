//crates\chat\relay\src\protocol.rs
use serde::{Deserialize, Serialize};

/// Enveloppe d'un message. Même forme côté TypeScript (`Envelope`).
/// `sig` est réservé à la phase sécurité : le hub le transporte sans le lire.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Envelope {
    pub v: u8,
    pub id: String,
    pub channel_id: String,
    pub author_id: String,
    #[serde(default)]
    pub author_name: Option<String>,
    pub content: String,
    #[serde(default)]
    pub parent_id: Option<String>,
    pub created_at: String,
    #[serde(default)]
    pub sig: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "t", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ClientFrame {
    Hello {
        token: String,
        /// IDENTITÉ DÉCLARÉE : rien ne la prouve tant que `credential` n'est pas vérifié.
        user_id: String,
        #[serde(default)]
        name: Option<String>,
        channels: Vec<String>,
        #[serde(default)]
        known: Vec<String>,
        /// Réservé (phase identité) : justificatif de connexion signé. Ignoré pour l'instant ;
        /// le champ existe pour que les clients puissent l'envoyer sans changer de version.
        #[serde(default)]
        credential: Option<String>,
    },
    Msg {
        env: Envelope,
    },
    Ping,
}

#[derive(Serialize, Debug)]
#[serde(tag = "t", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ServerFrame {
    Welcome {
        backlog: Vec<Envelope>,
        peers: usize,
        /// Messages non joints car le `welcome` aurait dépassé `max_welcome_bytes` (les plus
        /// anciens d'abord). Absent si zéro. Le client les rattrape en se reconnectant (`known`).
        #[serde(default, skip_serializing_if = "is_zero")]
        omitted: usize,
    },
    Msg {
        env: Envelope,
    },
    Ack {
        id: String,
        dup: bool,
    },
    Reject {
        id: Option<String>,
        reason: String,
        /// Refus qui se résorbe seul (`rate_limited`) : délai conseillé avant de renvoyer.
        #[serde(skip_serializing_if = "Option::is_none")]
        retry_after_ms: Option<u64>,
    },
    Pong,
}

impl ServerFrame {
    pub fn reject(id: Option<String>, reason: &str) -> Self {
        Self::Reject {
            id,
            reason: reason.into(),
            retry_after_ms: None,
        }
    }
}

fn is_zero(n: &usize) -> bool {
    *n == 0
}