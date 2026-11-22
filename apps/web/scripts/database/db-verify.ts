// scripts/database/db-verify.ts
import { PrismaClient } from '@/generated/prisma/client';
import { DATABASE_OBJECTS as expected, SUPABASE_OBJECTS as expectedSupabase } from '@/generated/db-objects';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function logSection(title: string) {
  console.log(`\n\x1b[36m=== ${title} ===\x1b[0m`);
}

function checkMissing(name: string, expected: readonly string[], actual: readonly string[]) {
  const missing = expected.filter(e => !actual.includes(e));
  if (missing.length === 0) {
    console.log(`\x1b[32m[V] ${name}: ${expected.length}/${expected.length} OK\x1b[0m`);
  } else {
    console.log(`\x1b[31m[X] ${name}: ${expected.length - missing.length}/${expected.length} trouvés\x1b[0m`);
    missing.forEach(m => console.log(`    \x1b[31m-> Manquant: ${m}\x1b[0m`));
  }
}

// DATABASE_OBJECTS.<CATEGORIE> est un objet { CLE: 'nom_sql' } : seules les valeurs sont comparées à la base.
const namesOf = (keyedNames: Record<string, string>): string[] => Object.values(keyedNames);

function isDoesNotExistError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('does not exist');
}

async function verify() {
  console.log("Démarrage du diagnostic post-migrate...");

  try {
    // 1. Extensions
    logSection("Extensions");
    const exts = await prisma.$queryRaw<{ extname: string }[]>`SELECT extname FROM pg_extension`;
    checkMissing('Extensions', namesOf(expected.EXTENSIONS), exts.map(e => e.extname));

    // 2. Colonnes
    logSection("Colonnes dérivées");
    const cols = await prisma.$queryRaw<{ table_name: string, column_name: string }[]>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'`;
    const colKeys = cols.map(c => `${c.table_name}.${c.column_name}`);
    const expectedColKeys = expected.DERIVED_COLUMNS.map(c => `${c.table}.${c.column}`);
    checkMissing('Colonnes dérivées', expectedColKeys, colKeys);

    // 3. Index manuels
    logSection("Index manuels");
    const idxs = await prisma.$queryRaw<{ indexname: string }[]>`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
    checkMissing('Index', namesOf(expected.INDEXES), idxs.map(i => i.indexname));

    // 4. Contraintes
    logSection("Contraintes (CHECK/EXCLUDE)");
    const constraints = await prisma.$queryRaw<{ conname: string }[]>`SELECT conname FROM pg_constraint`;
    checkMissing('Contraintes', namesOf(expected.CONSTRAINTS), constraints.map(c => c.conname));

    // 5. Fonctions
    logSection("Fonctions / Procédures");
    const funcs = await prisma.$queryRaw<{ routine_name: string }[]>`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'`;
    checkMissing('Fonctions', namesOf(expected.FUNCTIONS), funcs.map(f => f.routine_name));

    // 6. Triggers
    logSection("Triggers");
    const triggers = await prisma.$queryRaw<{ trigger_name: string }[]>`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'`;
    checkMissing('Triggers', namesOf(expected.TRIGGERS), triggers.map(t => t.trigger_name));

    // 7. Vues
    logSection("Vues");
    const views = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'`;
    checkMissing('Vues', namesOf(expected.VIEWS), views.map(v => v.table_name));

    // 8. Jobs pg_cron
    if (Object.keys(expected.CRON_JOBS).length > 0) {
      logSection("Jobs pg_cron");
      try {
        const cronJobs = await prisma.$queryRaw<{ jobname: string }[]>`SELECT jobname FROM cron.job`;
        checkMissing('Jobs cron', namesOf(expected.CRON_JOBS), cronJobs.map(j => j.jobname));
      } catch (e) {
        if (isDoesNotExistError(e)) {
          console.log(`\x1b[33m[!] Schéma 'cron' non trouvé. L'extension pg_cron est-elle activée ?\x1b[0m`);
        } else throw e;
      }
    }

    // 9. Objets Supabase (fichiers TEST_DB_SKIP : schémas auth + storage)
    logSection("Supabase - Fonctions, Buckets, Policies");
    const supabaseSchemas = await prisma.$queryRaw<{ schema_name: string }[]>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('auth', 'storage')`;

    if (supabaseSchemas.length === 2) {
      checkMissing('Fonctions Supabase', namesOf(expectedSupabase.FUNCTIONS), funcs.map(f => f.routine_name));

      const buckets = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM storage.buckets`;
      checkMissing('Buckets', namesOf(expectedSupabase.BUCKETS), buckets.map(b => b.id));

      const policies = await prisma.$queryRaw<{ policyname: string }[]>`
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'`;
      checkMissing('Policies', namesOf(expectedSupabase.POLICIES), policies.map(p => p.policyname));
    } else {
      console.log(`\x1b[33m[!] Schémas auth/storage absents : vérification Supabase ignorée (base isolée ?).\x1b[0m`);
    }

    // Bonus: Doublons
    logSection("Vérification des doublons physiques");
    const duplicates = await prisma.$queryRaw<{ tablename: string, indexdef: string, count: bigint }[]>`
      SELECT tablename, regexp_replace(indexdef, '^CREATE (UNIQUE )?INDEX \\S+ ', '') as indexdef, COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      GROUP BY tablename, regexp_replace(indexdef, '^CREATE (UNIQUE )?INDEX \\S+ ', '')
      HAVING COUNT(*) > 1
    `;
    if (duplicates.length === 0) {
      console.log(`\x1b[32m[V] Aucun doublon d'index détecté.\x1b[0m`);
    } else {
      console.log(`\x1b[31m[X] Doublons d'index détectés:\x1b[0m`);
      console.table(duplicates);
    }

  } catch (error) {
    console.error("Erreur inattendue lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\nFin du diagnostic.");
  }
}

verify().catch(console.error);
