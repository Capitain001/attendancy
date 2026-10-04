import { spawnSync } from "node:child_process";

const [requestedMode, ...options] = process.argv.slice(2);
const mode =
  requestedMode?.startsWith("-api:") || !requestedMode
    ? "production"
    : requestedMode;

if (mode !== "dev" && mode !== "production") {
  throw new Error("Usage: bun run build:desktop [dev|production] [-api:<url>]");
}

let apiUrl;
for (const option of [
  requestedMode?.startsWith("-api:") ? requestedMode : null,
  ...options,
]) {
  if (option === null) continue;
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
  `Build desktop (${mode}) — API: ${env.VITE_API_URL ?? "Vite .env.production"}`,
);

const build = spawnSync("bun", ["run", "tauri", "build"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const artifactType = mode === "dev" ? "desktopDev" : "desktop";
const finalize = spawnSync(
  process.execPath,
  ["scripts/finalize-build-artifact.mjs", artifactType],
  { cwd: process.cwd(), env, stdio: "inherit" },
);
if (finalize.error) throw finalize.error;
process.exit(finalize.status ?? 1);
