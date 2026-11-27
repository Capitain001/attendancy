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
