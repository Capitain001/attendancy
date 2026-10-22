# APK Android — applications Tauri

Les apps Teacher et Desktop embarquent chacune leur frontend et ont un shell
Tauri distinct. `apps/desktop` sert aussi de client de test. La variante
WebView, elle, charge le site hébergé et n'est pas l'app Teacher.

Chaque shell possède sa configuration sous `apps/<app>/src-tauri`. Les projets
Android sous `src-tauri/gen/android/` sont générés localement par Tauri et ne
sont pas versionnés. Le workspace Cargo et son `target/` partagé sont à la
racine du monorepo.

---

## Prérequis (cette machine)

```powershell
$env:ANDROID_HOME = 'D:\ANDROID'
$env:NDK_HOME     = 'D:\ANDROID\ndk\27.3.13750724'
$env:JAVA_HOME    = 'C:\Program Files\Java\jdk-21'
```

- Targets Rust : `rustup target add aarch64-linux-android` (+ autres ABI si
  build universel)
- Vérifier la chaîne Tauri : `bun run tauri info` depuis le dossier de l'app
- Le mode développeur Windows peut être requis par la génération Tauri des
  symlinks Android : Paramètres > Système > Pour les développeurs

## Build + signature APK Teacher arm64

Le premier lancement ou la suppression de `gen/android` nécessite une nouvelle
initialisation. La configuration Android Teacher est régénérable depuis
`apps/teacher/src-tauri` :

```powershell
cd apps/teacher
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run tauri:icons
bun run tauri:android:init
```

Puis construire l'APK natif qui embarque le frontend Vite Teacher et le signer
avec le keystore debug local :

```powershell
cd apps/teacher
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run build:android
```

L'identifiant Android est `io.attendancy.teacher`. L'APK signé et vérifié est
copié dans `apps/teacher/artifacts/Attendancy-Teacher-arm64-debug-signed.apk`.
Il peut être installé en parallèle des variantes Desktop et WebView.
Le build utilise les variables `VITE_API_URL`, `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY` définies dans l'environnement local ou CI ; ne pas
commiter les fichiers `.env`.

## Build + signature APK Desktop arm64

Cette commande construit le frontend local de `apps/desktop` (client de test),
pas le frontend Teacher :

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

## APK conteneur WebView (site hébergé)

La variante WebView est un conteneur séparé qui charge le site hébergé. Elle
utilise `src-tauri/webview/tauri.conf.json` :

```powershell
cd apps/desktop
$env:ANDROID_HOME='D:\ANDROID'; $env:NDK_HOME='D:\ANDROID\ndk\27.3.13750724'; $env:JAVA_HOME='C:\Program Files\Java\jdk-21'
bun run build:android:webview
```

L'APK est signé et vérifié, puis copié dans :
`apps/desktop/artifacts/Attendancy-WebView-arm64-debug-signed.apk`.

Les APK Teacher, Desktop et WebView ont des identifiants distincts
(`io.attendancy.teacher`, `io.attendancy.app`, `io.attendancy.webview`). Ils
utilisent le keystore debug local
(`%USERPROFILE%\.android\debug.keystore`, mot de passe Android par défaut
`android`) et sont destinés aux tests locaux. Pour une distribution, configurer
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
- `gen/android` n'est pas commité : recréer le projet avec `tauri android init`
  après un clone ou sa suppression. Les icônes Tauri teacher sont également
  régénérables avec `bun run tauri:icons`. Les `.so` natifs sont produits par
  Cargo ; ne pas les copier manuellement.
