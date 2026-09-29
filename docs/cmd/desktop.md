# Desktop — builds Tauri Windows

App : `apps/desktop` (Vite + React 19 + Tauri v2). Sortie NSIS (installeur
`.exe`), `installMode: currentUser` dans `src-tauri/tauri.conf.json`.

---

## Dev

```bash
cd apps/desktop
bun run tauri:dev          # fenêtre Tauri + hot reload Vite (port 1420)
```

## Build installateur `.exe`

```bash
cd apps/desktop
bun run tauri build
```

Sorties :

| Fichier | Chemin |
|---|---|
| Installeur NSIS | `apps/desktop/src-tauri/target/release/bundle/nsis/Attendancy_<version>_x64-setup.exe` |
| Binaire nu | `apps/desktop/src-tauri/target/release/attendancy-desktop.exe` |

## Vérification offline

1. Installer le `.exe`, se connecter une fois en ligne.
2. Naviguer sur le planning (remplit le cache IndexedDB).
3. Couper le réseau, relancer → planning servi depuis le cache + bannière
   « Hors ligne ».

## Prérequis

- Rust stable (`x86_64-pc-windows-msvc`) + Visual Studio Build Tools 2022
- WebView2 (inclus Windows 10/11 récents)
- Env de build dans `apps/desktop/.env` : `VITE_API_URL`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` (build-time, pas runtime)

## Icônes

Les icônes sont régénérées depuis un PNG carré 1024 (le `logo.svg` n'est pas
carré — le centrer d'abord) :

```bash
cd apps/desktop
bun run tauri icon <chemin-vers-png-1024>
```

⚠ Ne jamais écrire des stubs à la main dans `src-tauri/icons/` — le build Rust
échoue (CRC/decode errors) au macro `generate_context!`.
