use std::collections::{HashMap, HashSet};
use std::time::Duration;

use chat_relay::{start, HubConfig, HubHandle};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};
use tokio::net::TcpStream;

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

fn hello(token: &str, user: &str, known: Vec<&str>) -> Value {
    json!({"t":"hello","token":token,"userId":user,"name":user,"channels":["c1"],"known":known})
}

fn env(id: &str, author: &str, content: &str) -> Value {
    json!({"t":"msg","env":{"v":1,"id":id,"channelId":"c1","authorId":author,
        "content":content,"createdAt":"2026-10-26T10:00:00.000Z"}})
}

async fn join(h: &HubHandle, user: &str) -> Ws {
    let mut ws = open(h).await;
    send(&mut ws, hello("tok", user, vec![])).await;
    assert_eq!(recv(&mut ws).await["t"], "welcome");
    ws
}

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

#[tokio::test]
async fn usurpation_d_auteur_refusee() {
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
