import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

function readArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing required argument: ${name} <value>`);
  }
  return value;
}

const inputPath = resolve(readArgument("--input"));
const outputPath = resolve(readArgument("--output"));
const applicationId = readArgument("--application-id");
const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;

if (!androidHome) {
  throw new Error("Set ANDROID_HOME or ANDROID_SDK_ROOT before signing APKs.");
}
if (!existsSync(inputPath)) {
  throw new Error(`Unsigned APK not found: ${inputPath}`);
}
if (inputPath === outputPath) {
  throw new Error("Input and output APK paths must be different.");
}

const buildToolsRoot = join(androidHome, "build-tools");
const buildToolDirectories = await readdir(buildToolsRoot, {
  withFileTypes: true,
});
const versions = buildToolDirectories
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
    join(buildToolsRoot, version, "lib", "apksigner.jar"),
  )
  .find((candidate) => existsSync(candidate));
const aaptExecutable = process.platform === "win32" ? "aapt.exe" : "aapt";
const aapt = versions
  .map((version) => join(buildToolsRoot, version, aaptExecutable))
  .find((candidate) => existsSync(candidate));

if (!signerJar || !aapt) {
  throw new Error(
    `Could not find apksigner.jar and aapt.exe under ${buildToolsRoot}.`,
  );
}

const badging = execFileSync(aapt, ["dump", "badging", inputPath], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const packageName = badging.match(/^package: name='([^']+)'/m)?.[1];

if (packageName !== applicationId) {
  throw new Error(
    `Expected APK applicationId "${applicationId}", got "${packageName ?? "unknown"}".`,
  );
}

const keystorePath = join(
  process.env.USERPROFILE ?? homedir(),
  ".android",
  "debug.keystore",
);

if (!existsSync(keystorePath)) {
  throw new Error(`Android debug keystore not found: ${keystorePath}`);
}

await mkdir(dirname(outputPath), { recursive: true });

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
    outputPath,
    inputPath,
  ],
  { stdio: "inherit" },
);
execFileSync(
  "java",
  ["-jar", signerJar, "verify", "--verbose", outputPath],
  { stdio: "inherit" },
);

console.log(`Signed and verified APK at ${outputPath}`);
