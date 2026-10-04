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

## Build + signature APK arm64 (recommandé pour tests — ~12,5 MB)

```bash
cd apps/desktop
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run build:android
```

Cette commande construit l'application avec le frontend local, signe l'APK avec le
keystore debug local, vérifie sa signature puis copie le fichier dans :
`apps/desktop/artifacts/Attendancy-Standalone-arm64-debug-signed.apk`.

Les builds de production Vite chargent `apps/desktop/.env.production` :
`VITE_API_URL` pointe donc vers `https://attendancy-web.vercel.app` pour que
l'APK natif appelle le serveur en ligne. En développement, `apps/desktop/.env`
peut conserver `http://localhost:3000`. Les variables Supabase
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent aussi être présentes
dans l'environnement local ou CI au moment du build.

## APK conteneur WebView

La variante WebView est un conteneur séparé qui charge le site hébergé. Elle
utilise `src-tauri/webview/tauri.conf.json` :

```powershell
cd apps/desktop
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run build:android:webview
```

L'APK est signé et vérifié, puis copié dans :
`apps/desktop/artifacts/Attendancy-WebView-arm64-debug-signed.apk`.

Les deux variantes ont le même `applicationId` (`io.attendancy.app`) :
installer l'une remplace l'autre. Elles utilisent le keystore debug local
(`%USERPROFILE%\.android\debug.keystore`, mot de passe Android par défaut
`android`) et sont destinées aux tests locaux. Pour une distribution, configurer
un keystore de release dédié et signer avec celui-ci.

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
  de `.env`, `.env.production` ou de l'environnement CI. En mode production,
  `.env.production` définit l'API Vercel ; une variable définie directement
  dans l'environnement du build reste prioritaire.
- Le build compile le Rust pour chaque ABI : premier build ~4–5 min/ABI, puis
  incrémental.
- Poids : universel = 4× le `.so` Rust ; arm64 seul ≈ 12,5 MB. Optimisations
  futures (`opt-level = "z"`, `lto`, `strip` dans `Cargo.toml`) → ~8 MB.
- `gen/android` est commité (décision plan offline-local-builds) — les symlinks
  jniLibs pointent vers `src-tauri/target/`, ne pas copier les `.so` à la main.
