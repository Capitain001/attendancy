//crates\chat\relay\src\main.rs
use std::collections::{HashMap, HashSet};

use chat_relay::{start, HubConfig};

fn arg(args: &[String], name: &str) -> Option<String> {
    args.iter()
        .position(|a| a == name)
        .and_then(|i| args.get(i + 1))
        .cloned()
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let bind = arg(&args, "--bind").unwrap_or_else(|| "0.0.0.0".into());
    let port = arg(&args, "--port").unwrap_or_else(|| "0".into());
    let Some(token) = arg(&args, "--token") else {
        eprintln!("usage: chat-relay --token <jeton> [--port N] [--bind IP] [--members fichier.json]");
        std::process::exit(2);
    };

    let mut cfg = HubConfig::new(token);
    if let Some(path) = arg(&args, "--members") {
        let raw = std::fs::read_to_string(&path).expect("fichier --members illisible");
        let parsed: HashMap<String, Vec<String>> =
            serde_json::from_str(&raw).expect("--members : JSON {canal: [utilisateurs]} attendu");
        cfg.members = Some(
            parsed
                .into_iter()
                .map(|(k, v)| (k, v.into_iter().collect::<HashSet<_>>()))
                .collect(),
        );
    }

    let handle = start(cfg, &format!("{bind}:{port}"))
        .await
        .expect("bind impossible");
    println!("LISTENING {}", handle.addr);

    tokio::signal::ctrl_c().await.ok();
}
