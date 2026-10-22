import { copyFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sharedAndroidSigner = resolve(
  scriptDir,
  "../../../tools/tauri/sign-android-apk.mjs",
);
const artifacts = {
  android: {
    source:
      "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk",
    destination: "artifacts/Attendancy-Standalone-arm64-debug-signed.apk",
    applicationId: "io.attendancy.app",
  },
  webview: {
    source:
      "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk",
    destination: "artifacts/Attendancy-WebView-arm64-debug-signed.apk",
    applicationId: "io.attendancy.webview",
  },
  desktop: {
    source:
      "src-tauri/target/release/bundle/nsis/Attendancy_0.1.0_x64-setup.exe",
    destination: "artifacts/Attendancy_0.1.0_x64-setup.exe",
  },
  desktopDev: {
    source:
      "src-tauri/target/release/bundle/nsis/Attendancy_0.1.0_x64-setup.exe",
    destination: "artifacts/Attendancy_0.1.0_x64-setup-dev.exe",
  },
};

const artifact = artifacts[process.argv[2]];
if (!artifact) {
  throw new Error(
    "Usage: node scripts/finalize-build-artifact.mjs <android|webview|desktop|desktopDev>",
  );
}

const sourcePath = resolve(artifact.source);
const destinationPath = resolve(artifact.destination);

await mkdir(dirname(destinationPath), { recursive: true });

if (artifact.applicationId) {
  execFileSync(
    process.execPath,
    [
      sharedAndroidSigner,
      "--input",
      sourcePath,
      "--output",
      destinationPath,
      "--application-id",
      artifact.applicationId,
    ],
    { stdio: "inherit" },
  );
} else {
  await copyFile(sourcePath, destinationPath);
}

console.log(`Finalized build artifact at ${destinationPath}`);
