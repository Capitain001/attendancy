import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EXPECTED_EXTENSIONS = ['btree_gist', 'postgis'];

const EXPECTED_DERIVED_COLUMNS = [
  { table: 'Schedule', column: 'during' },
  { table: 'Location', column: 'position' },
  { table: 'Session', column: 'position' }
];

const EXPECTED_INDEXES = [
  'permission_user_scope_unique_idx',
  'permission_function_scope_unique_idx',
  'course_active_unique_idx',
  'schedule_during_gist_idx',
  'location_position_idx',
  'session_position_idx'
];

const EXPECTED_CONSTRAINTS = [
  'check_schedule_time_order',
  'no_room_overlap',
  'no_teacher_overlap',
  'no_class_overlap_global',
  'no_group_overlap'
];

const EXPECTED_FUNCTIONS = [
  'validate_student_class_group',
  'sync_schedule_during',
  'sync_location_position',
  'prevent_locked_schedule_update',
  'verify_point_in_radius',
  'teacher_check_in',
  'create_session_token',
  'validate_session_token',
  'chat_get_org_channel_id',
  'chat_get_class_channel_id',
  'chat_get_group_channel_id',
  'trg_chat_on_user_organization_ins',
  'trg_chat_on_class_ins',
  'trg_chat_on_group_ins',
  'trg_chat_on_student_enrollment_ins',
  'trg_chat_on_student_group_ins',
  'get_auth_user_by_email'
];

const EXPECTED_TRIGGERS = [
  'validate_student_class_group',
  'trigger_sync_schedule_during',
  'trg_sync_location_position',
  'trigger_prevent_locked_schedule_update',
  'trg_chat_on_user_organization_ins',
  'trg_chat_on_class_ins',
  'trg_chat_on_group_ins',
  'trg_chat_on_student_enrollment_ins',
  'trg_chat_on_student_group_ins'
];

const EXPECTED_VIEWS = ['session_presence_map'];

const EXPECTED_BUCKETS = ['avatars', 'logos'];

const EXPECTED_POLICIES = [
  'avatars_public_read', 'avatars_owner_insert', 'avatars_owner_update', 'avatars_owner_delete',
  'logos_public_read', 'logos_responsable_insert', 'logos_responsable_update', 'logos_responsable_delete'
];

function logSection(title: string) {
  console.log(`\n\x1b[36m=== ${title} ===\x1b[0m`);
}

function checkMissing(name: string, expected: string[], actual: string[]) {
  const missing = expected.filter(e => !actual.includes(e));
  if (missing.length === 0) {
    console.log(`\x1b[32m[V] ${name}: ${expected.length}/${expected.length} OK\x1b[0m`);
  } else {
    console.log(`\x1b[31m[X] ${name}: ${expected.length - missing.length}/${expected.length} trouvés\x1b[0m`);
    missing.forEach(m => console.log(`    \x1b[31m-> Manquant: ${m}\x1b[0m`));
  }
}

async function verify() {
  console.log("Démarrage du diagnostic post-migrate...");

  try {
    // 1. Extensions
    logSection("Extensions");
    const exts = await prisma.$queryRaw<{ extname: string }[]>`SELECT extname FROM pg_extension`;
    checkMissing('Extensions', EXPECTED_EXTENSIONS, exts.map(e => e.extname));

    // 2. Colonnes
    logSection("Colonnes dérivées");
    const cols = await prisma.$queryRaw<{ table_name: string, column_name: string }[]>`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'`;
    const colKeys = cols.map(c => `${c.table_name}.${c.column_name}`);
    const expectedColKeys = EXPECTED_DERIVED_COLUMNS.map(c => `${c.table}.${c.column}`);
    checkMissing('Colonnes dérivées', expectedColKeys, colKeys);

    // 3. Index manuels
    logSection("Index manuels");
    const idxs = await prisma.$queryRaw<{ indexname: string }[]>`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
    checkMissing('Index', EXPECTED_INDEXES, idxs.map(i => i.indexname));

    // 4. Contraintes
    logSection("Contraintes (CHECK/EXCLUDE)");
    const constraints = await prisma.$queryRaw<{ conname: string }[]>`SELECT conname FROM pg_constraint`;
    checkMissing('Contraintes', EXPECTED_CONSTRAINTS, constraints.map(c => c.conname));

    // 5. Fonctions
    logSection("Fonctions / Procédures");
    const funcs = await prisma.$queryRaw<{ routine_name: string }[]>`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'`;
    checkMissing('Fonctions', EXPECTED_FUNCTIONS, funcs.map(f => f.routine_name));

    // 6. Triggers
    logSection("Triggers");
    const triggers = await prisma.$queryRaw<{ trigger_name: string }[]>`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'`;
    checkMissing('Triggers', EXPECTED_TRIGGERS, triggers.map(t => t.trigger_name));

    // 7. Vues
    logSection("Vues");
    const views = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'`;
    checkMissing('Vues', EXPECTED_VIEWS, views.map(v => v.table_name));

    // 8. Storage Buckets
    logSection("Supabase Storage - Buckets");
    try {
      const buckets = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM storage.buckets`;
      checkMissing('Buckets', EXPECTED_BUCKETS, buckets.map(b => b.id));
    } catch (e: any) {
      if (e.message.includes('does not exist')) {
        console.log(`\x1b[33m[!] Schéma 'storage' non trouvé. Supabase Storage est-il configuré en local ?\x1b[0m`);
      } else throw e;
    }

    // 9. Storage Policies
    logSection("Supabase Storage - Policies");
    try {
      const policies = await prisma.$queryRaw<{ policyname: string }[]>`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'`;
      checkMissing('Policies', EXPECTED_POLICIES, policies.map(p => p.policyname));
    } catch (e: any) {
       if (e.message.includes('does not exist')) {
         // ignoré si storage n'existe pas
       } else throw e;
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
