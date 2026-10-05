import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const mainConfig = JSON.parse(
  readFileSync(join(appDir, "src-tauri/tauri.conf.json"), "utf8"),
);
const webviewConfig = JSON.parse(
  readFileSync(join(appDir, "src-tauri/webview/tauri.conf.json"), "utf8"),
);
const gradleFile = join(appDir, "src-tauri/gen/android/app/build.gradle.kts");
const webviewPackageDir = join(
  appDir,
  "src-tauri/gen/android/app/src/main/java",
  ...webviewConfig.identifier.split("."),
);

if (mainConfig.identifier === webviewConfig.identifier) {
  throw new Error(
    "The Android app identifiers for the two builds must differ.",
  );
}
if (!existsSync(gradleFile)) {
  throw new Error(
    "Android project is not initialized. Run `tauri android init` first.",
  );
}

const originalGradle = readFileSync(gradleFile, "utf8");
const applicationIdPattern = /^(\s*applicationId\s*=\s*)"([^"]+)"/m;
const applicationIdMatch = originalGradle.match(applicationIdPattern);

if (!applicationIdMatch || applicationIdMatch[2] !== mainConfig.identifier) {
  throw new Error(
    `Expected generated Android applicationId "${mainConfig.identifier}" in ${gradleFile}.`,
  );
}

const packageDirExisted = existsSync(webviewPackageDir);

try {
  writeFileSync(
    gradleFile,
    originalGradle.replace(
      applicationIdPattern,
      `$1"${webviewConfig.identifier}"`,
    ),
  );
  mkdirSync(webviewPackageDir, { recursive: true });

  execFileSync(
    "bun",
    [
      "x",
      "tauri",
      "android",
      "build",
      "--apk",
      "--target",
      "aarch64",
      "--config",
      "src-tauri/webview/tauri.conf.json",
    ],
    { cwd: appDir, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    ["scripts/finalize-build-artifact.mjs", "webview"],
    { cwd: appDir, stdio: "inherit" },
  );
} finally {
  writeFileSync(gradleFile, originalGradle);

  if (
    !packageDirExisted &&
    existsSync(webviewPackageDir) &&
    readdirSync(webviewPackageDir).length === 0
  ) {
    rmdirSync(webviewPackageDir);
  }
}
