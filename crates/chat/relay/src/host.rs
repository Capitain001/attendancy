//crates\chat\relay\src\host.rs
use std::collections::{HashMap, HashSet};
use std::fmt;
use std::sync::Mutex;

use serde::{Deserialize, Serialize, Serializer};
use tokio::sync::broadcast;

use crate::hub::{start, HubConfig, HubHandle, StartError};
use crate::protocol::Envelope;

/// Paramètres de l'hôte. Aucune notion métier : le profil (classe, salle, DM) les calcule en amont.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct HostOptions {
    pub token: String,
    pub host_user_id: Option<String>,
    pub members: Option<HashMap<String, Vec<String>>>,
    /// 0 = port libre
    pub port: u16,
    /// Défaut 0.0.0.0 : les autres appareils doivent pouvoir joindre l'hôte
    pub bind: Option<String>,
    pub max_connections: Option<usize>,
    pub max_pending_hello: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Running {
    pub host: String,
    pub port: u16,
}

#[derive(Debug)]
pub enum HostError {
    AlreadyStarted,
    NotRunning,
    HostNotInMembers(String),
    BadOptions(String),
    Start(StartError),
    /// Refus de `post_as_host` : la raison du relais (`not_member`, `bad_content`, `no_host`…)
    Rejected(&'static str),
}

impl HostError {
    /// Code stable lisible par machine, identique à `RelayHostError` côté TypeScript.
    pub fn code(&self) -> &'static str {
        match self {
            Self::AlreadyStarted => "AlreadyStarted",
            Self::NotRunning => "NotRunning",
            Self::HostNotInMembers(_) => "HostNotInMembers",
            Self::BadOptions(_) => "BadOptions",
            Self::Start(StartError::PortInUse { .. }) => "PortInUse",
            Self::Start(StartError::PermissionDenied { .. }) => "PermissionDenied",
            Self::Start(StartError::AddressNotAvailable { .. }) => "AddressNotAvailable",
            Self::Start(StartError::Io(_)) => "StartFailed",
            Self::Rejected(reason) => reason,
        }
    }
}

impl fmt::Display for HostError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AlreadyStarted => write!(f, "Un serveur local est déjà ouvert."),
            Self::NotRunning => write!(f, "Aucun serveur local n'est ouvert."),
            Self::HostNotInMembers(h) => write!(f, "L'hôte « {h} » ne figure dans aucun canal autorisé."),
            Self::BadOptions(m) => write!(f, "Paramètres invalides : {m}"),
            Self::Start(e) => write!(f, "{e}"),
            Self::Rejected(r) => write!(f, "Message refusé : {r}"),
        }
    }
}

impl std::error::Error for HostError {}

/// Forme transmise à l'interface : `{ code, message }`.
impl Serialize for HostError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        #[derive(Serialize)]
        struct Dto {
            code: &'static str,
            message: String,
        }
        Dto {
            code: self.code(),
            message: self.to_string(),
        }
        .serialize(s)
    }
}

struct Active {
    handle: HubHandle,
    running: Running,
}

/// Un seul relais à la fois. `start` et `stop` sont sérialisés (`lifecycle`) : deux `start`
/// simultanés n'en laissent passer qu'un, et `stop` attend la fin d'un `start` en cours.
/// `post`, `snapshot` et `subscribe` sont synchrones et ne prennent que le verrou d'état.
#[derive(Default)]
pub struct HostService {
    lifecycle: tokio::sync::Mutex<()>,
    active: Mutex<Option<Active>>,
}

fn validate(o: &HostOptions) -> Result<(), HostError> {
    let bad = |m: &str| HostError::BadOptions(m.into());
    if o.token.is_empty() {
        return Err(bad("jeton vide"));
    }
    if o.max_connections == Some(0) {
        return Err(bad("max_connections doit être >= 1"));
    }
    if o.max_pending_hello == Some(0) {
        return Err(bad("max_pending_hello doit être >= 1"));
    }
    if o.host_user_id.as_deref() == Some("") {
        return Err(bad("identifiant d'hôte vide"));
    }
    // Refus avant lancement : sinon chaque `post` échouerait plus tard en `not_member`
    if let (Some(host), Some(members)) = (&o.host_user_id, &o.members) {
        if !members.values().any(|users| users.contains(host)) {
            return Err(HostError::HostNotInMembers(host.clone()));
        }
    }
    Ok(())
}

impl HostService {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn start(&self, o: HostOptions) -> Result<Running, HostError> {
        let _life = self.lifecycle.lock().await;
        if self.active.lock().unwrap().is_some() {
            return Err(HostError::AlreadyStarted);
        }
        validate(&o)?;

        let HostOptions {
            token,
            host_user_id,
            members,
            port,
            bind,
            max_connections,
            max_pending_hello,
        } = o;

        let mut cfg = HubConfig::new(token);
        cfg.host_user_id = host_user_id;
        cfg.members = members.map(|m| {
            m.into_iter()
                .map(|(channel, users)| (channel, users.into_iter().collect::<HashSet<_>>()))
                .collect()
        });
        if let Some(n) = max_connections {
            cfg.max_connections = n;
        }
        if let Some(n) = max_pending_hello {
            cfg.max_pending_hello = n;
        }

        let bind = bind.unwrap_or_else(|| "0.0.0.0".into());
        let handle = start(cfg, &format!("{bind}:{port}"))
            .await
            .map_err(HostError::Start)?;

        let running = Running {
            host: handle.addr.ip().to_string(),
            port: handle.addr.port(),
        };
        *self.active.lock().unwrap() = Some(Active {
            handle,
            running: running.clone(),
        });
        Ok(running)
    }

    /// Idempotent : sans effet si rien n'est ouvert. Rend le port avant de retourner.
    pub async fn stop(&self) {
        let _life = self.lifecycle.lock().await;
        let active = self.active.lock().unwrap().take();
        if let Some(a) = active {
            a.handle.stop().await;
        }
    }

    pub fn current(&self) -> Option<Running> {
        self.active.lock().unwrap().as_ref().map(|a| a.running.clone())
    }

    fn with<T>(&self, f: impl FnOnce(&HubHandle) -> T) -> Result<T, HostError> {
        let guard = self.active.lock().unwrap();
        guard
            .as_ref()
            .map(|a| f(&a.handle))
            .ok_or(HostError::NotRunning)
    }

    /// Ok(true) = nouveau message, Ok(false) = déjà connu.
    pub fn post(&self, env: Envelope) -> Result<bool, HostError> {
        self.with(|h| h.post_as_host(env))?.map_err(HostError::Rejected)
    }

    pub fn snapshot(&self) -> Result<Vec<Envelope>, HostError> {
        self.with(|h| h.snapshot())
    }

    /// Messages acceptés depuis le réseau (jamais ceux de l'hôte). Se ferme (`Closed`) à l'arrêt.
    pub fn subscribe(&self) -> Result<broadcast::Receiver<Envelope>, HostError> {
        self.with(|h| h.subscribe())
    }
}
