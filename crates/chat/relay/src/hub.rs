//crates\chat\relay\src\hub.rs
use std::collections::{HashMap, HashSet, VecDeque};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, oneshot};
use tokio_tungstenite::tungstenite::Message;

use crate::protocol::{ClientFrame, Envelope, ServerFrame};

#[derive(Clone)]
pub struct HubConfig {
    /// Jeton de séance, affiché dans le QR code de l'enseignant.
    pub token: String,
    /// canal -> utilisateurs autorisés. `None` = tout porteur du jeton est accepté.
    pub members: Option<HashMap<String, HashSet<String>>>,
    pub max_backlog: usize,
    pub max_content_len: usize,
}

impl HubConfig {
    pub fn new(token: impl Into<String>) -> Self {
        Self {
            token: token.into(),
            members: None,
            max_backlog: 500,
            max_content_len: 4000,
        }
    }
}

struct Client {
    channels: HashSet<String>,
    tx: mpsc::UnboundedSender<Message>,
}

#[derive(Default)]
struct Channel {
    order: VecDeque<String>,
    by_id: HashMap<String, Envelope>,
}

#[derive(Default)]
struct State {
    next_id: u64,
    clients: HashMap<u64, Client>,
    channels: HashMap<String, Channel>,
}

pub struct HubHandle {
    pub addr: SocketAddr,
    state: Arc<Mutex<State>>,
    _shutdown: oneshot::Sender<()>,
}

impl HubHandle {
    /// Tous les messages gardés par le hub (pour inspection ou export).
    pub fn snapshot(&self) -> Vec<Envelope> {
        let state = self.state.lock().unwrap();
        state
            .channels
            .values()
            .flat_map(|c| c.order.iter().filter_map(|id| c.by_id.get(id).cloned()))
            .collect()
    }

    pub fn peer_count(&self) -> usize {
        self.state.lock().unwrap().clients.len()
    }
}

pub async fn start(cfg: HubConfig, bind: &str) -> std::io::Result<HubHandle> {
    let listener = TcpListener::bind(bind).await?;
    let addr = listener.local_addr()?;
    let state = Arc::new(Mutex::new(State::default()));
    let cfg = Arc::new(cfg);
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();

    let st = state.clone();
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = &mut shutdown_rx => break,
                accepted = listener.accept() => {
                    if let Ok((stream, _)) = accepted {
                        tokio::spawn(handle(stream, cfg.clone(), st.clone()));
                    }
                }
            }
        }
    });

    Ok(HubHandle {
        addr,
        state,
        _shutdown: shutdown_tx,
    })
}

fn text(frame: &ServerFrame) -> Message {
    Message::Text(serde_json::to_string(frame).unwrap())
}

fn token_matches(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

async fn handle(stream: TcpStream, cfg: Arc<HubConfig>, state: Arc<Mutex<State>>) {
    let Ok(ws) = tokio_tungstenite::accept_async(stream).await else {
        return;
    };
    let (mut sink, mut incoming) = ws.split();

    let first = tokio::time::timeout(Duration::from_secs(5), incoming.next()).await;
    let Ok(Some(Ok(Message::Text(raw)))) = first else {
        return;
    };

    let Ok(ClientFrame::Hello {
        token,
        user_id,
        channels,
        known,
        ..
    }) = serde_json::from_str::<ClientFrame>(&raw)
    else {
        let _ = sink
            .send(text(&ServerFrame::Reject {
                id: None,
                reason: "bad_hello".into(),
            }))
            .await;
        return;
    };

    if !token_matches(&token, &cfg.token) {
        let _ = sink
            .send(text(&ServerFrame::Reject {
                id: None,
                reason: "bad_token".into(),
            }))
            .await;
        return;
    }

    let allowed: HashSet<String> = channels
        .into_iter()
        .filter(|c| match &cfg.members {
            Some(m) => m.get(c).map_or(false, |users| users.contains(&user_id)),
            None => true,
        })
        .collect();

    if allowed.is_empty() {
        let _ = sink
            .send(text(&ServerFrame::Reject {
                id: None,
                reason: "not_member".into(),
            }))
            .await;
        return;
    }

    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let known: HashSet<String> = known.into_iter().collect();

    let (client_id, backlog, peers) = {
        let mut s = state.lock().unwrap();
        s.next_id += 1;
        let id = s.next_id;

        let mut backlog = Vec::new();
        for ch in &allowed {
            if let Some(c) = s.channels.get(ch) {
                for mid in &c.order {
                    if known.contains(mid) {
                        continue;
                    }
                    if let Some(env) = c.by_id.get(mid) {
                        backlog.push(env.clone());
                    }
                }
            }
        }

        s.clients.insert(
            id,
            Client {
                channels: allowed.clone(),
                tx,
            },
        );
        let peers = s.clients.len();
        (id, backlog, peers)
    };

    if sink
        .send(text(&ServerFrame::Welcome { backlog, peers }))
        .await
        .is_err()
    {
        state.lock().unwrap().clients.remove(&client_id);
        return;
    }

    loop {
        tokio::select! {
            frame = incoming.next() => match frame {
                Some(Ok(Message::Text(raw))) => {
                    let reply = match serde_json::from_str::<ClientFrame>(&raw) {
                        Ok(ClientFrame::Msg { env }) => ingest(&state, &cfg, client_id, &user_id, &allowed, env),
                        Ok(ClientFrame::Ping) => ServerFrame::Pong,
                        _ => ServerFrame::Reject { id: None, reason: "bad_frame".into() },
                    };
                    if sink.send(text(&reply)).await.is_err() {
                        break;
                    }
                }
                Some(Ok(Message::Ping(p))) => {
                    if sink.send(Message::Pong(p)).await.is_err() {
                        break;
                    }
                }
                Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                _ => {}
            },
            Some(out) = rx.recv() => {
                if sink.send(out).await.is_err() {
                    break;
                }
            }
        }
    }

    state.lock().unwrap().clients.remove(&client_id);
}

fn ingest(
    state: &Arc<Mutex<State>>,
    cfg: &HubConfig,
    client_id: u64,
    user_id: &str,
    allowed: &HashSet<String>,
    env: Envelope,
) -> ServerFrame {
    let reject = |reason: &str| ServerFrame::Reject {
        id: Some(env.id.clone()),
        reason: reason.into(),
    };

    if env.v != 1 {
        return reject("bad_version");
    }
    if env.id.is_empty() || env.id.len() > 64 {
        return reject("bad_id");
    }
    if !allowed.contains(&env.channel_id) {
        return reject("not_member");
    }
    if env.author_id != user_id {
        return reject("author_mismatch");
    }
    let len = env.content.chars().count();
    if env.content.trim().is_empty() || len > cfg.max_content_len {
        return reject("bad_content");
    }

    let mut s = state.lock().unwrap();
    let channel = s.channels.entry(env.channel_id.clone()).or_default();
    if channel.by_id.contains_key(&env.id) {
        return ServerFrame::Ack {
            id: env.id,
            dup: true,
        };
    }

    channel.order.push_back(env.id.clone());
    channel.by_id.insert(env.id.clone(), env.clone());
    while channel.order.len() > cfg.max_backlog {
        if let Some(old) = channel.order.pop_front() {
            channel.by_id.remove(&old);
        }
    }

    let out = text(&ServerFrame::Msg { env: env.clone() });
    for (id, client) in s.clients.iter() {
        if *id != client_id && client.channels.contains(&env.channel_id) {
            let _ = client.tx.send(out.clone());
        }
    }

    ServerFrame::Ack {
        id: env.id,
        dup: false,
    }
}
