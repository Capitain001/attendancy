// scripts/test-db-setup.js
// Prépare la base de TEST pour vitest --project integration :
//   1. valide que TEST_DATABASE_URL existe ET diffère de DATABASE_URL
//   2. migrate reset (schéma propre, sans seed)
//   3. applique les SQL post-migrate (index/triggers hors Prisma)
// À lancer une fois avant la première session de tests d'intégration :
//   npm run test:db:setup
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(dirname, "..");

for (const line of readFileSync(resolve(rootDir, ".env"), "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key && rest.length) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
}

if (!process.env.TEST_DATABASE_URL) { console.error("❌ TEST_DATABASE_URL missing"); process.exit(1); }
if (process.env.DATABASE_URL === process.env.TEST_DATABASE_URL) {
  console.error("❌ TEST_DATABASE_URL must differ from DATABASE_URL");
  process.exit(1);
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
  stdio: "inherit",
  env: process.env,
});

// Applique tous les .sql de prisma/post-migrate/ (récursif, ordre alphabétique).
const postMigrateDir = resolve(rootDir, "prisma/post-migrate");
if (existsSync(postMigrateDir)) {
  const sqlFiles = readdirSync(postMigrateDir, { recursive: true })
    .filter((f) => String(f).endsWith(".sql"))
    .sort();
  for (const file of sqlFiles) {
    const path = join(postMigrateDir, String(file));
    console.log(`→ post-migrate: ${file}`);
    execSync(
      `npx prisma db execute --url "${process.env.TEST_DATABASE_URL}" --file "${path}"`,
      { stdio: "inherit", env: process.env }
    );
  }
}

console.log("\n✅ Test database ready!");
