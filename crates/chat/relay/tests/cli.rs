//crates/chat/relay/tests/cli.rs
use std::io::{BufRead, BufReader, Read};
use std::net::{TcpListener, TcpStream};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

const BIN: &str = env!("CARGO_BIN_EXE_chat-relay");

fn spawn(args: &[&str]) -> Child {
    Command::new(BIN)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("lancement du binaire")
}

fn listening(child: &mut Child) -> String {
    let mut lines = BufReader::new(child.stdout.take().unwrap()).lines();
    let line = lines.next().expect("stdout fermé").expect("lecture");
    line.strip_prefix("LISTENING ")
        .expect("ligne LISTENING")
        .to_string()
}

fn wait_exit(child: &mut Child, within: Duration) -> Option<std::process::ExitStatus> {
    let end = Instant::now() + within;
    while Instant::now() < end {
        if let Some(status) = child.try_wait().unwrap() {
            return Some(status);
        }
        std::thread::sleep(Duration::from_millis(25));
    }
    None
}

fn stderr_of(mut child: Child) -> String {
    let mut s = String::new();
    child
        .stderr
        .take()
        .unwrap()
        .read_to_string(&mut s)
        .unwrap();
    s
}

fn fails(args: &[&str]) -> (Option<i32>, String) {
    let mut c = spawn(args);
    let status = wait_exit(&mut c, Duration::from_secs(5)).unwrap_or_else(|| {
        let _ = c.kill();
        panic!("le binaire devait sortir rapidement")
    });
    (status.code(), stderr_of(c))
}

#[test]
fn s_arrete_proprement_quand_stdin_se_ferme() {
    let mut c = spawn(&[
        "--token",
        "tok",
        "--bind",
        "127.0.0.1",
        "--port",
        "0",
        "--stop-on-stdin-eof",
    ]);
    let addr = listening(&mut c);
    assert!(TcpStream::connect(&addr).is_ok(), "le relais écoute");
    drop(c.stdin.take());
    let status = wait_exit(&mut c, Duration::from_secs(5));
    if status.is_none() {
        let _ = c.kill();
    }
    assert!(
        status.expect("le relais doit s'arrêter").success(),
        "arrêt propre : code 0"
    );
    assert!(TcpStream::connect(&addr).is_err(), "le port est rendu");
}

#[test]
fn sans_le_drapeau_la_fermeture_de_stdin_ne_l_arrete_pas() {
    let mut c = spawn(&["--token", "tok", "--bind", "127.0.0.1", "--port", "0"]);
    let addr = listening(&mut c);
    drop(c.stdin.take());
    std::thread::sleep(Duration::from_millis(500));
    assert!(c.try_wait().unwrap().is_none(), "il tourne toujours");
    assert!(TcpStream::connect(&addr).is_ok());
    let _ = c.kill();
}

#[test]
fn port_occupe_sort_en_erreur_avec_un_code_stable() {
    let blocker = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = blocker.local_addr().unwrap().port().to_string();
    let (code, err) = fails(&["--token", "tok", "--bind", "127.0.0.1", "--port", &port]);
    assert_eq!(code, Some(1));
    assert!(err.starts_with("ERROR port_in_use: "), "stderr: {err}");
    assert!(err.contains("déjà utilisé"), "message lisible: {err}");
}

#[test]
fn adresse_inexistante_sur_cet_appareil() {
    let (code, err) = fails(&["--token", "tok", "--bind", "203.0.113.77", "--port", "0"]);
    assert_eq!(code, Some(1));
    assert!(
        err.starts_with("ERROR address_unavailable: "),
        "stderr: {err}"
    );
}

#[test]
fn port_illisible_est_une_erreur_d_options() {
    let (code, err) = fails(&["--token", "tok", "--bind", "127.0.0.1", "--port", "abc"]);
    assert_eq!(code, Some(2));
    assert!(
        err.starts_with("ERROR bad_options: port illisible"),
        "stderr: {err}"
    );
}

#[test]
fn sans_jeton_affiche_l_usage() {
    let (code, err) = fails(&["--port", "0"]);
    assert_eq!(code, Some(2));
    assert!(err.contains("usage: chat-relay"));
}

#[test]
fn jeton_vide_refuse() {
    let (code, err) = fails(&["--token", "", "--port", "0"]);
    assert_eq!(code, Some(2));
    assert!(err.starts_with("ERROR bad_options: "), "stderr: {err}");
}

#[test]
fn option_inconnue_refusee() {
    let (code, err) = fails(&["--token", "tok", "--xxx", "1"]);
    assert_eq!(code, Some(2));
    assert!(
        err.starts_with("ERROR bad_options: option inconnue : --xxx"),
        "stderr: {err}"
    );
}

#[test]
fn argument_sans_option_refuse() {
    let (code, err) = fails(&["--token", "tok", "traine"]);
    assert_eq!(code, Some(2));
    assert!(err.contains("argument inattendu : traine"), "stderr: {err}");
}

#[test]
fn valeur_manquante_refusee() {
    let (code, err) = fails(&["--token", "tok", "--port"]);
    assert_eq!(code, Some(2));
    assert!(
        err.contains("valeur manquante pour --port"),
        "stderr: {err}"
    );
}

#[test]
fn debit_et_bornes_illisibles_refuses() {
    for (opt, val) in [
        ("--max-connections", "0"),
        ("--max-connections", "x"),
        ("--rate-burst", "0"),
        ("--rate-burst", "x"),
        ("--rate-per-sec", "0"),
        ("--rate-per-sec", "nan"),
    ] {
        let (code, err) = fails(&["--token", "tok", opt, val]);
        assert_eq!(code, Some(2), "{opt} {val}");
        assert!(err.starts_with("ERROR bad_options: "), "{opt} {val}: {err}");
    }
}

#[test]
fn members_invalide_ou_absent_refuse_sans_panique() {
    let (code, err) = fails(&["--token", "tok", "--members", "/chemin/inexistant.json"]);
    assert_eq!(code, Some(2));
    assert!(
        err.starts_with("ERROR bad_options: --members illisible"),
        "stderr: {err}"
    );

    let path =
        std::env::temp_dir().join(format!("chat-relay-members-bad-{}.json", std::process::id()));
    std::fs::write(&path, "pas du json").unwrap();
    let (code, err) = fails(&["--token", "tok", "--members", path.to_str().unwrap()]);
    let _ = std::fs::remove_file(&path);
    assert_eq!(code, Some(2));
    assert!(
        err.contains("JSON {canal: [utilisateurs]} attendu"),
        "stderr: {err}"
    );
}

#[test]
fn toutes_les_options_connues_sont_acceptees() {
    let path =
        std::env::temp_dir().join(format!("chat-relay-members-ok-{}.json", std::process::id()));
    std::fs::write(&path, r#"{"c1":["prof","a"]}"#).unwrap();
    let mut c = spawn(&[
        "--token",
        "tok",
        "--bind",
        "127.0.0.1",
        "--port",
        "0",
        "--members",
        path.to_str().unwrap(),
        "--host-user",
        "prof",
        "--max-connections",
        "16",
        "--rate-burst",
        "5",
        "--rate-per-sec",
        "2.5",
        "--stop-on-stdin-eof",
    ]);
    let addr = listening(&mut c);
    assert!(TcpStream::connect(&addr).is_ok());
    drop(c.stdin.take());
    let status = wait_exit(&mut c, Duration::from_secs(5));
    if status.is_none() {
        let _ = c.kill();
    }
    let _ = std::fs::remove_file(&path);
    assert!(status.expect("arrêt par stdin").success());
}
