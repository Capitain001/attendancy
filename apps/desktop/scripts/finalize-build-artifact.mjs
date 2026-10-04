import { copyFile, mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const artifacts = {
  android: {
    source:
      "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk",
    destination: "artifacts/Attendancy-Standalone-arm64-debug-signed.apk",
    sign: true,
  },
  webview: {
    source:
      "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk",
    destination: "artifacts/Attendancy-WebView-arm64-debug-signed.apk",
    sign: true,
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

if (artifact.sign) {
  const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (!androidHome) {
    throw new Error(
      "Set ANDROID_HOME or ANDROID_SDK_ROOT before signing Android APKs.",
    );
  }

  const buildTools = await readdir(join(androidHome, "build-tools"), {
    withFileTypes: true,
  });
  const versions = buildTools
    .filter((entry) => entry.isDirectory() && /^\d+(\.\d+)*$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) =>
      right.localeCompare(left, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  const signerJar = versions
    .map((version) =>
      join(androidHome, "build-tools", version, "lib", "apksigner.jar"),
    )
    .find((candidate) => existsSync(candidate));

  if (!signerJar) {
    throw new Error(
      `Could not find apksigner.jar under ${join(androidHome, "build-tools")}.`,
    );
  }

  const keystorePath = join(
    process.env.USERPROFILE ?? homedir(),
    ".android",
    "debug.keystore",
  );
  execFileSync(
    "java",
    [
      "-jar",
      signerJar,
      "sign",
      "--ks",
      keystorePath,
      "--ks-pass",
      "pass:android",
      "--out",
      destinationPath,
      sourcePath,
    ],
    { stdio: "inherit" },
  );
  execFileSync(
    "java",
    ["-jar", signerJar, "verify", "--verbose", destinationPath],
    {
      stdio: "inherit",
    },
  );
} else {
  await copyFile(sourcePath, destinationPath);
}

console.log(`Finalized build artifact at ${destinationPath}`);
