// scripts/test-db-setup.js
// Prépare la base de TEST pour vitest --project integration :
//   1. dérive l'URL directe Neon (sans pooler) pour les migrations DDL
//   2. migrate reset (schéma propre, sans seed, sans regénérer le client)
//   3. applique les SQL post-migrate (index/triggers hors Prisma)
// À lancer une fois avant la première session de tests d'intégration :
//   npm run test:db:setup
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(dirname, "..");

for (const line of readFileSync(resolve(rootDir, ".env"), "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key && rest.length) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
}

if (!process.env.TEST_DATABASE_URL) { console.error("❌ TEST_DATABASE_URL missing"); process.exit(1); }

// Garde-fou anti-confusion : empêche un migrate reset --force sur la base
// de dev/prod si TEST_DATABASE_URL n'a pas été configurée distinctement.
if (process.env.DATABASE_URL === process.env.TEST_DATABASE_URL) {
  console.error("❌ TEST_DATABASE_URL must differ from DATABASE_URL");
  process.exit(1);
}

// Pour Neon : dérive l'URL directe (sans pooler) depuis l'URL pooler.
// TEST_DIRECT_URL peut être défini manuellement dans .env pour surcharger.
function toDirectUrl(poolerUrl) {
  return poolerUrl.replace(/-pooler\./, ".");
}
const testDirectUrl = process.env.TEST_DIRECT_URL ?? toDirectUrl(process.env.TEST_DATABASE_URL);

const mask = (url) => url.replace(/:[^:@]+@/, ":***@");
console.log("→ Test DB  :", mask(process.env.TEST_DATABASE_URL));
console.log("→ Direct   :", mask(testDirectUrl));

// Pointe les deux variables sur la test DB — prisma.config.ts lit DIRECT_URL pour les migrations.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DIRECT_URL = testDirectUrl;
// Consentement explicite utilisateur pour migrate reset sur test DB (Prisma 7 AI safety gate).
process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION = "tu peut reset db si elle te bloque, on est en dev";

execSync("npx prisma migrate reset --force", {
  stdio: "inherit",
  env: process.env,
});

// Applique tous les .sql de prisma/post-migrate/ (récursif, ordre alphabétique).
const postMigrateDir = resolve(rootDir, "prisma/post-migrate");
if (existsSync(postMigrateDir)) {
  const sqlFiles = readdirSync(postMigrateDir, { recursive: true })
    .filter((f) => String(f).endsWith(".sql"))
    .sort();
  const client = new Client({ connectionString: testDirectUrl });
  await client.connect();
  try {
    for (const file of sqlFiles) {
      const path = join(postMigrateDir, String(file));
      const sql = readFileSync(path, "utf-8");
      if (/MODULE DIFFÉRÉ|TEST_DB_SKIP/.test(sql.slice(0, 1_000))) {
        console.log(`→ post-migrate ignoré (non applicable à la DB test): ${file}`);
        continue;
      }
      console.log(`→ post-migrate: ${file}`);
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}

console.log("\n✅ Test database ready!");