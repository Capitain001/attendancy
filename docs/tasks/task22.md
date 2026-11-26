Setting up a test workspace and resolving dependencies.

Writing the relay package manifest and its library target.

Drafting the protocol message types.

Adding the reject constructor to the protocol.

Designing slow-consumer eviction for the hub.

Dropping the eviction test and keeping the queue unbounded.

Defining the hub's shared state and handle API.

Writing the shared-state insertion and fan-out routine.

Writing the per-connection handshake and WebSocket configuration.

Reviewing hello checks and connection cleanup logic.

Adding rate limiting and strike handling to the connection loop.

Handling binary frames with rate-limit strikes.

Finishing the accept loop and its shutdown path.

Checking the shutdown signal before each accept-loop iteration.

Splitting validation into shape and content checks.

Writing tests for shutdown and port errors.

Writing tests for connection limits and rate limiting.

Writing tests for connection flooding and host reservations.

Writing tests for the shutdown guard and peer count.

Writing tests for the peer count and connection teardown.

Verifying the hub's handshake and teardown logic.

Checking the handshake's early-exit paths.

Writing the connection loop's shutdown and rate-limit handling.

Checking the borrow rules for the rejection helper.

Checking the ownership rules for the ack reply.

Writing test helpers and cases for the hub.

Writing tests for flood control and host reservations.

Writing tests for oversize messages and handshake limits.

Rust 1.75 est installé : je peux compiler et exécuter les tests du relais, ce qui vaut mieux qu'écrire à l'aveugle. J'écris d'abord les sources, puis je compile.

bash

mkdir -p /home/claude/relay/src /home/claude/relay/tests && cd /home/claude/relay

cat > Cargo.toml <<'EOF'
[package]
name = "chat-relay"
version = "0.1.0"
edition = "2021"

[lib]
name = "chat_relay"
path = "src/lib.rs"

[[bin]]
name = "chat-relay"
path = "src/main.rs"

[dependencies]
tokio = { version = "1", features = ["macros", "rt-multi-thread", "net", "time", "sync", "signal"] }
tokio-tungstenite = "0.24"
futures-util = { version = "0.3", features = ["sink"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
EOF

cat > src/lib.rs <<'EOF'
pub mod hub;
pub mod protocol;
pub mod rate;

pub use hub::{start, HubConfig, HubHandle, StartError};
pub use protocol::{ClientFrame, Envelope, ServerFrame};
EOF

cat > src/protocol.rs <<'EOF'
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
EOF

cat > src/rate.rs <<'EOF'
use tokio::time::Instant;

/// Seau à jetons : `burst` messages d'un coup, puis `per_sec` par seconde.
/// Pur (l'heure est passée en argument) : testable sans attendre.
pub struct Bucket {
    tokens: f64,
    burst: f64,
    per_sec: f64,
    last: Instant,
}

impl Bucket {
    pub fn new(burst: u32, per_sec: f64, now: Instant) -> Self {
        let burst = f64::from(burst.max(1));
        Self {
            tokens: burst,
            burst,
            // Un débit nul ou négatif ferait diviser par zéro plus bas
            per_sec: per_sec.max(0.001),
            last: now,
        }
    }

    /// Ok si un jeton est disponible ; sinon Err(millisecondes avant le prochain).
    pub fn take(&mut self, now: Instant) -> Result<(), u64> {
        let elapsed = now.saturating_duration_since(self.last).as_secs_f64();
        self.tokens = (self.tokens + elapsed * self.per_sec).min(self.burst);
        self.last = now;

        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            Ok(())
        } else {
            let wait_s = (1.0 - self.tokens) / self.per_sec;
            Err((wait_s * 1000.0).ceil().max(1.0) as u64)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn la_rafale_passe_puis_le_debit_s_applique() {
        let t0 = Instant::now();
        let mut b = Bucket::new(3, 2.0, t0);
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).is_ok());
        let wait = b.take(t0).unwrap_err();
        assert_eq!(wait, 500); // 1 jeton à 2/s = 500 ms
    }

    #[test]
    fn les_jetons_reviennent_avec_le_temps() {
        let t0 = Instant::now();
        let mut b = Bucket::new(1, 2.0, t0);
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).is_err());
        assert!(b.take(t0 + Duration::from_millis(499)).is_err());
        assert!(b.take(t0 + Duration::from_millis(500)).is_ok());
    }

    #[test]
    fn le_stock_ne_depasse_pas_la_rafale() {
        let t0 = Instant::now();
        let mut b = Bucket::new(2, 10.0, t0);
        let later = t0 + Duration::from_secs(3600);
        assert!(b.take(later).is_ok());
        assert!(b.take(later).is_ok());
        assert!(b.take(later).is_err());
    }

    #[test]
    fn debit_nul_ne_panique_pas() {
        let t0 = Instant::now();
        let mut b = Bucket::new(1, 0.0, t0);
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).unwrap_err() > 0);
    }
}
EOF
echo ok

Sortie

ok


bash

cd /home/claude/relay

cat > src/hub.rs <<'EOF'
use std::collections::{HashMap, HashSet, VecDeque};
use std::fmt;
use std::io;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use futures_util::{Sink, SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{broadcast, mpsc, watch};
use tokio::task::{JoinHandle, JoinSet};
use tokio::time::{timeout_at, Instant};
use tokio_tungstenite::accept_async_with_config;
use tokio_tungstenite::tungstenite::protocol::frame::coding::CloseCode;
use tokio_tungstenite::tungstenite::protocol::{CloseFrame, WebSocketConfig};
use tokio_tungstenite::tungstenite::Message;

use crate::protocol::{ClientFrame, Envelope, ServerFrame};
use crate::rate::Bucket;

/// Longueur maximale d'un identifiant (message, canal, utilisateur) : des UUID en pratique.
const MAX_ID_LEN: usize = 64;

#[derive(Clone)]
pub struct HubConfig {
    /// Jeton de séance, affiché dans le QR code de l'enseignant.
    pub token: String,
    /// canal -> utilisateurs autorisés. `None` = tout porteur du jeton est accepté.
    /// ATTENTION : filtre une identité DÉCLARÉE dans le `hello`, pas un contrôle d'accès.
    pub members: Option<HashMap<String, HashSet<String>>>,
    /// Identité de l'utilisateur qui héberge le relais (même processus). Aucun client réseau ne
    /// peut la porter (`author_reserved`) : ses messages passent par `HubHandle::post_as_host`.
    pub host_user_id: Option<String>,
    pub max_backlog: usize,
    pub max_content_len: usize,
    /// Taille maximale d'un message WebSocket, en octets. Doit rester supérieure à
    /// `6 * max_content_len + 1024` (pire cas : caractères de contrôle échappés en JSON).
    /// L'envoi de fichiers changera cette valeur, pas le code.
    pub max_message_bytes: usize,
    /// Bornes du `hello` : un client légitime déclare quelques canaux et ~200 ids connus.
    pub max_hello_channels: usize,
    pub max_known: usize,
    /// Nombre de canaux distincts gardés en mémoire (sans `members`, un porteur du jeton peut
    /// sinon en créer à volonté).
    pub max_channels: usize,
    pub max_connections: usize,
    /// Connexions qui n'ont pas encore envoyé leur `hello` : chacune retient une tâche.
    pub max_pending_hello: usize,
    /// Délai pour terminer la poignée de main WebSocket ET envoyer le `hello`.
    pub hello_timeout: Duration,
    /// Débit par client : `rate_burst` messages d'un coup, puis `rate_per_sec` par seconde.
    /// Large : un usage normal (frappe, renvoi d'une file) ne doit jamais l'atteindre.
    pub rate_burst: u32,
    pub rate_per_sec: f64,
    /// Refus consécutifs au-delà desquels la connexion est coupée (inondation, pas rafale).
    pub max_strikes: u32,
    /// Temps laissé aux connexions pour se fermer à l'arrêt, avant de les abandonner.
    pub stop_grace: Duration,
}

impl HubConfig {
    pub fn new(token: impl Into<String>) -> Self {
        Self {
            token: token.into(),
            members: None,
            host_user_id: None,
            max_backlog: 500,
            max_content_len: 4000,
            max_message_bytes: 64 * 1024,
            max_hello_channels: 64,
            max_known: 1000,
            max_channels: 64,
            max_connections: 256,
            max_pending_hello: 32,
            hello_timeout: Duration::from_secs(5),
            rate_burst: 100,
            rate_per_sec: 50.0,
            max_strikes: 20,
            stop_grace: Duration::from_secs(2),
        }
    }
}

/// Échec de l'ouverture du relais, avec de quoi afficher un message à l'enseignant.
#[derive(Debug)]
pub enum StartError {
    PortInUse { bind: String },
    PermissionDenied { bind: String },
    AddressNotAvailable { bind: String },
    Io(io::Error),
}

impl StartError {
    fn from_bind(bind: &str, e: io::Error) -> Self {
        let bind = bind.to_string();
        match e.kind() {
            io::ErrorKind::AddrInUse => Self::PortInUse { bind },
            io::ErrorKind::PermissionDenied => Self::PermissionDenied { bind },
            io::ErrorKind::AddrNotAvailable => Self::AddressNotAvailable { bind },
            _ => Self::Io(e),
        }
    }
}

impl fmt::Display for StartError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::PortInUse { bind } => write!(
                f,
                "Le port de {bind} est déjà utilisé par un autre programme. Fermez-le ou choisissez un autre port."
            ),
            Self::PermissionDenied { bind } => write!(f, "Le système refuse l'ouverture de {bind}."),
            Self::AddressNotAvailable { bind } => {
                write!(f, "L'adresse {bind} n'existe pas sur cet appareil.")
            }
            Self::Io(e) => write!(f, "Impossible d'ouvrir le serveur local : {e}"),
        }
    }
}

impl std::error::Error for StartError {}

struct Client {
    channels: HashSet<String>,
    tx: mpsc::UnboundedSender<Message>,
}

#[derive(Default)]
struct Channel {
    order: VecDeque<String>,
    by_id: HashMap<String, Envelope>,
}

struct State {
    next_id: u64,
    pre_hello: usize,
    clients: HashMap<u64, Client>,
    channels: HashMap<String, Channel>,
    /// Messages acceptés depuis le réseau, pour l'hôte (`HubHandle::subscribe`).
    events: broadcast::Sender<Envelope>,
}

/// Une connexion qui n'a pas encore envoyé son `hello` occupe une place, rendue à coup sûr
/// (refus, délai dépassé, tâche abandonnée) grâce à `Drop`.
struct PreHello {
    state: Arc<Mutex<State>>,
    active: bool,
}

impl PreHello {
    fn new(state: Arc<Mutex<State>>) -> Self {
        Self { state, active: true }
    }

    /// À appeler avec le verrou déjà pris (enregistrement du client, au même instant).
    fn release_in(&mut self, s: &mut State) {
        if self.active {
            s.pre_hello = s.pre_hello.saturating_sub(1);
            self.active = false;
        }
    }
}

impl Drop for PreHello {
    fn drop(&mut self) {
        if self.active {
            if let Ok(mut s) = self.state.lock() {
                s.pre_hello = s.pre_hello.saturating_sub(1);
            }
        }
    }
}

pub struct HubHandle {
    pub addr: SocketAddr,
    state: Arc<Mutex<State>>,
    cfg: Arc<HubConfig>,
    shutdown: watch::Sender<bool>,
    task: Option<JoinHandle<()>>,
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

    /// Messages acceptés depuis le réseau (jamais ceux de l'hôte lui-même).
    /// Un récepteur trop lent perd les plus anciens (`RecvError::Lagged`).
    pub fn subscribe(&self) -> broadcast::Receiver<Envelope> {
        self.state.lock().unwrap().events.subscribe()
    }

    /// Entrée des messages de l'hôte, sans passer par une socket.
    /// Ok(true) = nouveau message, Ok(false) = déjà connu. Err = raison du refus
    /// (`no_host`, `author_mismatch`, `not_member`, `bad_*`, `channel_limit`).
    pub fn post_as_host(&self, env: Envelope) -> Result<bool, &'static str> {
        let Some(host) = self.cfg.host_user_id.as_deref() else {
            return Err("no_host");
        };
        check_shape(&env)?;
        if env.author_id != host {
            return Err("author_mismatch");
        }
        if let Some(members) = &self.cfg.members {
            if !members.get(&env.channel_id).map_or(false, |u| u.contains(host)) {
                return Err("not_member");
            }
        }
        check_content(&self.cfg, &env)?;
        store_and_fan_out(&self.state, &self.cfg, &Origin::Host, env)
    }

    /// Ferme chaque connexion (trame Close), libère le port et attend la fin des tâches,
    /// dans la limite de `stop_grace`.
    pub async fn stop(mut self) {
        let _ = self.shutdown.send(true);
        if let Some(task) = self.task.take() {
            let _ = task.await;
        }
    }
}

/// Abandonner le handle déclenche l'arrêt, sans l'attendre (`Drop` ne peut pas être asynchrone).
/// Pour attendre la fin, appeler `stop().await`.
impl Drop for HubHandle {
    fn drop(&mut self) {
        let _ = self.shutdown.send(true);
    }
}

pub async fn start(cfg: HubConfig, bind: &str) -> Result<HubHandle, StartError> {
    let listener = TcpListener::bind(bind)
        .await
        .map_err(|e| StartError::from_bind(bind, e))?;
    let addr = listener.local_addr().map_err(StartError::Io)?;

    let (events, _) = broadcast::channel(256);
    let state = Arc::new(Mutex::new(State {
        next_id: 0,
        pre_hello: 0,
        clients: HashMap::new(),
        channels: HashMap::new(),
        events,
    }));
    let cfg = Arc::new(cfg);
    let (shutdown, shutdown_rx) = watch::channel(false);

    let task = tokio::spawn(accept_loop(listener, cfg.clone(), state.clone(), shutdown_rx));

    Ok(HubHandle {
        addr,
        state,
        cfg,
        shutdown,
        task: Some(task),
    })
}

async fn accept_loop(
    listener: TcpListener,
    cfg: Arc<HubConfig>,
    state: Arc<Mutex<State>>,
    mut shutdown: watch::Receiver<bool>,
) {
    let mut tasks: JoinSet<()> = JoinSet::new();

    while !*shutdown.borrow() {
        tokio::select! {
            _ = shutdown.changed() => break,
            accepted = listener.accept() => {
                let Ok((stream, _)) = accepted else {
                    // Descripteurs épuisés, par exemple : ne pas tourner à vide
                    tokio::time::sleep(Duration::from_millis(50)).await;
                    continue;
                };
                let admitted = {
                    let mut s = state.lock().unwrap();
                    let total = s.clients.len() + s.pre_hello;
                    if s.pre_hello >= cfg.max_pending_hello || total >= cfg.max_connections {
                        false
                    } else {
                        s.pre_hello += 1;
                        true
                    }
                };
                if !admitted {
                    drop(stream);
                    continue;
                }
                tasks.spawn(handle(
                    stream,
                    cfg.clone(),
                    state.clone(),
                    shutdown.clone(),
                    PreHello::new(state.clone()),
                ));
            }
            Some(_) = tasks.join_next(), if !tasks.is_empty() => {}
        }
    }

    // Le port est rendu tout de suite : on peut rouvrir un relais pendant que les clients se ferment
    drop(listener);

    // Chaque connexion voit le signal et envoie sa trame Close ; on leur laisse un délai
    let _ = tokio::time::timeout(cfg.stop_grace, async {
        while tasks.join_next().await.is_some() {}
    })
    .await;
    // Les retardataires (poignée de main bloquée, par exemple) sont abandonnés
    tasks.shutdown().await;
}

fn text(frame: &ServerFrame) -> Message {
    Message::Text(serde_json::to_string(frame).unwrap())
}

fn close_frame(code: CloseCode, reason: &'static str) -> Message {
    Message::Close(Some(CloseFrame {
        code,
        reason: reason.into(),
    }))
}

fn token_matches(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

fn ws_config(cfg: &HubConfig) -> WebSocketConfig {
    let mut c = WebSocketConfig::default();
    c.max_message_size = Some(cfg.max_message_bytes);
    c.max_frame_size = Some(cfg.max_message_bytes);
    c
}

async fn refuse<S>(sink: &mut S, reason: &str)
where
    S: Sink<Message> + Unpin,
{
    let _ = sink.send(text(&ServerFrame::reject(None, reason))).await;
    let _ = sink.close().await;
}

fn hello_out_of_bounds(cfg: &HubConfig, user_id: &str, channels: &[String], known: &[String]) -> bool {
    user_id.is_empty()
        || user_id.len() > MAX_ID_LEN
        || channels.len() > cfg.max_hello_channels
        || known.len() > cfg.max_known
        || channels.iter().chain(known.iter()).any(|s| s.len() > MAX_ID_LEN)
}

async fn handle(
    stream: TcpStream,
    cfg: Arc<HubConfig>,
    state: Arc<Mutex<State>>,
    mut shutdown: watch::Receiver<bool>,
    mut pre: PreHello,
) {
    // Un seul délai pour la poignée de main ET le hello : sans lui, une connexion ouverte
    // qui ne dit rien retiendrait une tâche indéfiniment.
    let deadline = Instant::now() + cfg.hello_timeout;

    let Ok(Ok(ws)) = timeout_at(deadline, accept_async_with_config(stream, Some(ws_config(&cfg)))).await
    else {
        return;
    };
    let (mut sink, mut incoming) = ws.split();

    let Ok(Some(Ok(Message::Text(raw)))) = timeout_at(deadline, incoming.next()).await else {
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
        refuse(&mut sink, "bad_hello").await;
        return;
    };

    if !token_matches(&token, &cfg.token) {
        refuse(&mut sink, "bad_token").await;
        return;
    }
    if hello_out_of_bounds(&cfg, &user_id, &channels, &known) {
        refuse(&mut sink, "bad_hello").await;
        return;
    }
    if cfg.host_user_id.as_deref() == Some(user_id.as_str()) {
        refuse(&mut sink, "author_reserved").await;
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
        refuse(&mut sink, "not_member").await;
        return;
    }

    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let known: HashSet<String> = known.into_iter().collect();

    let (client_id, backlog, peers) = {
        let mut s = state.lock().unwrap();
        pre.release_in(&mut s);
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

    let mut bucket = Bucket::new(cfg.rate_burst, cfg.rate_per_sec, Instant::now());
    let mut strikes: u32 = 0;

    loop {
        tokio::select! {
            _ = shutdown.changed() => {
                let _ = sink.send(close_frame(CloseCode::Away, "relay_stopped")).await;
                let _ = sink.close().await;
                break;
            }
            frame = incoming.next() => match frame {
                Some(Ok(Message::Text(raw))) => {
                    let limited = bucket.take(Instant::now()).err();
                    let reply = match (serde_json::from_str::<ClientFrame>(&raw), limited) {
                        (Ok(ClientFrame::Msg { env }), Some(ms)) => ServerFrame::Reject {
                            id: Some(env.id),
                            reason: "rate_limited".into(),
                            retry_after_ms: Some(ms),
                        },
                        (_, Some(ms)) => ServerFrame::Reject {
                            id: None,
                            reason: "rate_limited".into(),
                            retry_after_ms: Some(ms),
                        },
                        (Ok(ClientFrame::Msg { env }), None) => {
                            ingest(&state, &cfg, client_id, &user_id, &allowed, env)
                        }
                        (Ok(ClientFrame::Ping), None) => ServerFrame::Pong,
                        (_, None) => ServerFrame::reject(None, "bad_frame"),
                    };

                    let throttled = matches!(
                        &reply,
                        ServerFrame::Reject { reason, .. } if reason.as_str() == "rate_limited"
                    );
                    strikes = if throttled { strikes + 1 } else { 0 };

                    if sink.send(text(&reply)).await.is_err() {
                        break;
                    }
                    if strikes > cfg.max_strikes {
                        let _ = sink.send(close_frame(CloseCode::Policy, "rate_limited")).await;
                        let _ = sink.close().await;
                        break;
                    }
                }
                Some(Ok(Message::Binary(_))) => {
                    // Aucun usage prévu : on ne répond pas, mais on compte pour que
                    // l'inondation de trames binaires soit coupée comme les autres.
                    if bucket.take(Instant::now()).is_err() {
                        strikes += 1;
                        if strikes > cfg.max_strikes {
                            let _ = sink.send(close_frame(CloseCode::Policy, "rate_limited")).await;
                            let _ = sink.close().await;
                            break;
                        }
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
            out = rx.recv() => match out {
                Some(out) => {
                    if sink.send(out).await.is_err() {
                        break;
                    }
                }
                None => break,
            }
        }
    }

    state.lock().unwrap().clients.remove(&client_id);
}

enum Origin {
    Client(u64),
    Host,
}

fn check_shape(env: &Envelope) -> Result<(), &'static str> {
    if env.v != 1 {
        return Err("bad_version");
    }
    if env.id.is_empty()
        || env.id.len() > MAX_ID_LEN
        || env.parent_id.as_deref().map_or(false, |p| p.len() > MAX_ID_LEN)
    {
        return Err("bad_id");
    }
    if env.channel_id.is_empty() || env.channel_id.len() > MAX_ID_LEN {
        return Err("bad_channel");
    }
    Ok(())
}

fn check_content(cfg: &HubConfig, env: &Envelope) -> Result<(), &'static str> {
    let len = env.content.chars().count();
    if env.content.trim().is_empty() || len > cfg.max_content_len {
        return Err("bad_content");
    }
    Ok(())
}

/// Entrée d'un message venu du réseau. Ordre des contrôles : forme, canal, identité, contenu.
fn ingest(
    state: &Mutex<State>,
    cfg: &HubConfig,
    client_id: u64,
    user_id: &str,
    allowed: &HashSet<String>,
    env: Envelope,
) -> ServerFrame {
    let id = env.id.clone();
    let refuse = |reason: &'static str| ServerFrame::reject(Some(id.clone()), reason);

    if let Err(r) = check_shape(&env) {
        return refuse(r);
    }
    if !allowed.contains(&env.channel_id) {
        return refuse("not_member");
    }
    if cfg.host_user_id.as_deref() == Some(env.author_id.as_str()) {
        return refuse("author_reserved");
    }
    // Compare à l'identité DÉCLARÉE au hello : empêche l'incohérence, pas l'usurpation.
    if env.author_id != user_id {
        return refuse("author_mismatch");
    }
    if let Err(r) = check_content(cfg, &env) {
        return refuse(r);
    }

    match store_and_fan_out(state, cfg, &Origin::Client(client_id), env) {
        Ok(created) => ServerFrame::Ack {
            id: id.clone(),
            dup: !created,
        },
        Err(r) => refuse(r),
    }
}

/// Garde le message et le relaie. Ok(true) = nouveau, Ok(false) = doublon (rien n'est rediffusé).
fn store_and_fan_out(
    state: &Mutex<State>,
    cfg: &HubConfig,
    origin: &Origin,
    env: Envelope,
) -> Result<bool, &'static str> {
    let mut s = state.lock().unwrap();

    if !s.channels.contains_key(&env.channel_id) && s.channels.len() >= cfg.max_channels {
        return Err("channel_limit");
    }
    let channel = s.channels.entry(env.channel_id.clone()).or_default();
    if channel.by_id.contains_key(&env.id) {
        return Ok(false);
    }

    channel.order.push_back(env.id.clone());
    channel.by_id.insert(env.id.clone(), env.clone());
    while channel.order.len() > cfg.max_backlog {
        if let Some(old) = channel.order.pop_front() {
            channel.by_id.remove(&old);
        }
    }

    let out = text(&ServerFrame::Msg { env: env.clone() });
    let skip = match origin {
        Origin::Client(id) => Some(*id),
        Origin::Host => None,
    };
    for (id, client) in s.clients.iter() {
        if Some(*id) != skip && client.channels.contains(&env.channel_id) {
            let _ = client.tx.send(out.clone());
        }
    }

    // L'hôte reçoit ce que disent les autres ; ses propres messages ne lui reviennent pas
    if matches!(origin, Origin::Client(_)) {
        let _ = s.events.send(env);
    }
    Ok(true)
}
EOF

cat > src/main.rs <<'EOF'
use std::collections::{HashMap, HashSet};

use chat_relay::{start, HubConfig};

fn arg(args: &[String], name: &str) -> Option<String> {
    args.iter()
        .position(|a| a == name)
        .and_then(|i| args.get(i + 1))
        .cloned()
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let bind = arg(&args, "--bind").unwrap_or_else(|| "0.0.0.0".into());
    let port = arg(&args, "--port").unwrap_or_else(|| "0".into());
    let Some(token) = arg(&args, "--token") else {
        eprintln!("usage: chat-relay --token <jeton> [--port N] [--bind IP] [--members fichier.json] [--host-user ID]");
        std::process::exit(2);
    };

    let mut cfg = HubConfig::new(token);
    cfg.host_user_id = arg(&args, "--host-user");
    if let Some(path) = arg(&args, "--members") {
        let raw = std::fs::read_to_string(&path).expect("fichier --members illisible");
        let parsed: HashMap<String, Vec<String>> =
            serde_json::from_str(&raw).expect("--members : JSON {canal: [utilisateurs]} attendu");
        cfg.members = Some(
            parsed
                .into_iter()
                .map(|(k, v)| (k, v.into_iter().collect::<HashSet<_>>()))
                .collect(),
        );
    }

    let handle = match start(cfg, &format!("{bind}:{port}")).await {
        Ok(handle) => handle,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    };
    println!("LISTENING {}", handle.addr);

    tokio::signal::ctrl_c().await.ok();
    handle.stop().await;
}
EOF
cargo build 2>&1 | tail -40

Sortie

  Downloaded tungstenite v0.24.0
  Downloaded utf-8 v0.7.6
  Downloaded libc v0.2.191
  Downloaded zerocopy v0.8.65
  Downloaded log v0.4.35
  Downloaded zmij v1.0.23
  Downloaded tokio v1.54.1
  Downloaded thiserror v1.0.69
  Downloaded syn v3.0.10
  Downloaded syn v2.0.119
  Downloaded socket2 v0.6.5
  Downloaded slab v0.4.12
  Downloaded memchr v2.8.3
  Downloaded http v1.5.0
  Downloaded futures-util v0.3.34
  Downloaded cpufeatures v0.2.17
  Downloaded bytes v1.12.2
  Downloaded byteorder v1.5.0
  Downloaded tokio-tungstenite v0.24.0
  Downloaded serde_json v1.0.154
  Downloaded sha1 v0.10.7
  Downloaded futures-sink v0.3.34
  Downloaded digest v0.10.7
  Downloaded data-encoding v2.11.1
  Downloaded rand_core v0.6.4
  Downloaded quote v1.0.47
  Downloaded proc-macro2 v1.0.107
  Downloaded pin-project-lite v0.2.18
  Downloaded generic-array v0.14.7
  Downloaded rand_chacha v0.3.1
  Downloaded block-buffer v0.10.4
  Downloaded itoa v1.0.19
  Downloaded errno v0.3.15
  Downloaded futures-task v0.3.34
  Downloaded futures-core v0.3.34
  Downloaded futures-macro v0.3.34
error: package `tokio v1.54.1` cannot be built because it requires rustc 1.85 or newer, while the currently active rustc version is 1.75.0
Either upgrade to rustc 1.85 or newer, or use
cargo update tokio@1.54.1 --precise ver
where `ver` is the latest version of `tokio` supporting rustc 1.75.0

Checking which Rust version the dependency needs.

bash

cd /home/claude/relay && cargo update tokio --precise 1.43.0 2>&1 | tail -3; cargo build 2>&1 | grep -E "^(error|warning: unused)|requires rustc|cargo update" | head -10

Sortie

      Adding windows_x86_64_gnu v0.52.6
      Adding windows_x86_64_gnullvm v0.52.6
      Adding windows_x86_64_msvc v0.52.6


bash

cd /home/claude/relay && cargo build 2>&1 | tail -40

Sortie

    Finished dev [unoptimized + debuginfo] target(s) in 0.05s

Checking for build warnings after forcing a rebuild.

Le relais compile. J'écris maintenant les tests : les tiens, conservés, plus ceux de l'arrêt, des plafonds, du débit et de l'identité de l'hôte.

bash

cd /home/claude/relay && touch src/lib.rs && cargo build 2>&1 | grep -E "^warning|^error" | head; 

cat > tests/hub.rs <<'EOF'
//crates\chat\relay\tests\hub.rs
use std::collections::{HashMap, HashSet};
use std::time::Duration;

use chat_relay::{start, Envelope, HubConfig, HubHandle, StartError};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};

type Ws = WebSocketStream<MaybeTlsStream<TcpStream>>;

async fn open(h: &HubHandle) -> Ws {
    connect_async(format!("ws://{}", h.addr)).await.unwrap().0
}

async fn send(ws: &mut Ws, v: Value) {
    ws.send(Message::Text(v.to_string())).await.unwrap();
}

async fn recv(ws: &mut Ws) -> Value {
    let m = tokio::time::timeout(Duration::from_secs(3), ws.next())
        .await
        .expect("timeout")
        .expect("fermé")
        .unwrap();
    match m {
        Message::Text(t) => serde_json::from_str(&t).unwrap(),
        other => panic!("frame inattendue: {other:?}"),
    }
}

async fn recv_none(ws: &mut Ws) -> bool {
    tokio::time::timeout(Duration::from_millis(300), ws.next())
        .await
        .is_err()
}

/// La connexion se termine (trame Close, fin de flux ou erreur) dans les 3 s.
async fn closes(ws: &mut Ws) -> bool {
    drain(ws).await.1
}

/// Lit jusqu'à la fin de la connexion : (trames texte reçues, connexion terminée ?)
async fn drain(ws: &mut Ws) -> (Vec<Value>, bool) {
    let mut frames = Vec::new();
    loop {
        match tokio::time::timeout(Duration::from_secs(3), ws.next()).await {
            Err(_) => return (frames, false),
            Ok(None) | Ok(Some(Err(_))) | Ok(Some(Ok(Message::Close(_)))) => return (frames, true),
            Ok(Some(Ok(Message::Text(t)))) => frames.push(serde_json::from_str(&t).unwrap()),
            Ok(Some(Ok(_))) => {}
        }
    }
}

/// Le relais a envoyé une trame Close explicite (pas seulement une coupure TCP).
async fn gets_close_frame(ws: &mut Ws) -> bool {
    loop {
        match tokio::time::timeout(Duration::from_secs(3), ws.next()).await {
            Ok(Some(Ok(Message::Close(_)))) => return true,
            Ok(Some(Ok(_))) => continue,
            _ => return false,
        }
    }
}

async fn hub_with(f: impl FnOnce(&mut HubConfig)) -> HubHandle {
    let mut cfg = HubConfig::new("tok");
    f(&mut cfg);
    start(cfg, "127.0.0.1:0").await.unwrap()
}

fn hello(token: &str, user: &str, known: Vec<&str>) -> Value {
    hello_in(token, user, vec!["c1"], known)
}

fn hello_in(token: &str, user: &str, channels: Vec<&str>, known: Vec<&str>) -> Value {
    json!({"t":"hello","token":token,"userId":user,"name":user,"channels":channels,"known":known})
}

fn env(id: &str, author: &str, content: &str) -> Value {
    env_in("c1", id, author, content)
}

fn env_in(channel: &str, id: &str, author: &str, content: &str) -> Value {
    json!({"t":"msg","env":{"v":1,"id":id,"channelId":channel,"authorId":author,
        "content":content,"createdAt":"2026-10-26T10:00:00.000Z"}})
}

fn envelope(id: &str, author: &str, content: &str) -> Envelope {
    serde_json::from_value(env(id, author, content)["env"].clone()).unwrap()
}

async fn join(h: &HubHandle, user: &str) -> Ws {
    join_in(h, user, vec!["c1"]).await
}

async fn join_in(h: &HubHandle, user: &str, channels: Vec<&str>) -> Ws {
    let mut ws = open(h).await;
    send(&mut ws, hello_in("tok", user, channels, vec![])).await;
    assert_eq!(recv(&mut ws).await["t"], "welcome");
    ws
}

async fn wait_until(mut cond: impl FnMut() -> bool) -> bool {
    for _ in 0..40 {
        if cond() {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    false
}

// ───────────────────────────── protocole ─────────────────────────────

#[tokio::test]
async fn relaie_aux_autres_sans_echo() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;
    let mut b = join(&h, "b").await;

    send(&mut a, env("m1", "a", "bonjour")).await;
    let ack = recv(&mut a).await;
    assert_eq!(ack["t"], "ack");
    assert_eq!(ack["dup"], false);

    let got = recv(&mut b).await;
    assert_eq!(got["t"], "msg");
    assert_eq!(got["env"]["content"], "bonjour");
    assert!(recv_none(&mut a).await, "l'auteur ne doit pas recevoir son propre message");
}

#[tokio::test]
async fn doublon_ack_sans_rediffusion() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;
    let mut b = join(&h, "b").await;

    send(&mut a, env("m1", "a", "x")).await;
    recv(&mut a).await;
    recv(&mut b).await;

    send(&mut a, env("m1", "a", "x")).await;
    let ack = recv(&mut a).await;
    assert_eq!(ack["dup"], true);
    assert!(recv_none(&mut b).await);
    assert_eq!(h.snapshot().len(), 1);
}

#[tokio::test]
async fn mauvais_jeton_refuse() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut ws = open(&h).await;
    send(&mut ws, hello("faux", "a", vec![])).await;
    let r = recv(&mut ws).await;
    assert_eq!(r["t"], "reject");
    assert_eq!(r["reason"], "bad_token");
}

#[tokio::test]
async fn non_membre_refuse() {
    let mut cfg = HubConfig::new("tok");
    let mut members = HashMap::new();
    members.insert("c1".to_string(), HashSet::from(["a".to_string()]));
    cfg.members = Some(members);
    let h = start(cfg, "127.0.0.1:0").await.unwrap();

    let mut ws = open(&h).await;
    send(&mut ws, hello("tok", "intrus", vec![])).await;
    assert_eq!(recv(&mut ws).await["reason"], "not_member");

    let mut ok = open(&h).await;
    send(&mut ok, hello("tok", "a", vec![])).await;
    assert_eq!(recv(&mut ok).await["t"], "welcome");
}

// IDENTITÉ DÉCLARÉE : le relais compare l'auteur du message à l'utilisateur annoncé au `hello`.
// Cela attrape une incohérence, pas un attaquant : rien ne prouve que le `hello` dit vrai
// (voir `credential`). Ce test ne doit pas être lu comme une preuve d'authentification.
#[tokio::test]
async fn auteur_different_de_l_identite_declaree_refuse() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;
    send(&mut a, env("m1", "quelqu-un-d-autre", "faux")).await;
    let r = recv(&mut a).await;
    assert_eq!(r["reason"], "author_mismatch");
    assert!(h.snapshot().is_empty());
}

#[tokio::test]
async fn backlog_exclut_les_ids_connus() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;
    for i in 1..=3 {
        send(&mut a, env(&format!("m{i}"), "a", "t")).await;
        recv(&mut a).await;
    }

    let mut late = open(&h).await;
    send(&mut late, hello("tok", "b", vec!["m2"])).await;
    let w = recv(&mut late).await;
    let ids: Vec<&str> = w["backlog"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| e["id"].as_str().unwrap())
        .collect();
    assert_eq!(ids, vec!["m1", "m3"]);
}

#[tokio::test]
async fn contenu_vide_ou_trop_long_refuse() {
    let mut cfg = HubConfig::new("tok");
    cfg.max_content_len = 10;
    let h = start(cfg, "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;

    send(&mut a, env("m1", "a", "   ")).await;
    assert_eq!(recv(&mut a).await["reason"], "bad_content");
    send(&mut a, env("m2", "a", "01234567890")).await;
    assert_eq!(recv(&mut a).await["reason"], "bad_content");
}

#[test]
fn handle_utilisable_dans_un_state_tauri() {
    fn send_sync<T: Send + Sync>() {}
    send_sync::<HubHandle>();
}

#[tokio::test]
async fn trames_invalides_refusees_sans_couper() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;

    send(&mut a, json!("pas une trame connue")).await;
    assert_eq!(recv(&mut a).await["reason"], "bad_frame");

    let mut v2 = env("m1", "a", "x");
    v2["env"]["v"] = json!(2);
    send(&mut a, v2).await;
    assert_eq!(recv(&mut a).await["reason"], "bad_version");

    send(&mut a, env("", "a", "x")).await;
    assert_eq!(recv(&mut a).await["reason"], "bad_id");
    send(&mut a, env(&"i".repeat(65), "a", "x")).await;
    assert_eq!(recv(&mut a).await["reason"], "bad_id");

    send(&mut a, env_in("autre-canal", "m2", "a", "x")).await;
    assert_eq!(recv(&mut a).await["reason"], "not_member");

    // la connexion reste utilisable après tous ces refus
    send(&mut a, env("m3", "a", "ok")).await;
    assert_eq!(recv(&mut a).await["t"], "ack");
}

#[tokio::test]
async fn premiere_trame_invalide_refusee() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut ws = open(&h).await;
    ws.send(Message::Text("pas du json".into())).await.unwrap();
    assert_eq!(recv(&mut ws).await["reason"], "bad_hello");
}

#[tokio::test]
async fn canaux_isoles_les_uns_des_autres() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join_in(&h, "a", vec!["c1"]).await;
    let mut b = join_in(&h, "b", vec!["c2"]).await;

    send(&mut a, env("m1", "a", "pour c1")).await;
    recv(&mut a).await;
    assert!(recv_none(&mut b).await, "c2 ne doit rien voir de c1");
}

#[tokio::test]
async fn canaux_partiellement_autorises() {
    let mut cfg = HubConfig::new("tok");
    cfg.members = Some(HashMap::from([
        ("c1".to_string(), HashSet::from(["a".to_string()])),
        ("c2".to_string(), HashSet::from(["b".to_string()])),
    ]));
    let h = start(cfg, "127.0.0.1:0").await.unwrap();

    // a demande c1 ET c2 : il rejoint, mais seulement avec c1
    let mut a = join_in(&h, "a", vec!["c1", "c2"]).await;
    send(&mut a, env_in("c2", "m1", "a", "x")).await;
    assert_eq!(recv(&mut a).await["reason"], "not_member");
    send(&mut a, env("m2", "a", "x")).await;
    assert_eq!(recv(&mut a).await["t"], "ack");
}

#[tokio::test]
async fn backlog_borne_a_max_backlog() {
    let h = hub_with(|c| c.max_backlog = 2).await;
    let mut a = join(&h, "a").await;
    for i in 1..=3 {
        send(&mut a, env(&format!("m{i}"), "a", "t")).await;
        recv(&mut a).await;
    }
    let ids: Vec<String> = {
        let mut v: Vec<String> = h.snapshot().into_iter().map(|e| e.id).collect();
        v.sort();
        v
    };
    assert_eq!(ids, vec!["m2", "m3"]);

    let mut late = open(&h).await;
    send(&mut late, hello("tok", "b", vec![])).await;
    let w = recv(&mut late).await;
    assert_eq!(w["backlog"].as_array().unwrap().len(), 2);
}

// ───────────────────────────── plafonds ─────────────────────────────

#[tokio::test]
async fn message_trop_gros_ferme_la_connexion() {
    let h = hub_with(|c| {
        c.max_message_bytes = 1024;
        c.max_content_len = 100_000; // le plafond testé ici est celui de la trame, pas du contenu
    })
    .await;
    let mut a = join(&h, "a").await;

    send(&mut a, env("m1", "a", &"x".repeat(5000))).await;
    assert!(closes(&mut a).await);
    assert!(h.snapshot().is_empty());
}

#[tokio::test]
async fn hello_hors_bornes_refuse() {
    let h = hub_with(|c| {
        c.max_hello_channels = 2;
        c.max_known = 2;
    })
    .await;

    for (user, channels, known) in [
        ("a", vec!["c1", "c2", "c3"], vec![]),
        ("a", vec!["c1"], vec!["k1", "k2", "k3"]),
        ("", vec!["c1"], vec![]),
        ("u".repeat(65).leak() as &str, vec!["c1"], vec![]),
        ("a", vec!["c".repeat(65).leak() as &str], vec![]),
    ] {
        let mut ws = open(&h).await;
        send(&mut ws, hello_in("tok", user, channels, known)).await;
        assert_eq!(recv(&mut ws).await["reason"], "bad_hello");
    }
}

#[tokio::test]
async fn hello_trop_lent_ferme() {
    let h = hub_with(|c| c.hello_timeout = Duration::from_millis(200)).await;

    // poignée de main faite, mais aucun hello
    let mut ws = open(&h).await;
    assert!(closes(&mut ws).await);
}

#[tokio::test]
async fn limite_de_connexions() {
    let h = hub_with(|c| c.max_connections = 2).await;
    let a = join(&h, "a").await;
    let _b = join(&h, "b").await;

    // la troisième est refusée dès l'acceptation : pas de poignée de main
    assert!(connect_async(format!("ws://{}", h.addr)).await.is_err());

    drop(a);
    assert!(wait_until(|| h.peer_count() == 1).await, "la place doit être rendue");
    let _c = join(&h, "c").await;
}

#[tokio::test]
async fn limite_de_connexions_sans_hello() {
    let h = hub_with(|c| {
        c.max_pending_hello = 1;
        c.hello_timeout = Duration::from_secs(30);
    })
    .await;

    // une connexion TCP qui ne dit rien occupe l'unique place
    let silent = TcpStream::connect(h.addr).await.unwrap();
    tokio::time::sleep(Duration::from_millis(150)).await;
    assert!(connect_async(format!("ws://{}", h.addr)).await.is_err());

    // elle partie, la place est rendue
    drop(silent);
    let mut joined = false;
    for _ in 0..40 {
        if let Ok((mut ws, _)) = connect_async(format!("ws://{}", h.addr)).await {
            send(&mut ws, hello("tok", "a", vec![])).await;
            joined = recv(&mut ws).await["t"] == "welcome";
            break;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    assert!(joined);
}

#[tokio::test]
async fn limite_de_canaux() {
    let h = hub_with(|c| c.max_channels = 1).await;
    let mut a = join_in(&h, "a", vec!["c1", "c2"]).await;

    send(&mut a, env("m1", "a", "x")).await;
    assert_eq!(recv(&mut a).await["t"], "ack");
    send(&mut a, env_in("c2", "m2", "a", "x")).await;
    assert_eq!(recv(&mut a).await["reason"], "channel_limit");
}

// ───────────────────────────── débit ─────────────────────────────

#[tokio::test]
async fn debit_depasse_renvoie_un_delai_et_le_message_repart() {
    let h = hub_with(|c| {
        c.rate_burst = 3;
        c.rate_per_sec = 2.0;
    })
    .await;
    let mut a = join(&h, "a").await;

    for i in 1..=3 {
        send(&mut a, env(&format!("m{i}"), "a", "x")).await;
        assert_eq!(recv(&mut a).await["t"], "ack");
    }

    send(&mut a, env("m4", "a", "x")).await;
    let r = recv(&mut a).await;
    assert_eq!(r["t"], "reject");
    assert_eq!(r["reason"], "rate_limited");
    assert_eq!(r["id"], "m4", "le refus nomme le message : le client sait lequel renvoyer");
    let retry = r["retryAfterMs"].as_u64().expect("délai conseillé");
    assert!(retry > 0 && retry <= 1000, "délai plausible: {retry}");
    assert_eq!(h.snapshot().len(), 3, "le message refusé n'est pas gardé");

    // après le délai conseillé, le même message passe, une seule fois
    tokio::time::sleep(Duration::from_millis(retry + 100)).await;
    send(&mut a, env("m4", "a", "x")).await;
    let ack = recv(&mut a).await;
    assert_eq!(ack["t"], "ack");
    assert_eq!(ack["dup"], false);
    assert_eq!(h.snapshot().len(), 4);
}

#[tokio::test]
async fn inondation_coupee() {
    let h = hub_with(|c| {
        c.rate_burst = 1;
        c.rate_per_sec = 0.01;
        c.max_strikes = 3;
    })
    .await;
    let mut a = join(&h, "a").await;

    for i in 0..12 {
        send(&mut a, env(&format!("m{i}"), "a", "x")).await;
    }
    let (frames, closed) = drain(&mut a).await;
    assert!(closed, "la connexion doit être coupée");
    assert!(frames.iter().any(|f| f["reason"] == "rate_limited"));
    assert_eq!(h.snapshot().len(), 1, "seul le premier message est passé");
}

// ───────────────────────────── arrêt ─────────────────────────────

#[tokio::test]
async fn stop_ferme_les_clients_et_libere_le_port() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let addr = h.addr;
    let mut a = join(&h, "a").await;
    let mut b = join(&h, "b").await;

    // le processus de test reste vivant : seule la bibliothèque peut tout fermer
    h.stop().await;

    assert!(gets_close_frame(&mut a).await, "a doit recevoir une trame Close");
    assert!(gets_close_frame(&mut b).await, "b doit recevoir une trame Close");

    // le port est rendu : on peut y rouvrir un relais, dans le même processus
    let again = start(HubConfig::new("tok"), &addr.to_string()).await;
    assert!(again.is_ok(), "port non libéré: {:?}", again.err());
}

#[tokio::test]
async fn drop_declenche_l_arret_sans_attendre() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let mut a = join(&h, "a").await;

    drop(h); // synchrone : ne peut pas attendre

    assert!(gets_close_frame(&mut a).await);
}

#[tokio::test]
async fn plus_rien_n_est_relaye_apres_l_arret() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    let addr = h.addr;
    let mut a = join(&h, "a").await;
    h.stop().await;
    let _ = closes(&mut a).await;

    // plus personne n'écoute à cette adresse
    assert!(connect_async(format!("ws://{addr}")).await.is_err());
}

#[tokio::test]
async fn stop_n_attend_pas_une_connexion_bloquee() {
    let h = hub_with(|c| {
        c.hello_timeout = Duration::from_secs(60);
        c.stop_grace = Duration::from_millis(200);
    })
    .await;

    // connexion TCP sans poignée de main : la tâche ne regarde pas le signal d'arrêt
    let _stalled = TcpStream::connect(h.addr).await.unwrap();
    tokio::time::sleep(Duration::from_millis(100)).await;

    let done = tokio::time::timeout(Duration::from_secs(3), h.stop()).await;
    assert!(done.is_ok(), "stop() doit rendre la main après le délai de grâce");
}

#[tokio::test]
async fn port_occupe_donne_une_erreur_lisible() {
    let blocker = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let port = blocker.local_addr().unwrap().port();

    let err = match start(HubConfig::new("tok"), &format!("127.0.0.1:{port}")).await {
        Ok(_) => panic!("le port est occupé"),
        Err(e) => e,
    };
    assert!(matches!(err, StartError::PortInUse { .. }), "reçu: {err:?}");
    let msg = err.to_string();
    assert!(msg.contains(&port.to_string()) && msg.contains("déjà utilisé"), "message: {msg}");
}

// ───────────────────────────── identité de l'hôte ─────────────────────────────

#[tokio::test]
async fn identite_de_l_hote_reservee_au_reseau() {
    let h = hub_with(|c| c.host_user_id = Some("prof".into())).await;

    // un client qui annonce l'identité de l'hôte est refusé dès le hello
    let mut ws = open(&h).await;
    send(&mut ws, hello("tok", "prof", vec![])).await;
    assert_eq!(recv(&mut ws).await["reason"], "author_reserved");

    // un client qui signe un message du nom de l'hôte aussi (avant même author_mismatch)
    let mut a = join(&h, "a").await;
    send(&mut a, env("m1", "prof", "faux")).await;
    assert_eq!(recv(&mut a).await["reason"], "author_reserved");
    assert!(h.snapshot().is_empty());
}

#[tokio::test]
async fn l_hote_publie_par_l_api_locale() {
    let h = hub_with(|c| c.host_user_id = Some("prof".into())).await;
    let mut b = join(&h, "b").await;

    assert_eq!(h.post_as_host(envelope("m1", "prof", "bonjour")), Ok(true));
    let got = recv(&mut b).await;
    assert_eq!(got["t"], "msg");
    assert_eq!(got["env"]["authorId"], "prof");

    // même id : doublon, rien n'est rediffusé
    assert_eq!(h.post_as_host(envelope("m1", "prof", "bonjour")), Ok(false));
    assert!(recv_none(&mut b).await);

    // l'hôte ne peut publier que sous son identité
    assert_eq!(h.post_as_host(envelope("m2", "b", "x")), Err("author_mismatch"));
    assert_eq!(h.post_as_host(envelope("m3", "prof", "   ")), Err("bad_content"));

    // un arrivant tardif reçoit aussi les messages de l'hôte
    let mut late = open(&h).await;
    send(&mut late, hello("tok", "c", vec![])).await;
    let w = recv(&mut late).await;
    assert_eq!(w["backlog"][0]["id"], "m1");
}

#[tokio::test]
async fn sans_identite_d_hote_l_api_locale_refuse() {
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    assert_eq!(h.post_as_host(envelope("m1", "prof", "x")), Err("no_host"));
}

#[tokio::test]
async fn l_hote_respecte_la_liste_des_membres() {
    let mut cfg = HubConfig::new("tok");
    cfg.host_user_id = Some("prof".into());
    cfg.members = Some(HashMap::from([(
        "c1".to_string(),
        HashSet::from(["a".to_string()]),
    )]));
    let h = start(cfg, "127.0.0.1:0").await.unwrap();
    assert_eq!(h.post_as_host(envelope("m1", "prof", "x")), Err("not_member"));
}

#[tokio::test]
async fn l_hote_recoit_ce_que_disent_les_autres() {
    let h = hub_with(|c| c.host_user_id = Some("prof".into())).await;
    let mut rx = h.subscribe();
    let mut a = join(&h, "a").await;

    send(&mut a, env("m1", "a", "question")).await;
    assert_eq!(recv(&mut a).await["t"], "ack");
    let got = tokio::time::timeout(Duration::from_secs(2), rx.recv())
        .await
        .expect("timeout")
        .unwrap();
    assert_eq!((got.id.as_str(), got.content.as_str()), ("m1", "question"));

    // ses propres messages ne lui reviennent pas
    h.post_as_host(envelope("m2", "prof", "réponse")).unwrap();
    assert!(rx.try_recv().is_err());
}

#[tokio::test]
async fn ecoute_en_parallele_sur_le_meme_port_impossible() {
    // garde-fou : le port est bien celui qu'on croit (évite un faux positif sur stop())
    let h = start(HubConfig::new("tok"), "127.0.0.1:0").await.unwrap();
    assert!(TcpListener::bind(h.addr).await.is_err());
}
EOF
cargo test 2>&1 | tail -60

Sortie

     Running unittests src/lib.rs (target/debug/deps/chat_relay-1244c2d68f742b41)

running 4 tests
test rate::tests::debit_nul_ne_panique_pas ... ok
test rate::tests::la_rafale_passe_puis_le_debit_s_applique ... ok
test rate::tests::le_stock_ne_depasse_pas_la_rafale ... ok
test rate::tests::les_jetons_reviennent_avec_le_temps ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/chat_relay-5ed6a401d170732d)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hub.rs (target/debug/deps/hub-56bb1eb920994673)

running 32 tests
test auteur_different_de_l_identite_declaree_refuse ... ok
test backlog_borne_a_max_backlog ... ok
test backlog_exclut_les_ids_connus ... ok
test canaux_isoles_les_uns_des_autres ... ok
test canaux_partiellement_autorises ... ok
test contenu_vide_ou_trop_long_refuse ... ok
test debit_depasse_renvoie_un_delai_et_le_message_repart ... ok
test doublon_ack_sans_rediffusion ... ok
test drop_declenche_l_arret_sans_attendre ... ok
test ecoute_en_parallele_sur_le_meme_port_impossible ... ok
test handle_utilisable_dans_un_state_tauri ... ok
test hello_hors_bornes_refuse ... ok
test hello_trop_lent_ferme ... ok
test identite_de_l_hote_reservee_au_reseau ... ok
test inondation_coupee ... ok
test l_hote_publie_par_l_api_locale ... ok
test l_hote_recoit_ce_que_disent_les_autres ... ok
test l_hote_respecte_la_liste_des_membres ... ok
test limite_de_canaux ... ok
test limite_de_connexions ... ok
test limite_de_connexions_sans_hello ... ok
test mauvais_jeton_refuse ... ok
test message_trop_gros_ferme_la_connexion ... ok
test non_membre_refuse ... ok
test plus_rien_n_est_relaye_apres_l_arret ... ok
test port_occupe_donne_une_erreur_lisible ... ok
test premiere_trame_invalide_refusee ... ok
test relaie_aux_autres_sans_echo ... ok
test sans_identite_d_hote_l_api_locale_refuse ... ok
test stop_ferme_les_clients_et_libere_le_port ... ok
test stop_n_attend_pas_une_connexion_bloquee ... ok
test trames_invalides_refusees_sans_couper ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.69s

   Doc-tests chat_relay

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s


Vérification des tests en cassant volontairement le code

bash

cd /home/claude && rm -rf mut && cp -r relay mut && cd mut && rm -rf target && ln -s ../relay/target target 2>/dev/null; 
run() { cargo test --test hub 2>&1 | grep -E "^test .*FAILED|test result" ; }

echo "== Mutation A : le client ignore le signal d'arrêt =="
python3 - <<'EOF'
import re
p='src/hub.rs'; s=open(p).read()
s=s.replace("_ = shutdown.changed() => {\n                let _ = sink.send(close_frame(CloseCode::Away","_ = std::future::pending::<()>() => {\n                let _ = sink.send(close_frame(CloseCode::Away",1)
open(p,'w').write(s)
EOF
run

echo "== Mutation B : plus de limitation de débit =="
cp ../relay/src/hub.rs src/hub.rs
python3 - <<'EOF'
p='src/hub.rs'; s=open(p).read()
s=s.replace("let limited = bucket.take(Instant::now()).err();","let limited: Option<u64> = None; let _ = &mut bucket;",1)
open(p,'w').write(s)
EOF
run

echo "== Mutation C : la place « sans hello » n'est jamais rendue =="
cp ../relay/src/hub.rs src/hub.rs
python3 - <<'EOF'
p='src/hub.rs'; s=open(p).read()
s=s.replace("s.pre_hello = s.pre_hello.saturating_sub(1);\n            self.active = false;","self.active = false;",1)
s=s.replace("if let Ok(mut s) = self.state.lock() {\n                s.pre_hello = s.pre_hello.saturating_sub(1);\n            }","",1)
open(p,'w').write(s)
EOF
run

echo "== Mutation D : le port n'est plus rendu avant l'attente (listener gardé) =="
cp ../relay/src/hub.rs src/hub.rs
python3 - <<'EOF'
p='src/hub.rs'; s=open(p).read()
s=s.replace("    drop(listener);\n","    let _keep = &listener;\n",1)
open(p,'w').write(s)
EOF
run

Sortie

== Mutation A : le client ignore le signal d'arrêt ==
test drop_declenche_l_arret_sans_attendre ... FAILED
test stop_ferme_les_clients_et_libere_le_port ... FAILED
test result: FAILED. 30 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 8.75s
== Mutation B : plus de limitation de débit ==
test debit_depasse_renvoie_un_delai_et_le_message_repart ... FAILED
test inondation_coupee ... FAILED
test result: FAILED. 30 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.16s
== Mutation C : la place « sans hello » n'est jamais rendue ==
test limite_de_connexions ... FAILED
test limite_de_connexions_sans_hello ... FAILED
test result: FAILED. 30 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.74s
== Mutation D : le port n'est plus rendu avant l'attente (listener gardé) ==
test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.69s

Ajout d'un test pour la libération du port pendant le délai de grâce

Checking why the port stays held after drop.

Checking whether the accept task gets to drop the listener.

Le nouveau test échoue aussi sur le code correct : soit le test est mal construit, soit le relais retient vraiment le port. Je regarde le message avant de conclure.

bash

cd /home/claude/relay && cargo test --test hub le_port_est_rendu 2>&1 | grep -E "panicked|assertion|reopened|error" | head; 
cat > /tmp/probe.rs <<'EOF'
EOF
python3 - <<'EOF'
# sonde : quelle erreur renvoie bind() pendant le délai de grâce ?
p='/home/claude/relay/tests/hub.rs'; s=open(p).read()
s=s.replace("""        if TcpListener::bind(addr).await.is_ok() {
            reopened = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    assert!(reopened, "le port est resté occupé pendant le délai de grâce");""","""        match TcpListener::bind(addr).await {
            Ok(_) => { reopened = true; break; }
            Err(e) => eprintln!("PROBE bind: {e:?}"),
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    assert!(reopened, "le port est resté occupé pendant le délai de grâce");""")
open(p,'w').write(s)
EOF
cargo test --test hub le_port_est_rendu -- --nocapture 2>&1 | grep -E "PROBE|panicked" | sort | uniq -c | head

Sortie

thread 'le_port_est_rendu_avant_la_fin_du_delai_de_grace' panicked at tests/hub.rs:649:5:
error: test failed, to rerun pass `--test hub`
     11 PROBE bind: Os { code: 98, kind: AddrInUse, message: "Address already in use" }
      1 test le_port_est_rendu_avant_la_fin_du_delai_de_grace ... PROBE bind: Os { code: 98, kind: AddrInUse, message: "Address already in use" }
      1 thread 'le_port_est_rendu_avant_la_fin_du_delai_de_grace' panicked at tests/hub.rs:649:5:


bash

cd /home/claude/mut && cp ../relay/src/*.rs src/ && cp ../relay/tests/hub.rs tests/hub.rs
python3 - <<'EOF'
p='src/hub.rs'; s=open(p).read()
s=s.replace("    drop(listener);\n","    eprintln!(\"DBG dropping listener\");\n    drop(listener);\n    eprintln!(\"DBG listener dropped\");\n",1)
s=s.replace("    while !*shutdown.borrow() {","    eprintln!(\"DBG accept loop start\");\n    while !*shutdown.borrow() {",1)
open(p,'w').write(s)
EOF
cargo test --test hub le_port_est_rendu -- --nocapture 2>&1 | grep -E "DBG|PROBE" | head -20

Sortie

test le_port_est_rendu_avant_la_fin_du_delai_de_grace ... DBG accept loop start
PROBE bind: Os { code: 98, kind: AddrInUse, message: "Address already in use" }
DBG dropping listener
DBG listener dropped


Checking probe output for the listener drop.

Comparing probe output across the two runs.

bash

cd /home/claude/mut && echo "== mut (avec traces) =="; for i in 1 2 3; do cargo test --test hub le_port_est_rendu 2>&1 | grep -E "test result"; done
cd /home/claude/relay && echo "== relay =="; for i in 1 2 3; do cargo test --test hub le_port_est_rendu 2>&1 | grep -E "test result"; done
diff <(sed -n '1,400p' /home/claude/relay/src/hub.rs) <(sed -n '1,400p' /home/claude/mut/src/hub.rs) | head -20

Sortie

== mut (avec traces) ==
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.15s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.15s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.15s
== relay ==
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.15s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.15s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.16s


bash

cd /home/claude/relay && echo "== séquentiel =="; cargo test --test hub -- --test-threads=1 2>&1 | grep -E "FAILED|test result"
echo "== parallèle, 3 fois =="; for i in 1 2 3; do cargo test --test hub 2>&1 | grep -E "FAILED|test result"; done
echo "== avec seulement les tests d'arrêt =="; cargo test --test hub stop 2>&1 | grep -E "FAILED|test result"; cargo test --test hub le_port 2>&1 | grep -E "FAILED|test result"; cargo test --test hub drop 2>&1 | grep -E "FAILED|test result"

Sortie

== séquentiel ==
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.85s
== parallèle, 3 fois ==
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.85s
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.85s
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.84s
== avec seulement les tests d'arrêt ==
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 31 filtered out; finished in 0.31s
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 31 filtered out; finished in 0.16s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 32 filtered out; finished in 0.00s


bash

cd /home/claude/relay && python3 - <<'EOF'
p='tests/hub.rs'; s=open(p).read()
s=s.replace("""        match TcpListener::bind(addr).await {
            Ok(_) => { reopened = true; break; }
            Err(e) => eprintln!("PROBE bind: {e:?}"),
        }
""","""        if TcpListener::bind(addr).await.is_ok() {
            reopened = true;
            break;
        }
""")
open(p,'w').write(s)
EOF
grep -n "PROBE" tests/hub.rs; for i in 1 2 3; do cargo test --test hub 2>&1 | grep -E "FAILED|test result"; done

Sortie

test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.84s
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.85s
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.84s