import { copyFile, mkdir, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(appDir, "..", "..");
const args = process.argv.slice(2);
const requestedMode =
  args[0] === "dev" || args[0] === "production" ? args.shift() : undefined;
const mode = requestedMode ?? "production";
const options = args;

if (mode !== "dev" && mode !== "production") {
  throw new Error(
    "Usage: bun run build:desktop [dev|production] [--installer] [-api:<url>]",
  );
}

let apiUrl;
let buildInstaller = false;
for (const option of options) {
  if (option === "--installer") {
    if (buildInstaller) throw new Error("L'option --installer est dupliquée.");
    buildInstaller = true;
    continue;
  }
  if (!option.startsWith("-api:")) {
    throw new Error(`Option inconnue : ${option}`);
  }
  if (apiUrl !== undefined) {
    throw new Error("L'option -api:<url> ne peut être indiquée qu'une fois.");
  }

  apiUrl = option.slice("-api:".length).trim();
}

if (apiUrl !== undefined) {
  let parsedUrl;
  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw new Error(`URL API invalide : ${apiUrl}`);
  }
  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(`URL API invalide : ${apiUrl}`);
  }
  apiUrl = apiUrl.replace(/\/+$/, "");
}

const env = { ...process.env };
if (mode === "dev") {
  env.VITE_API_URL = apiUrl ?? "http://localhost:3000";
} else if (apiUrl !== undefined) {
  env.VITE_API_URL = apiUrl;
}

console.log(
  `Build Teacher (${mode}${buildInstaller ? ", installer NSIS" : ""}) — API: ${
    env.VITE_API_URL ?? "apps/teacher/.env"
  }`,
);

const tauriArgs = ["run", "tauri", "build"];
tauriArgs.push(
  ...(buildInstaller ? ["--bundles", "nsis"] : ["--no-bundle"]),
  "--ci",
);
const build = spawnSync("bun", tauriArgs, {
  cwd: appDir,
  env,
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const sourcePath = resolve(
  repositoryRoot,
  "target",
  "release",
  "attendancy-teacher.exe",
);
const artifactName =
  mode === "dev" ? "Attendancy-Teacher-dev.exe" : "Attendancy-Teacher.exe";
const artifactPath = resolve(appDir, "artifacts", artifactName);

await mkdir(dirname(artifactPath), { recursive: true });
await copyFile(sourcePath, artifactPath);
console.log(`Finalized build artifact at ${artifactPath}`);

if (buildInstaller) {
  const bundleDir = resolve(
    repositoryRoot,
    "target",
    "release",
    "bundle",
    "nsis",
  );
  const installerCandidates = (await readdir(bundleDir)).filter(
    (name) =>
      /^Attendancy[_ ]Teacher.*-setup\.exe$/i.test(name) &&
      name.toLowerCase().endsWith("-setup.exe"),
  );
  if (installerCandidates.length !== 1) {
    throw new Error(
      `Expected one Teacher NSIS installer in ${bundleDir}, found ${installerCandidates.length}.`,
    );
  }

  const installerName =
    mode === "dev"
      ? "Attendancy-Teacher-dev-setup.exe"
      : "Attendancy-Teacher-setup.exe";
  const installerPath = resolve(appDir, "artifacts", installerName);
  await copyFile(resolve(bundleDir, installerCandidates[0]), installerPath);
  console.log(`Finalized installer at ${installerPath}`);
}
