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
