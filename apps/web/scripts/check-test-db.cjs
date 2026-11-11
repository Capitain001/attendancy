// scripts/check-test-db.cjs
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { Client } = require("pg");

const envPath = resolve(__dirname, "..", ".env");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const separator = trimmed.indexOf("=");
  if (separator < 1) continue;

  const key = trimmed.slice(0, separator).trim();
  const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
  if (process.env[key] === undefined) process.env[key] = value;
}

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error("TEST_DATABASE_URL est absente de apps/web/.env.");
  process.exit(1);
}

if (testUrl === process.env.DATABASE_URL) {
  console.error("Refus du test : TEST_DATABASE_URL est identique à DATABASE_URL.");
  process.exit(1);
}

const endpoints = [
  ["pooler", testUrl],
  ["direct", process.env.TEST_DIRECT_URL ?? testUrl.replace(/-pooler\./, ".")],
];

let failed = false;

(async () => {
  for (const [label, connectionString] of endpoints) {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 15_000,
      query_timeout: 15_000,
    });

    try {
      await client.connect();
      const result = await client.query("SELECT 1 AS ok, current_database() AS database");
      console.log(`OK ${label}: connexion réussie à la base "${result.rows[0].database}".`);
    } catch (error) {
      failed = true;
      console.error(`ÉCHEC ${label}: ${error.code ?? "ERREUR"} — ${error.message}`);
    } finally {
      await client.end().catch(() => {});
    }
  }

  process.exitCode = failed ? 1 : 0;
})();
