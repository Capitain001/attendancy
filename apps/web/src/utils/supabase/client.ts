// src/utils/supabase/client.ts
// Client Supabase côté navigateur (composants "use client").
//
// Typage : une fois les tables du projet définies, générer les types DB
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// puis passer le générique : createBrowserClient<Database>(...)
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
