--port et les valeurs de débit illisibles sortent en ERROR bad_options avec le code 2. Dans le log, --port abc sortait en start_failed avec le code 1, donc j'ai modifié ce test.
Un --members illisible ou invalide donne aussi un code 2, au lieu d'un panic.
crates\chat\relay\src\hub.rs
hub.rs : un ajout dans impl StartError, avant from_bind.


    /// Code stable lisible par machine ; le texte de `Display` est pour l'humain.
    pub fn code(&self) -> &'static str {
        match self {
            Self::PortInUse { .. } => "port_in_use",
            Self::PermissionDenied { .. } => "permission_denied",
            Self::AddressNotAvailable { .. } => "address_unavailable",
            Self::Io(_) => "start_failed",
        }
    }

// packages/chat/tests/global-setup.ts
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export default function setup() {
  if (process.env.CHAT_RELAY_BIN) return
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')
  const r = spawnSync('cargo', ['build', '-p', 'chat-relay'], { cwd: root, stdio: 'inherit' })
  if (r.error || r.status !== 0) {
    throw new Error(`cargo build -p chat-relay a échoué (${r.error?.message ?? `code ${r.status}`})`)
  }
}

// packages/chat/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    globalSetup: ['./tests/global-setup.ts'],
  },
})
//crates/chat/relay/src/main.rs
use std::collections::{HashMap, HashSet};
use std::fmt::Display;
use std::process::exit;

use chat_relay::{start, HubConfig};

const USAGE: &str = "usage: chat-relay --token <jeton> [--port N] [--bind IP] [--members fichier.json] [--host-user ID] [--max-connections N] [--rate-burst N] [--rate-per-sec F] [--stop-on-stdin-eof]";

const KNOWN_OPTIONS: &[&str] = &[
    "--token",
    "--port",
    "--bind",
    "--members",
    "--host-user",
    "--max-connections",
    "--rate-burst",
    "--rate-per-sec",
    "--stop-on-stdin-eof",
];

const FLAGS: &[&str] = &["--stop-on-stdin-eof"];

struct Opts {
    values: HashMap<&'static str, String>,
    stop_on_stdin_eof: bool,
}

fn parse(args: &[String]) -> Result<Opts, String> {
    let mut values = HashMap::new();
    let mut stop_on_stdin_eof = false;
    let mut it = args.iter();

    while let Some(a) = it.next() {
        let Some(name) = KNOWN_OPTIONS.iter().find(|k| **k == a.as_str()) else {
            return Err(if a.starts_with("--") {
                format!("option inconnue : {a}")
            } else {
                format!("argument inattendu : {a}")
            });
        };

        if FLAGS.contains(name) {
            stop_on_stdin_eof = true;
            continue;
        }

        let Some(v) = it.next() else {
            return Err(format!("valeur manquante pour {name}"));
        };
        values.insert(*name, v.clone());
    }

    Ok(Opts {
        values,
        stop_on_stdin_eof,
    })
}

fn bad(msg: impl Display) -> ! {
    eprintln!("ERROR bad_options: {msg}");
    exit(2)
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let opts = parse(&args).unwrap_or_else(|e| bad(e));
    let get = |name: &str| opts.values.get(name).cloned();

    let Some(token) = get("--token") else {
        eprintln!("{USAGE}");
        exit(2);
    };
    if token.is_empty() {
        bad("le jeton est vide");
    }

    let bind = get("--bind").unwrap_or_else(|| "0.0.0.0".into());
    let port: u16 = match get("--port") {
        None => 0,
        Some(p) => p
            .parse()
            .unwrap_or_else(|_| bad(format!("port illisible : {p}"))),
    };

    let mut cfg = HubConfig::new(token);
    cfg.host_user_id = get("--host-user");

    if let Some(v) = get("--max-connections") {
        match v.parse::<usize>() {
            Ok(n) if n >= 1 => cfg.max_connections = n,
            _ => bad(format!("--max-connections doit être un entier >= 1 : {v}")),
        }
    }

    if let Some(v) = get("--rate-burst") {
        match v.parse::<u32>() {
            Ok(n) if n >= 1 => cfg.rate_burst = n,
            _ => bad(format!("--rate-burst doit être un entier >= 1 : {v}")),
        }
    }

    if let Some(v) = get("--rate-per-sec") {
        match v.parse::<f64>() {
            Ok(f) if f.is_finite() && f > 0.0 => cfg.rate_per_sec = f,
            _ => bad(format!("--rate-per-sec doit être un nombre > 0 : {v}")),
        }
    }

    if let Some(path) = get("--members") {
        let raw = std::fs::read_to_string(&path)
            .unwrap_or_else(|e| bad(format!("--members illisible ({path}) : {e}")));
        let parsed: HashMap<String, Vec<String>> = serde_json::from_str(&raw)
            .unwrap_or_else(|_| bad("--members : JSON {canal: [utilisateurs]} attendu"));
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
            eprintln!("ERROR {}: {e}", e.code());
            exit(1);
        }
    };

    println!("LISTENING {}", handle.addr);

    let stdin_closed = if opts.stop_on_stdin_eof {
        let (tx, rx) = tokio::sync::oneshot::channel::<()>();
        std::thread::spawn(move || {
            let _ = std::io::copy(&mut std::io::stdin().lock(), &mut std::io::sink());
            let _ = tx.send(());
        });
        Some(rx)
    } else {
        None
    };

    tokio::select! {
        _ = tokio::signal::ctrl_c() => {}
        _ = async {
            match stdin_closed {
                Some(rx) => {
                    let _ = rx.await;
                }
                None => std::future::pending::<()>().await,
            }
        } => {}
    }

    handle.stop().await;
}



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