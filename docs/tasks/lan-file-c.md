Voici l'étape C complète. les tests réseau (tampons TCP) dépendent de l'OS, 

Trois remarques avant les fichiers :

- Les tests vont dans `hub_integration_test.rs`
- Pour `lecteur_evince_recoit_close_puis_rattrape`, j'ai évité de baisser `out_queue_capacity`. Le nombre de messages manqués dépend surtout des tampons TCP, pas de la file. Le test relève donc `max_backlog`, `max_known`, `max_message_bytes` et `max_welcome_bytes`, puis vérifie que `reçus + backlog == publiés`, dans l'ordre et sans recouvrement.
- J'ai gardé 60 s pour `idle_timeout`.

## `hub.rs`

```rust
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
```

## `hub_integration_test.rs`

```rust
//crates\chat\relay\tests\hub.integration.test.rs
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use chat_relay::{start, Envelope, HubConfig, HubHandle, StartError};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::net::{TcpListener, TcpSocket, TcpStream};
use tokio_tungstenite::{
    client_async, connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream,
};

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

/// Attend la trame Close et rend sa raison (`None` si la connexion tombe sans Close motivé).
/// Pas de délai propre : l'appelant l'enveloppe dans le sien.
async fn close_reason(ws: &mut Ws) -> Option<String> {
    loop {
        match ws.next().await {
            Some(Ok(Message::Close(Some(f)))) => return Some(f.reason.to_string()),
            Some(Ok(Message::Close(None))) | None | Some(Err(_)) => return None,
            Some(Ok(_)) => {}
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

/// Client qui rejoint le canal c1 puis NE LIT PLUS : petit tampon de réception côté client,
/// pour que les tampons TCP se remplissent vite. L'appelant garde le `Ws` en vie (le lâcher
/// fermerait la socket et ferait échouer l'écriture du relais pour une autre raison).
async fn open_slow(h: &HubHandle, user: &str, known: Vec<String>) -> Ws {
    let socket = TcpSocket::new_v4().unwrap();
    socket.set_recv_buffer_size(4096).unwrap();
    let stream = socket.connect(h.addr).await.unwrap();
    let (mut ws, _) = client_async(format!("ws://{}", h.addr), MaybeTlsStream::Plain(stream))
        .await
        .unwrap();
    send(
        &mut ws,
        json!({"t":"hello","token":"tok","userId":user,"name":user,"channels":["c1"],"known":known}),
    )
    .await;
    assert_eq!(recv(&mut ws).await["t"], "welcome");
    ws
}

/// Publie par l'API de l'hôte (messages de ~4 Ko, ids m0, m1, …) jusqu'à ce que `stop_when`
/// soit vrai ou que `max` soit atteint ; rend les ids publiés, dans l'ordre. Cède la main à
/// chaque message pour que les tâches du relais et des clients avancent : sans cela, le
/// runtime de test (un seul fil) remplirait la file avant que quiconque ne la vide.
async fn flood_as_host(h: &HubHandle, max: usize, stop_when: impl Fn() -> bool) -> Vec<String> {
    let body = "x".repeat(4000);
    let mut ids = Vec::new();
    for i in 0..max {
        let id = format!("m{i}");
        h.post_as_host(envelope(&id, "prof", &body)).unwrap();
        ids.push(id);
        tokio::task::yield_now().await;
        if i % 64 == 0 {
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
        if stop_when() {
            break;
        }
    }
    ids
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

#[tokio::test]
async fn le_port_est_rendu_avant_la_fin_du_delai_de_grace() {
    let h = hub_with(|c| {
        c.hello_timeout = Duration::from_secs(60);
        c.stop_grace = Duration::from_millis(1500);
    })
    .await;
    let addr = h.addr;

    // un retardataire (pas de poignée de main) retient tout le délai de grâce
    let _stalled = TcpStream::connect(addr).await.unwrap();
    tokio::time::sleep(Duration::from_millis(100)).await;

    drop(h);

    // le port doit être rouvrable bien avant la fin du délai : l'enseignant peut relancer tout de suite
    let mut reopened = false;
    for _ in 0..12 {
        if TcpListener::bind(addr).await.is_ok() {
            reopened = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    assert!(reopened, "le port est resté occupé pendant le délai de grâce");
}

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

// ───────────────────────────── battement et file bornée ─────────────────────────────

#[tokio::test]
async fn inactif_est_coupe_avec_close() {
    let h = hub_with(|c| c.idle_timeout = Duration::from_millis(300)).await;
    let mut a = join(&h, "a").await;

    let reason = tokio::time::timeout(Duration::from_secs(1), close_reason(&mut a))
        .await
        .expect("un client silencieux doit être coupé en moins d'une seconde");
    assert_eq!(reason.as_deref(), Some("idle_timeout"));
    assert!(wait_until(|| h.peer_count() == 0).await, "la place doit être rendue");
}

#[tokio::test]
async fn les_pings_gardent_la_connexion() {
    let h = hub_with(|c| c.idle_timeout = Duration::from_millis(300)).await;
    let mut a = join(&h, "a").await;

    // 1 s de pings toutes les 100 ms : bien plus que le délai d'inactivité
    for _ in 0..10 {
        tokio::time::sleep(Duration::from_millis(100)).await;
        send(&mut a, json!({"t":"ping"})).await;
        assert_eq!(recv(&mut a).await["t"], "pong");
    }
    assert_eq!(h.peer_count(), 1, "la connexion est restée ouverte");
}

#[tokio::test]
async fn lecteur_lent_est_evince() {
    let h = hub_with(|c| {
        c.host_user_id = Some("prof".into());
        // délai d'écriture long : l'éviction doit venir de la file pleine, pas du délai
        c.write_timeout = Duration::from_secs(30);
        c.idle_timeout = Duration::from_secs(600);
    })
    .await;

    // `_slow` ne lit plus après le welcome, mais reste en vie
    let _slow = open_slow(&h, "a", vec![]).await;

    // `b` lit tout, en parallèle
    let mut fast = join(&h, "b").await;
    let received = Arc::new(AtomicUsize::new(0));
    let counter = received.clone();
    tokio::spawn(async move {
        while let Some(Ok(m)) = fast.next().await {
            if matches!(m, Message::Text(_)) {
                counter.fetch_add(1, Ordering::SeqCst);
            }
        }
    });
    assert_eq!(h.peer_count(), 2);

    // ~4 Ko par message : assez pour remplir les tampons TCP de `a`, puis sa file
    let ids = flood_as_host(&h, 20_000, || h.peer_count() == 1).await;

    assert_eq!(h.peer_count(), 1, "le lecteur lent doit être retiré avant write_timeout");
    let total = ids.len();
    assert!(
        wait_until(|| received.load(Ordering::SeqCst) == total).await,
        "l'autre client doit tout recevoir: {} / {total}",
        received.load(Ordering::SeqCst)
    );
}

#[tokio::test]
async fn lecteur_evince_recoit_close_puis_rattrape() {
    // Tout l'historique doit rester disponible pour que le rattrapage soit exact : le nombre
    // de messages manqués dépend des tampons TCP, pas de la file.
    let h = hub_with(|c| {
        c.host_user_id = Some("prof".into());
        c.write_timeout = Duration::from_secs(30);
        c.idle_timeout = Duration::from_secs(600);
        c.max_backlog = 100_000;
        c.max_known = 100_000;
        c.max_message_bytes = 1024 * 1024; // le hello porte tous les ids déjà reçus
        c.max_welcome_bytes = 48 * 1024 * 1024;
    })
    .await;

    let mut slow = open_slow(&h, "a", vec![]).await;
    let ids = flood_as_host(&h, 20_000, || h.peer_count() == 0).await;
    assert_eq!(h.peer_count(), 0, "le lecteur lent doit être évincé");

    // Il reprend sa lecture avant write_timeout : trames déjà parties, puis le Close
    let mut seen: Vec<String> = Vec::new();
    let reason = loop {
        let next = tokio::time::timeout(Duration::from_secs(5), slow.next())
            .await
            .expect("timeout en reprenant la lecture");
        match next {
            Some(Ok(Message::Text(t))) => {
                let v: Value = serde_json::from_str(&t).unwrap();
                assert_eq!(v["t"], "msg");
                seen.push(v["env"]["id"].as_str().unwrap().to_string());
            }
            Some(Ok(Message::Close(Some(f)))) => break f.reason.to_string(),
            Some(Ok(Message::Close(None))) | None | Some(Err(_)) => {
                panic!("fin de connexion sans Close motivé")
            }
            Some(Ok(_)) => {}
        }
    };
    assert_eq!(reason, "slow_consumer");
    assert!(seen.len() < ids.len(), "il a bien manqué des messages");

    // Reconnecté avec `known`, il récupère exactement le reste, dans l'ordre, sans recouvrement
    let mut again = open(&h).await;
    let known: Vec<&str> = seen.iter().map(String::as_str).collect();
    send(&mut again, hello_in("tok", "a", vec!["c1"], known)).await;
    let w = recv(&mut again).await;
    assert!(w["omitted"].is_null(), "rien d'omis");
    let rest = backlog_ids(&w);
    let rebuilt: Vec<String> = seen.iter().cloned().chain(rest).collect();
    assert_eq!(rebuilt, ids);
}

#[tokio::test]
async fn ecriture_bloquee_ne_retient_pas_l_arret() {
    let h = hub_with(|c| {
        c.host_user_id = Some("prof".into());
        c.write_timeout = Duration::from_millis(500);
        c.stop_grace = Duration::from_secs(3);
        c.idle_timeout = Duration::from_secs(600);
    })
    .await;

    // Ne reprend jamais sa lecture : sa tâche reste bloquée dans une écriture
    let _slow = open_slow(&h, "a", vec![]).await;
    flood_as_host(&h, 20_000, || h.peer_count() == 0).await;

    // Sans délai d'écriture, la tâche bloquée ne verrait pas l'arrêt et `stop()` attendrait
    // les 3 s de `stop_grace`.
    let start_at = Instant::now();
    tokio::time::timeout(Duration::from_millis(1500), h.stop())
        .await
        .expect("stop() doit rendre la main bien avant stop_grace");
    assert!(start_at.elapsed() < Duration::from_millis(1500));
}
```

`Cargo.toml` et `main.rs` ne changent pas : `Notify` et `TcpSocket` sont déjà couverts par les features `sync` et `net`, et il n'y a pas de nouveau flag CLI.

## Mutations

Une par ajout, à appliquer dans `hub.rs`. Le test indiqué doit échouer.

| Mutation | Test qui doit échouer |
|---|---|
| Supprimer le `idle.as_mut().reset(...)` | `les_pings_gardent_la_connexion` |
| Remplacer `idle_timeout` par une durée énorme dans `tokio::time::sleep(cfg.idle_timeout)` | `inactif_est_coupe_avec_close` |
| `mpsc::channel(1_000_000)` au lieu de la capacité de la config | `lecteur_lent_est_evince` |
| Retirer la boucle `for id in evicted { s.clients.remove(&id); }` | `lecteur_lent_est_evince` |
| Supprimer l'appel `close_with(... "slow_consumer" ...)` dans l'arm `evict` | `lecteur_evince_recoit_close_puis_rattrape` |
| Dans `send_within`, remplacer `tokio::time::timeout(limit, sink.send(msg))` par `sink.send(msg)` | `ecriture_bloquee_ne_retient_pas_l_arret` |

## Points à surveiller

- **Taille du flood** : `flood_as_host` plafonne à 20 000 messages (~80 Mo). Si les tampons TCP de ton OS dépassent ça (Windows en loopback, à confirmer), les trois tests de flood échoueront sur le `assert_eq!(h.peer_count(), …)`. Il suffira alors de monter ce plafond.
- **Mémoire** : le test `lecteur_evince_recoit_close_puis_rattrape` garde jusqu'à `max_backlog = 100 000` messages. En pratique il en stocke quelques milliers.
- **Ordre `biased`** : arrêt, éviction, inactivité, file de sortie, trames entrantes. La file de sortie étant bornée, elle ne peut pas affamer les trames entrantes.