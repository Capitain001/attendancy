# APK — builds Tauri Android

App : `apps/desktop` — même codebase que le desktop, cible `aarch64` (la
plupart des téléphones modernes). Projet Android généré dans
`apps/desktop/src-tauri/gen/android/`.

---

## Prérequis (cette machine)

```powershell
$env:ANDROID_HOME = 'D:\ANDROID'
$env:NDK_HOME     = 'D:\ANDROID\ndk\27.3.13750724'
$env:JAVA_HOME    = 'C:\Program Files\Java\jdk-21'
```

- Targets Rust : `rustup target add aarch64-linux-android` (+ autres ABI si
  build universel)
- **Mode développeur Windows activé** (Paramètres > Système > Pour les
  développeurs) — sinon le symlink jniLibs échoue
- Vérifier la chaîne : `bun run tauri info`

## Init (déjà fait — ne ré-exécuter que si `gen/android` est supprimé)

```bash
cd apps/desktop
bun run tauri android init
```

## Build APK arm64 (recommandé pour tests — ~12,5 MB)

```bash
cd apps/desktop
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run tauri android build --apk --target aarch64
```

Sortie : `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

## Signature (obligatoire — Android refuse un APK unsigned)

```powershell
& "D:\ANDROID\build-tools\36.0.0\apksigner.bat" sign `
  --ks "$env:USERPROFILE\.android\debug.keystore" `
  --ks-pass pass:android `
  --out "src-tauri\gen\android\app\build\outputs\apk\universal\release\Attendancy-<version>-arm64-signed.apk" `
  "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk"
```

Keystore debug auto-créé par Android (pass par défaut : `android`). Pour une
distribution Play Store : keystore release dédié + `.aab` avec ABI splits.

## Build universel (4 ABI — ~38 MB, éviter sauf besoin émulateur x86)

```bash
bun run tauri android build --apk
```

## Dev sur device/émulateur

```bash
bun run tauri android dev
```

## Tests offline sur device

1. Installer l'APK signé, se connecter une fois en ligne.
2. Naviguer sur le planning (remplit le cache IndexedDB).
3. Mode avion, relancer → planning servi depuis le cache + bannière « Hors
   ligne ».

## Notes

- `VITE_API_URL` / clés Supabase sont **build-time** — rebuild après changement
  de `.env`.
- Le build compile le Rust pour chaque ABI : premier build ~4–5 min/ABI, puis
  incrémental.
- Poids : universel = 4× le `.so` Rust ; arm64 seul ≈ 12,5 MB. Optimisations
  futures (`opt-level = "z"`, `lto`, `strip` dans `Cargo.toml`) → ~8 MB.
- `gen/android` est commité (décision plan offline-local-builds) — les symlinks
  jniLibs pointent vers `src-tauri/target/`, ne pas copier les `.so` à la main.


##BUILD & sign
# 1. Build
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run tauri android build --apk --target aarch64

# 2. Signature
& "D:\ANDROID\build-tools\36.0.0\apksigner.bat" sign `
  --ks "$env:USERPROFILE\.android\debug.keystore" `
  --ks-pass pass:android `
  --out "src-tauri\gen\android\app\build\outputs\apk\universal\release\Attendancy-0.1.0-arm64-signed.apk" `
  "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk"