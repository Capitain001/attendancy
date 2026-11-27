//crates\chat\relay\src\hub.rs
use std::collections::{HashMap, HashSet, VecDeque};
use std::fmt;
use std::io;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use futures_util::{Sink, SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc::error::TrySendError;
use tokio::sync::{broadcast, mpsc, watch, Notify};
use tokio::task::{JoinHandle, JoinSet};
use tokio::time::{timeout_at, Instant};
use tokio_tungstenite::accept_async_with_config;
use tokio_tungstenite::tungstenite::protocol::frame::coding::CloseCode;
use tokio_tungstenite::tungstenite::protocol::{CloseFrame, WebSocketConfig};
use tokio_tungstenite::tungstenite::Message;

use crate::backlog::select_backlog;
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
    /// Taille maximale du `welcome` (backlog sérialisé), en octets. Au-delà, les messages les
    /// plus anciens sont omis (`omitted`) et rattrapés à la reconnexion via `known`.
    /// Doit rester supérieure à un message pire cas (`6 * max_content_len + 1024`).
    pub max_welcome_bytes: usize,
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
    /// Inactivité tolérée après le `hello` : aucune trame REÇUE (texte, binaire, ping, pong)
    /// pendant ce délai et la connexion est fermée (Close 1008 `idle_timeout`). Les trames
    /// envoyées par le relais ne comptent pas. Un client rattrape par `known` à la reconnexion.
    /// Un onglet de navigateur en arrière-plan peut espacer ses minuteurs à ~1 min : un client
    /// coupé à tort se reconnecte sans perte.
    pub idle_timeout: Duration,
    /// Plafond de chaque écriture vers un client (message, Close, fermeture). Au-delà, la tâche
    /// s'arrête et la socket est abandonnée : un client qui ne lit plus ne retient rien.
    pub write_timeout: Duration,
    /// Messages en attente d'envoi par client. File pleine = client lent : il est retiré
    /// tout de suite (mémoire bornée) puis reçoit un Close 1013 `slow_consumer`, au mieux
    /// (si sa socket n'accepte plus d'écriture, `write_timeout` le coupe sans Close).
    pub out_queue_capacity: usize,
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
            max_welcome_bytes: 256 * 1024,
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
            idle_timeout: Duration::from_secs(60),
            write_timeout: Duration::from_secs(10),
            out_queue_capacity: 256,
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
    /// Code stable lisible par machine ; le texte de `Display` est pour l'humain.
    pub fn code(&self) -> &'static str {
        match self {
            Self::PortInUse { .. } => "port_in_use",
            Self::PermissionDenied { .. } => "permission_denied",
            Self::AddressNotAvailable { .. } => "address_unavailable",
            Self::Io(_) => "start_failed",
        }
    }

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
    /// File de sortie BORNÉE : `try_send` sous le verrou, jamais d'attente.
    tx: mpsc::Sender<Message>,
    /// Signal d'éviction : une file pleine ne peut plus recevoir de Close, il faut donc un
    /// canal à part pour réveiller la tâche du client. `notify_one` garde un permis si la
    /// tâche n'attend pas encore : le signal n'est jamais perdu.
    evict: Arc<Notify>,
}

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

struct State {
    next_id: u64,
    next_seq: u64,
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
            .flat_map(|c| {
                c.order
                    .iter()
                    .filter_map(|id| c.by_id.get(id).map(|st| st.env.clone()))
            })
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
        next_seq: 0,
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

/// Écriture bornée par `limit` : Err si la socket n'accepte pas la trame à temps, ou si elle
/// est fermée. Sans ce plafond, un client qui ne lit plus (tampons TCP pleins) bloquerait sa
/// tâche indéfiniment, sourde à l'arrêt, aux trames entrantes et à l'éviction.
async fn send_within<S>(sink: &mut S, msg: Message, limit: Duration) -> Result<(), ()>
where
    S: Sink<Message> + Unpin,
{
    match tokio::time::timeout(limit, sink.send(msg)).await {
        Ok(Ok(())) => Ok(()),
        _ => Err(()),
    }
}

/// Envoie une trame Close puis ferme, chaque étape bornée par `limit`. Au mieux : si la socket
/// n'accepte plus d'écriture, rien ne part et la connexion est simplement abandonnée.
async fn close_with<S>(sink: &mut S, code: CloseCode, reason: &'static str, limit: Duration)
where
    S: Sink<Message> + Unpin,
{
    if send_within(sink, close_frame(code, reason), limit).await.is_ok() {
        let _ = tokio::time::timeout(limit, sink.close()).await;
    }
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

async fn refuse<S>(sink: &mut S, reason: &str, limit: Duration)
where
    S: Sink<Message> + Unpin,
{
    if send_within(sink, text(&ServerFrame::reject(None, reason)), limit)
        .await
        .is_ok()
    {
        let _ = tokio::time::timeout(limit, sink.close()).await;
    }
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
        refuse(&mut sink, "bad_hello", cfg.write_timeout).await;
        return;
    };

    if !token_matches(&token, &cfg.token) {
        refuse(&mut sink, "bad_token", cfg.write_timeout).await;
        return;
    }
    if hello_out_of_bounds(&cfg, &user_id, &channels, &known) {
        refuse(&mut sink, "bad_hello", cfg.write_timeout).await;
        return;
    }
    if cfg.host_user_id.as_deref() == Some(user_id.as_str()) {
        refuse(&mut sink, "author_reserved", cfg.write_timeout).await;
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
        refuse(&mut sink, "not_member", cfg.write_timeout).await;
        return;
    }

    // `max(1)` : une capacité nulle ferait paniquer `mpsc::channel`
    let (tx, mut rx) = mpsc::channel::<Message>(cfg.out_queue_capacity.max(1));
    let evict = Arc::new(Notify::new());
    let known: HashSet<String> = known.into_iter().collect();

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
                evict: evict.clone(),
            },
        );
        let peers = s.clients.len();
        (id, backlog, omitted, peers)
    };

    if send_within(
        &mut sink,
        text(&ServerFrame::Welcome {
            backlog,
            peers,
            omitted,
        }),
        cfg.write_timeout,
    )
    .await
    .is_err()
    {
        state.lock().unwrap().clients.remove(&client_id);
        return;
    }

    let mut bucket = Bucket::new(cfg.rate_burst, cfg.rate_per_sec, Instant::now());
    let mut strikes: u32 = 0;

    // Inactivité : poussé à chaque trame reçue. Ne démarre qu'après le `hello`, qui a déjà
    // son propre délai.
    let idle = tokio::time::sleep(cfg.idle_timeout);
    tokio::pin!(idle);

    loop {
        // `biased` : l'ordre ci-dessous est l'ordre de priorité. L'arrêt et l'éviction passent
        // avant la file de sortie (sinon une file pleine masquerait le signal), la file avant
        // les trames entrantes (elle est bornée, donc ne peut pas affamer le reste).
        tokio::select! {
            biased;
            _ = shutdown.changed() => {
                close_with(&mut sink, CloseCode::Away, "relay_stopped", cfg.write_timeout).await;
                break;
            }
            _ = evict.notified() => {
                // Déjà retiré de `clients` par `store_and_fan_out` : la file est abandonnée,
                // le client rattrape par `known` à sa reconnexion.
                close_with(&mut sink, CloseCode::Again, "slow_consumer", cfg.write_timeout).await;
                break;
            }
            _ = &mut idle => {
                close_with(&mut sink, CloseCode::Policy, "idle_timeout", cfg.write_timeout).await;
                break;
            }
            out = rx.recv() => match out {
                Some(out) => {
                    if send_within(&mut sink, out, cfg.write_timeout).await.is_err() {
                        break;
                    }
                }
                None => break,
            },
            frame = incoming.next() => {
                // Toute trame reçue prouve que le client est vivant
                if matches!(frame, Some(Ok(_))) {
                    idle.as_mut().reset(Instant::now() + cfg.idle_timeout);
                }
                match frame {
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

                        if send_within(&mut sink, text(&reply), cfg.write_timeout).await.is_err() {
                            break;
                        }
                        if strikes > cfg.max_strikes {
                            close_with(&mut sink, CloseCode::Policy, "rate_limited", cfg.write_timeout).await;
                            break;
                        }
                    }
                    Some(Ok(Message::Binary(_))) => {
                        // Aucun usage prévu : on ne répond pas, mais on compte pour que
                        // l'inondation de trames binaires soit coupée comme les autres.
                        if bucket.take(Instant::now()).is_err() {
                            strikes += 1;
                            if strikes > cfg.max_strikes {
                                close_with(&mut sink, CloseCode::Policy, "rate_limited", cfg.write_timeout).await;
                                break;
                            }
                        }
                    }
                    Some(Ok(Message::Ping(p))) => {
                        if send_within(&mut sink, Message::Pong(p), cfg.write_timeout).await.is_err() {
                            break;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                    _ => {}
                }
            }
        }
    }

    // No-op si le client a déjà été évincé par `store_and_fan_out`
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
/// Un client dont la file est pleine est évincé : retiré de `clients` sur-le-champ (mémoire
/// bornée, `peer_count` juste) et prévenu par `evict` pour que sa tâche tente un Close.
fn store_and_fan_out(
    state: &Mutex<State>,
    cfg: &HubConfig,
    origin: &Origin,
    env: Envelope,
) -> Result<bool, &'static str> {
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

    // On ne peut pas retirer de `clients` pendant qu'on l'itère : on collecte, on retire après
    let mut evicted: Vec<u64> = Vec::new();
    for (id, client) in s.clients.iter() {
        if Some(*id) != skip && client.channels.contains(&env.channel_id) {
            match client.tx.try_send(out.clone()) {
                Ok(()) => {}
                Err(TrySendError::Full(_)) => {
                    client.evict.notify_one();
                    evicted.push(*id);
                }
                // La tâche du client est déjà terminée : juste nettoyer
                Err(TrySendError::Closed(_)) => evicted.push(*id),
            }
        }
    }
    for id in evicted {
        s.clients.remove(&id);
    }

    // L'hôte reçoit ce que disent les autres ; ses propres messages ne lui reviennent pas
    if matches!(origin, Origin::Client(_)) {
        let _ = s.events.send(env);
    }
    Ok(true)
}
