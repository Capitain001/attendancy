Livraison 2 (Rust, sans Tauri). 

## 1. Choix d'adresse (fonction pure)

```rust
//crates\chat\relay\src\addr.rs
use std::collections::HashSet;
use std::net::Ipv4Addr;

use serde::Serialize;

/// Interface réseau vue de l'appareil. La liste réelle vient de la couche native (if-addrs) ;
/// ce module reste pur pour être testé sur des listes écrites à la main.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Iface {
    pub name: String,
    pub ip: Ipv4Addr,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AddrKind {
    /// Point d'accès / partage de connexion (adresses fixes des systèmes)
    Hotspot,
    Lan,
    LinkLocal,
    Virtual,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Candidate {
    pub ip: Ipv4Addr,
    pub name: String,
    pub kind: AddrKind,
}

const HOTSPOTS: [Ipv4Addr; 3] = [
    Ipv4Addr::new(192, 168, 43, 1),  // Android
    Ipv4Addr::new(172, 20, 10, 1),   // iOS
    Ipv4Addr::new(192, 168, 137, 1), // Windows
];

/// Adresses que le lien d'appairage accepte (sous-ensemble de `isLocalHost` côté TypeScript :
/// 10/8, 172.16/12, 192.168/16, 169.254/16). Le loopback est exclu : inutile à publier.
pub fn is_pairable(ip: Ipv4Addr) -> bool {
    let [a, b, ..] = ip.octets();
    a == 10 || (a == 172 && (16..=31).contains(&b)) || (a == 192 && b == 168) || (a == 169 && b == 254)
}

fn is_virtual(name: &str) -> bool {
    let n = name.to_lowercase();
    ["tun", "tap", "utun", "wg", "veth"].iter().any(|p| n.starts_with(p))
        || ["docker", "vmware", "virtualbox", "vpn"].iter().any(|p| n.contains(p))
}

/// Candidats à publier, du meilleur au moins bon :
/// 1. points d'accès, puis réseaux locaux (interfaces réelles) ;
/// 2. à défaut, link-local (pairing sans DHCP) ;
/// 3. à défaut, interfaces virtuelles (dernier recours).
/// Une interface virtuelle n'est jamais un point d'accès. Doublons d'IP éliminés.
pub fn pick_addresses(ifaces: &[Iface]) -> Vec<Candidate> {
    let mut seen = HashSet::new();
    let (mut hotspot, mut lan, mut link_local, mut virtuals) = (vec![], vec![], vec![], vec![]);

    for i in ifaces {
        if !is_pairable(i.ip) || !seen.insert(i.ip) {
            continue;
        }
        let (kind, bucket) = if is_virtual(&i.name) {
            (AddrKind::Virtual, &mut virtuals)
        } else if HOTSPOTS.contains(&i.ip) {
            (AddrKind::Hotspot, &mut hotspot)
        } else if i.ip.is_link_local() {
            (AddrKind::LinkLocal, &mut link_local)
        } else {
            (AddrKind::Lan, &mut lan)
        };
        bucket.push(Candidate {
            ip: i.ip,
            name: i.name.clone(),
            kind,
        });
    }

    let mut out = hotspot;
    out.extend(lan);
    if out.is_empty() {
        out = link_local;
    }
    if out.is_empty() {
        out = virtuals;
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn i(name: &str, ip: [u8; 4]) -> Iface {
        Iface {
            name: name.into(),
            ip: Ipv4Addr::from(ip),
        }
    }

    fn ips(v: &[Candidate]) -> Vec<String> {
        v.iter().map(|c| c.ip.to_string()).collect()
    }

    #[test]
    fn ignore_loopback_public_cgnat_et_non_specifiee() {
        let r = pick_addresses(&[
            i("lo", [127, 0, 0, 1]),
            i("Ethernet", [8, 8, 8, 8]),
            i("Tailscale", [100, 101, 2, 3]),
            i("x", [0, 0, 0, 0]),
            i("Wi-Fi", [192, 168, 1, 20]),
        ]);
        assert_eq!(ips(&r), vec!["192.168.1.20"]);
    }

    #[test]
    fn bornes_de_172_16_12() {
        for (ip, ok) in [
            ([172, 15, 0, 1], false),
            ([172, 16, 0, 1], true),
            ([172, 31, 255, 254], true),
            ([172, 32, 0, 1], false),
            ([169, 254, 1, 1], true),
            ([127, 0, 0, 1], false),
        ] {
            assert_eq!(is_pairable(Ipv4Addr::from(ip)), ok, "{ip:?}");
        }
    }

    #[test]
    fn interfaces_virtuelles_ecartees_si_un_vrai_reseau_existe() {
        let r = pick_addresses(&[
            i("docker0", [172, 17, 0, 1]),
            i("vEthernet (WSL)", [172, 28, 0, 1]),
            i("VMware Network Adapter VMnet8", [192, 168, 52, 1]),
            i("VirtualBox Host-Only Ethernet Adapter", [192, 168, 56, 1]),
            i("tun0", [10, 8, 0, 2]),
            i("utun3", [10, 9, 0, 2]),
            i("wg0", [10, 7, 0, 2]),
            i("TAP-Windows Adapter V9", [10, 6, 0, 2]),
            i("Wi-Fi", [192, 168, 1, 20]),
        ]);
        assert_eq!(ips(&r), vec!["192.168.1.20"]);
        assert_eq!(r[0].kind, AddrKind::Lan);
    }

    #[test]
    fn les_virtuelles_ne_servent_que_de_dernier_recours() {
        let r = pick_addresses(&[i("docker0", [172, 17, 0, 1])]);
        assert_eq!(ips(&r), vec!["172.17.0.1"]);
        assert_eq!(r[0].kind, AddrKind::Virtual);
    }

    #[test]
    fn points_d_acces_en_tete_puis_reseaux_locaux() {
        let r = pick_addresses(&[
            i("Ethernet", [192, 168, 1, 20]),
            i("Local Area Connection* 10", [192, 168, 137, 1]),
            i("wlan0", [192, 168, 43, 1]),
            i("en0", [172, 20, 10, 1]),
        ]);
        assert_eq!(
            ips(&r),
            vec!["192.168.137.1", "192.168.43.1", "172.20.10.1", "192.168.1.20"]
        );
        assert_eq!(r[0].kind, AddrKind::Hotspot);
        assert_eq!(r[3].kind, AddrKind::Lan);
    }

    #[test]
    fn une_interface_virtuelle_n_est_jamais_un_point_d_acces() {
        let r = pick_addresses(&[
            i("vEthernet (Default Switch)", [192, 168, 137, 1]),
            i("Wi-Fi", [192, 168, 1, 20]),
        ]);
        assert_eq!(ips(&r), vec!["192.168.1.20"]);
    }

    #[test]
    fn link_local_seulement_sans_autre_reseau() {
        let seul = pick_addresses(&[i("Ethernet", [169, 254, 3, 4])]);
        assert_eq!(seul[0].kind, AddrKind::LinkLocal);

        let avec_wifi = pick_addresses(&[i("Ethernet", [169, 254, 3, 4]), i("Wi-Fi", [192, 168, 1, 20])]);
        assert_eq!(ips(&avec_wifi), vec!["192.168.1.20"]);
    }

    #[test]
    fn doublons_et_liste_vide() {
        let r = pick_addresses(&[i("Wi-Fi", [192, 168, 1, 20]), i("Wi-Fi 2", [192, 168, 1, 20])]);
        assert_eq!(r.len(), 1);
        assert!(pick_addresses(&[]).is_empty());
    }
}
```

## 2. Service d'hébergement (sans Tauri)

```rust
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
```

## 3. `lib.rs`

```rust
//crates\chat\relay\src\lib.rs
// ajouter les deux modules (ordre alphabétique) :
pub mod addr;
pub mod host;

// et les réexportations :
pub use addr::{is_pairable, pick_addresses, AddrKind, Candidate, Iface};
pub use host::{HostError, HostOptions, HostService, Running};
```

## 4. Tests d'intégration du service

```rust
//crates\chat\relay\tests\host.rs
use std::collections::HashMap;
use std::net::TcpListener;
use std::time::Duration;

use chat_relay::{Envelope, HostOptions, HostService, Running};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

type Ws = WebSocketStream<MaybeTlsStream<TcpStream>>;

fn opts() -> HostOptions {
    HostOptions {
        token: "tok".into(),
        bind: Some("127.0.0.1".into()),
        ..Default::default()
    }
}

fn env(id: &str, channel: &str, author: &str) -> Envelope {
    Envelope {
        v: 1,
        id: id.into(),
        channel_id: channel.into(),
        author_id: author.into(),
        author_name: None,
        content: "salut".into(),
        parent_id: None,
        created_at: "2026-11-27T10:00:00.000Z".into(),
        sig: None,
    }
}

async fn connect(run: &Running) -> Result<Ws, tokio_tungstenite::tungstenite::Error> {
    let url = format!("ws://127.0.0.1:{}", run.port);
    tokio::time::timeout(Duration::from_secs(3), connect_async(url.as_str()))
        .await
        .expect("délai de connexion")
        .map(|(ws, _)| ws)
}

async fn send(ws: &mut Ws, v: Value) {
    ws.send(Message::Text(v.to_string())).await.unwrap();
}

async fn next(ws: &mut Ws) -> Value {
    loop {
        let m = tokio::time::timeout(Duration::from_secs(3), ws.next())
            .await
            .expect("délai")
            .expect("flux fermé")
            .expect("erreur de socket");
        if let Message::Text(t) = m {
            return serde_json::from_str(&t).unwrap();
        }
    }
}

async fn join(run: &Running, user: &str, channels: &[&str]) -> Ws {
    let mut ws = connect(run).await.expect("connexion");
    send(
        &mut ws,
        json!({"t":"hello","token":"tok","userId":user,"channels":channels,"known":[]}),
    )
    .await;
    let w = next(&mut ws).await;
    assert_eq!(w["t"], "welcome", "{w}");
    ws
}

fn members(pairs: &[(&str, &[&str])]) -> HashMap<String, Vec<String>> {
    pairs
        .iter()
        .map(|(c, us)| (c.to_string(), us.iter().map(|u| u.to_string()).collect()))
        .collect()
}

#[tokio::test]
async fn demarre_sur_un_port_reel_et_current_le_dit() {
    let host = HostService::new();
    assert!(host.current().is_none());
    let run = host.start(opts()).await.unwrap();
    assert!(run.port > 0);
    assert_eq!(run.host, "127.0.0.1");
    assert_eq!(host.current(), Some(run.clone()));
    assert!(TcpStream::connect(("127.0.0.1", run.port)).await.is_ok());
    host.stop().await;
    assert!(host.current().is_none());
}

#[tokio::test]
async fn second_start_refuse_stop_idempotent_et_restart_permis() {
    let host = HostService::new();
    host.stop().await; // rien d'ouvert : sans effet
    let run = host.start(opts()).await.unwrap();
    assert_eq!(host.start(opts()).await.unwrap_err().code(), "AlreadyStarted");

    host.stop().await;
    host.stop().await;
    assert!(
        TcpStream::connect(("127.0.0.1", run.port)).await.is_err(),
        "le port est rendu"
    );

    let _again = host.start(opts()).await.unwrap();
    host.stop().await;
}

#[tokio::test]
async fn deux_start_simultanes_un_seul_passe() {
    let host = HostService::new();
    let (a, b) = tokio::join!(host.start(opts()), host.start(opts()));
    assert_eq!([a.is_ok(), b.is_ok()].iter().filter(|ok| **ok).count(), 1);
    host.stop().await;
}

#[tokio::test]
async fn port_occupe_donne_port_in_use() {
    let blocker = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = blocker.local_addr().unwrap().port();
    let host = HostService::new();
    let err = host.start(HostOptions { port, ..opts() }).await.unwrap_err();
    assert_eq!(err.code(), "PortInUse");
    assert!(host.current().is_none());
}

#[tokio::test]
async fn host_absent_de_tous_les_canaux_refuse_sans_rien_lancer() {
    let host = HostService::new();
    let err = host
        .start(HostOptions {
            host_user_id: Some("prof".into()),
            members: Some(members(&[("c1", &["a"])])),
            ..opts()
        })
        .await
        .unwrap_err();
    assert_eq!(err.code(), "HostNotInMembers");
    assert!(host.current().is_none());

    // présent dans un seul canal : accepté
    host.start(HostOptions {
        host_user_id: Some("prof".into()),
        members: Some(members(&[("c1", &["a"]), ("c2", &["prof"])])),
        ..opts()
    })
    .await
    .unwrap();
    host.stop().await;
}

#[tokio::test]
async fn options_invalides_refusees() {
    let host = HostService::new();
    for bad in [
        HostOptions { token: String::new(), ..opts() },
        HostOptions { max_connections: Some(0), ..opts() },
        HostOptions { max_pending_hello: Some(0), ..opts() },
        HostOptions { host_user_id: Some(String::new()), ..opts() },
    ] {
        assert_eq!(host.start(bad).await.unwrap_err().code(), "BadOptions");
    }
    assert!(host.current().is_none());
}

#[tokio::test]
async fn post_de_l_hote_succes_doublon_et_refus_typés() {
    let host = HostService::new();
    assert_eq!(host.post(env("m", "c1", "prof")).unwrap_err().code(), "NotRunning");
    assert_eq!(host.snapshot().unwrap_err().code(), "NotRunning");

    host.start(opts()).await.unwrap(); // sans hôte déclaré
    assert_eq!(host.post(env("m", "c1", "prof")).unwrap_err().code(), "no_host");
    host.stop().await;

    host.start(HostOptions {
        host_user_id: Some("prof".into()),
        members: Some(members(&[("c1", &["prof"])])),
        ..opts()
    })
    .await
    .unwrap();
    assert!(host.post(env("m1", "c1", "prof")).unwrap());
    assert!(!host.post(env("m1", "c1", "prof")).unwrap(), "doublon : Ok(false)");
    assert_eq!(host.post(env("m2", "c2", "prof")).unwrap_err().code(), "not_member");
    assert_eq!(host.post(env("m3", "c1", "autre")).unwrap_err().code(), "author_mismatch");
    assert_eq!(host.snapshot().unwrap().len(), 1);
    host.stop().await;
}

#[tokio::test]
async fn un_client_et_l_hote_s_echangent_des_messages() {
    let host = HostService::new();
    let run = host
        .start(HostOptions { host_user_id: Some("prof".into()), ..opts() })
        .await
        .unwrap();
    let mut rx = host.subscribe().unwrap();
    let mut a = join(&run, "a", &["c1"]).await;

    assert!(host.post(env("h1", "c1", "prof")).unwrap());
    let m = next(&mut a).await;
    assert_eq!((m["t"].as_str(), m["env"]["id"].as_str()), (Some("msg"), Some("h1")));

    send(
        &mut a,
        json!({"t":"msg","env":{"v":1,"id":"a1","channelId":"c1","authorId":"a","content":"salut","createdAt":"2026-11-27T10:00:00.000Z"}}),
    )
    .await;
    assert_eq!(next(&mut a).await["t"], "ack");
    let got = tokio::time::timeout(Duration::from_secs(3), rx.recv())
        .await
        .expect("délai")
        .unwrap();
    assert_eq!(got.id, "a1");
    host.stop().await;
}

#[tokio::test]
async fn max_connections_est_applique() {
    let host = HostService::new();
    let run = host
        .start(HostOptions { max_connections: Some(1), ..opts() })
        .await
        .unwrap();
    let _first = join(&run, "a", &["c1"]).await;
    assert!(
        connect(&run).await.is_err(),
        "la 2e connexion est coupée avant la poignée de main"
    );
    host.stop().await;
}

#[tokio::test]
async fn max_pending_hello_est_applique() {
    let host = HostService::new();
    let run = host
        .start(HostOptions { max_pending_hello: Some(1), ..opts() })
        .await
        .unwrap();
    // Occupe la seule place « sans hello » : poignée de main jamais faite
    let _holder = TcpStream::connect(("127.0.0.1", run.port)).await.unwrap();
    tokio::time::sleep(Duration::from_millis(150)).await;
    assert!(connect(&run).await.is_err());
    host.stop().await;
}

#[tokio::test]
async fn members_est_applique_aux_clients() {
    let host = HostService::new();
    let run = host
        .start(HostOptions { members: Some(members(&[("c1", &["a"])])), ..opts() })
        .await
        .unwrap();
    let mut b = connect(&run).await.unwrap();
    send(
        &mut b,
        json!({"t":"hello","token":"tok","userId":"b","channels":["c1"],"known":[]}),
    )
    .await;
    let r = next(&mut b).await;
    assert_eq!((r["t"].as_str(), r["reason"].as_str()), (Some("reject"), Some("not_member")));
    host.stop().await;
}
```

## Notes

- **Raffinement de la décision 8** : « rétrograder » le link-local et les interfaces virtuelles devient un **repli par paliers**, pas un classement dans la même liste. Les points d'accès et réseaux locaux d'abord, à défaut le link-local, à défaut les virtuelles. Raison : sous Windows, un adaptateur déconnecté a presque toujours une adresse `169.254.x.x`, et la liste « plusieurs candidats » serait polluée en permanence. À refuser si tu préfères un classement unique.
- **`HostNotInMembers`** : refus si l'hôte n'est dans **aucun** canal. C'est déjà le comportement de `relay-host.ts` (`some`), donc les deux côtés restent alignés.
- **`bind` par défaut** : `0.0.0.0` côté Rust (les autres appareils doivent joindre l'hôte), alors que `relay-host.ts` utilise `127.0.0.1` pour les tests. C'est voulu.
- **Les trous signalés plus tôt sont couverts ici** : `max_connections`, `max_pending_hello` et `members` sont testés dans leur câblage réel (`max_connections` n'avait aucun test).
- Le service est `Send + Sync`, il se mettra tel quel dans l'état géré de Tauri.

## Mutations à faire toi-même

| Casse volontaire | Test qui doit échouer |
|---|---|
| Retirer le `if … is_some()` → `AlreadyStarted` | `second_start_refuse…`, `deux_start_simultanes…` |
| Retirer le bloc `HostNotInMembers` de `validate` | `host_absent_de_tous_les_canaux…` |
| Supprimer `cfg.max_connections = n` | `max_connections_est_applique` |
| Supprimer `cfg.max_pending_hello = n` | `max_pending_hello_est_applique` |
| Ne pas affecter `cfg.members` | `members_est_applique_aux_clients` |
| Retirer le filtre `is_virtual` | `interfaces_virtuelles_ecartees…` |
| Mettre `is_pairable` à `true` pour 100.64/10 | `ignore_loopback_public_cgnat…` |

