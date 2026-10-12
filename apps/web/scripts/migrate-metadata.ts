// scripts/migrate-metadata.ts
// Migre les données de user_metadata → app_metadata (service role, idempotent)
//
// Usage :
//   bun scripts/migrate-metadata.ts            # copie user_metadata → app_metadata (sans écraser)
//   bun scripts/migrate-metadata.ts --purge    # efface les clés migrées de user_metadata

import { createClient } from "@supabase/supabase-js";

const USER_METADATA_KEYS = [
  "role", "name", "avatar_url", "phone", "function",
  "organization", "organizations", "invited_by", "status",
  "invitationToken", "invitationType", "isConnected",
] as const;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const purge = process.argv.includes("--purge");
console.log(`Mode : ${purge ? "PURGE user_metadata" : "COPIE vers app_metadata"}`);

let page = 1, totalProcessed = 0, totalSkipped = 0, totalErrors = 0;

for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("Erreur listUsers:", error.message); process.exit(1); }
  if (!data.users.length) break;

  for (const user of data.users) {
    const from = (user.user_metadata ?? {}) as Record<string, unknown>;
    const keys = USER_METADATA_KEYS.filter((k) => k in from);
    if (!keys.length) { totalSkipped++; continue; }

    if (purge) {
      const nullPatch = Object.fromEntries(keys.map((k) => [k, null]));
      const { error: e } = await admin.auth.admin.updateUserById(user.id, { user_metadata: nullPatch });
      if (e) { console.error(`[PURGE] ${user.id}:`, e.message); totalErrors++; }
      else { console.log(`[PURGE] ${user.id}: ${keys.join(", ")}`); totalProcessed++; }
    } else {
      const existing = (user.app_metadata ?? {}) as Record<string, unknown>;
      const toCopy = keys.filter((k) => !(k in existing));
      if (!toCopy.length) { totalSkipped++; continue; }
      const patch = Object.fromEntries(toCopy.map((k) => [k, from[k]]));
      const { error: e } = await admin.auth.admin.updateUserById(user.id, { app_metadata: patch });
      if (e) { console.error(`[COPY] ${user.id}:`, e.message); totalErrors++; }
      else { console.log(`[COPY] ${user.id}: ${toCopy.join(", ")}`); totalProcessed++; }
    }
  }
  page++;
}

console.log(`\nRésumé :\n  Traités : ${totalProcessed}\n  Ignorés : ${totalSkipped}\n  Erreurs : ${totalErrors}`);
