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
    pub sent_at: String,
    #[serde(default)]
    pub sig: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "t", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ClientFrame {
    Hello {
        token: String,
        user_id: String,
        #[serde(default)]
        name: Option<String>,
        channels: Vec<String>,
        #[serde(default)]
        known: Vec<String>,
    },
    Msg {
        env: Envelope,
    },
    Ping,
}

#[derive(Serialize, Debug)]
#[serde(tag = "t", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ServerFrame {
    Welcome { backlog: Vec<Envelope>, peers: usize },
    Msg { env: Envelope },
    Ack { id: String, dup: bool },
    Reject { id: Option<String>, reason: String },
    Pong,
}
