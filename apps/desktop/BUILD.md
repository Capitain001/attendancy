# Desktop and Android builds

Run these commands from `apps/desktop`:

```sh
bun run build:android
bun run build:android:webview
bun run build:desktop
bun run build:desktop dev
```

- `build:android` packages the locally bundled Attendancy frontend as an Android arm64 APK.
- `build:android:webview` uses `src-tauri/webview/tauri.conf.json` to package the hosted Attendancy site as an Android arm64 WebView container.
- `build:desktop` packages the locally bundled frontend as a Windows x64 NSIS installer.
- `build:desktop dev` creates a separate test installer targeting `http://localhost:3000` by default; pass `-api:<url>` to override the API URL.
- Both Android commands sign the resulting APK with the local Android debug keystore and verify the APK signature.

Artifacts are copied to `artifacts/` so a later Vite build does not remove them:

- `Attendancy-Standalone-arm64-debug-signed.apk`
- `Attendancy-WebView-arm64-debug-signed.apk`
- `Attendancy_0.1.0_x64-setup.exe`
- `Attendancy_0.1.0_x64-setup-dev.exe`

The desktop and WebView APKs use distinct Android application IDs (`io.attendancy.app` and `io.attendancy.webview`). The teacher APK is built from `apps/teacher` and uses `io.attendancy.teacher`; all three can be installed side by side. The debug signature is for local testing only; use a dedicated release keystore to distribute the APKs.
