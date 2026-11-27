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
