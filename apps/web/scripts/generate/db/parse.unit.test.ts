import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  countDatabaseObjects,
  extractDatabaseObjectsFromSql,
  isSupabaseOnlySql,
  loadDatabaseObjectsFromSqlDirectory,
  mergeDatabaseObjects,
  stripSqlComments
} from './parse';
import { renderDatabaseObjectsModule } from './render';

describe('stripSqlComments', () => {
  it('retire les commentaires de ligne et de bloc', () => {
    expect(stripSqlComments('SELECT 1; -- fin\n/* bloc */SELECT 2;')).toBe('SELECT 1; \nSELECT 2;');
  });

  it("garde un -- situé dans un littéral", () => {
    expect(stripSqlComments("SELECT 'a -- b'; -- c")).toBe("SELECT 'a -- b'; ");
  });

  it("ignore une apostrophe située dans un commentaire", () => {
    const sql = "-- l'organisation ciblée\nCREATE INDEX idx_a ON t (c);";
    expect(stripSqlComments(sql)).toBe('\nCREATE INDEX idx_a ON t (c);');
  });
});

describe('extractDatabaseObjectsFromSql', () => {
  it('ignore les objets cités uniquement dans un commentaire', () => {
    const objects = extractDatabaseObjectsFromSql('-- CREATE INDEX fake_idx ON t (c);');
    expect(objects.indexes).toEqual([]);
  });

  it('extrait extensions, index et index uniques (quotés ou non)', () => {
    const objects = extractDatabaseObjectsFromSql(`
      CREATE EXTENSION IF NOT EXISTS btree_gist;
      CREATE INDEX IF NOT EXISTS schedule_during_gist_idx ON "public"."Schedule" USING GIST (during);
      CREATE UNIQUE INDEX IF NOT EXISTS "course_active_unique_idx" ON "public"."Course" ("classId") WHERE "deletedAt" IS NULL;
    `);
    expect(objects.extensions).toEqual(['btree_gist']);
    expect(objects.indexes).toEqual(['schedule_during_gist_idx', 'course_active_unique_idx']);
    expect(objects.uniqueIndexes).toEqual(['course_active_unique_idx']);
  });

  it('extrait les contraintes, y compris dans un bloc DO $$', () => {
    const objects = extractDatabaseObjectsFromSql(`
      ALTER TABLE "public"."Schedule" ADD CONSTRAINT no_room_overlap EXCLUDE USING gist (during WITH &&);
      ALTER TABLE "public"."Schedule" ADD CONSTRAINT "check_schedule_time_order" CHECK ("startTime" < "endTime");
      DO $$
      BEGIN
        ALTER TABLE public."Invitation" ADD CONSTRAINT invitation_resolved_consistency CHECK (true);
      END
      $$;
    `);
    expect(objects.constraints).toEqual([
      'no_room_overlap',
      'check_schedule_time_order',
      'invitation_resolved_consistency'
    ]);
  });

  it('extrait les fonctions qualifiées, nues et en minuscules, mais pas les DROP', () => {
    const objects = extractDatabaseObjectsFromSql(`
      CREATE OR REPLACE FUNCTION sync_schedule_during() RETURNS TRIGGER AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
      CREATE OR REPLACE FUNCTION "public"."fn_uecourse_insert_order"() RETURNS TRIGGER AS $function$ BEGIN RETURN NEW; END; $function$ LANGUAGE plpgsql;
      CREATE OR REPLACE FUNCTION "public".purge_deleted_notes() RETURNS integer LANGUAGE sql AS $$ SELECT 1 $$;
      drop function if exists public.get_auth_user_by_email(text);
      create function public.get_auth_user_by_email(user_email text) returns table (id uuid) language sql as $$ select 1 $$;
    `);
    expect(objects.functions).toEqual([
      'sync_schedule_during',
      'fn_uecourse_insert_order',
      'purge_deleted_notes',
      'get_auth_user_by_email'
    ]);
  });

  it('extrait les triggers et les vues, mais pas les DROP TRIGGER', () => {
    const objects = extractDatabaseObjectsFromSql(`
      DROP TRIGGER IF EXISTS "dropped_trigger" ON "public"."Schedule";
      CREATE TRIGGER trigger_sync_schedule_during BEFORE INSERT ON "public"."Schedule" FOR EACH ROW EXECUTE FUNCTION sync_schedule_during();
      CREATE TRIGGER "trg_chat_on_class_ins" AFTER INSERT ON "public"."Class" FOR EACH ROW EXECUTE FUNCTION "public"."trg_chat_on_class_ins"();
      CREATE OR REPLACE VIEW session_presence_map AS SELECT 1;
    `);
    expect(objects.triggers).toEqual(['trigger_sync_schedule_during', 'trg_chat_on_class_ins']);
    expect(objects.views).toEqual(['session_presence_map']);
  });

  it('extrait les colonnes dérivées', () => {
    const objects = extractDatabaseObjectsFromSql(`
      ALTER TABLE "public"."Schedule"
        ADD COLUMN IF NOT EXISTS "during" tstzrange;
      ALTER TABLE "public"."Location"
        ADD COLUMN IF NOT EXISTS position geography(Point, 4326);
    `);
    expect(objects.derivedColumns).toEqual([
      { table: 'Schedule', column: 'during' },
      { table: 'Location', column: 'position' }
    ]);
  });

  it('extrait buckets et policies storage écrits en minuscules', () => {
    const objects = extractDatabaseObjectsFromSql(`
      insert into storage.buckets (id, name, public)
      values ('avatars', 'avatars', true)
      on conflict (id) do nothing;
      drop policy if exists "avatars_public_read" on storage.objects;
      create policy "avatars_public_read"
      on storage.objects for select
      to public
      using (bucket_id = 'avatars');
    `);
    expect(objects.buckets).toEqual(['avatars']);
    expect(objects.policies).toEqual(['avatars_public_read']);
  });

  it("extrait les messages RAISE EXCEPTION en dédoublant les apostrophes", () => {
    const objects = extractDatabaseObjectsFromSql(`
      RAISE EXCEPTION 'Le groupe doit appartenir a la meme classe que l''enrollment';
      RAISE EXCEPTION 'Impossible de modifier un schedule avec le status %', OLD.status; -- note
    `);
    expect(objects.exceptionMessages).toEqual([
      "Le groupe doit appartenir a la meme classe que l'enrollment",
      'Impossible de modifier un schedule avec le status %'
    ]);
  });

  it('extrait les jobs pg_cron', () => {
    const objects = extractDatabaseObjectsFromSql(`
      SELECT cron.schedule(
        'purge-deleted-notes',
        '0 3 * * 0',
        $$SELECT "public".purge_deleted_notes()$$
      );
    `);
    expect(objects.cronJobs).toEqual(['purge-deleted-notes']);
  });
});

describe('mergeDatabaseObjects', () => {
  it('fusionne, dédoublonne et trie', () => {
    const first = extractDatabaseObjectsFromSql('CREATE INDEX b_idx ON t (c); CREATE INDEX a_idx ON t (c);');
    const second = extractDatabaseObjectsFromSql('CREATE INDEX a_idx ON t (c);');
    expect(mergeDatabaseObjects([first, second]).indexes).toEqual(['a_idx', 'b_idx']);
  });

  it('dédoublonne et trie les colonnes dérivées', () => {
    const first = extractDatabaseObjectsFromSql('ALTER TABLE "public"."Session" ADD COLUMN position geography;');
    const second = extractDatabaseObjectsFromSql(
      'ALTER TABLE "public"."Location" ADD COLUMN position geography; ALTER TABLE "public"."Session" ADD COLUMN position geography;'
    );
    expect(mergeDatabaseObjects([first, second]).derivedColumns).toEqual([
      { table: 'Location', column: 'position' },
      { table: 'Session', column: 'position' }
    ]);
  });

  it('un fichier vide (SELECT 1) ne produit aucun objet', () => {
    expect(countDatabaseObjects(extractDatabaseObjectsFromSql('SELECT 1; -- no-op'))).toBe(0);
  });
});

describe('isSupabaseOnlySql', () => {
  it("détecte le marqueur dans l'en-tête", () => {
    expect(isSupabaseOnlySql('-- TEST_DB_SKIP: dépend du schéma auth\nSELECT 1;')).toBe(true);
    expect(isSupabaseOnlySql('SELECT 1;')).toBe(false);
  });
});

describe('loadDatabaseObjectsFromSqlDirectory', () => {
  let temporaryDirectory = '';

  afterEach(() => {
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('lit récursivement, sépare les fichiers TEST_DB_SKIP et ignore les non-.sql', () => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'post-migrate-'));
    mkdirSync(path.join(temporaryDirectory, 'storage'));
    mkdirSync(path.join(temporaryDirectory, 'rpc'));
    writeFileSync(path.join(temporaryDirectory, '00_extensions.sql'), 'CREATE EXTENSION IF NOT EXISTS postgis;');
    writeFileSync(path.join(temporaryDirectory, '20_profile.sql'), 'SELECT 1; -- no-op');
    writeFileSync(path.join(temporaryDirectory, 'README.md'), 'CREATE INDEX ignored_idx ON t (c);');
    writeFileSync(
      path.join(temporaryDirectory, 'storage', 'avatar.sql'),
      "-- TEST_DB_SKIP\ninsert into storage.buckets (id, name) values ('avatars', 'avatars');"
    );
    writeFileSync(
      path.join(temporaryDirectory, 'rpc', 'auth.sql'),
      '-- TEST_DB_SKIP\ncreate function public.get_auth_user_by_email(user_email text) returns uuid language sql as $$ select 1 $$;'
    );

    const loaded = loadDatabaseObjectsFromSqlDirectory(temporaryDirectory);

    expect(loaded.databaseObjects.extensions).toEqual(['postgis']);
    expect(loaded.databaseObjects.indexes).toEqual([]);
    expect(loaded.databaseObjects.buckets).toEqual([]);
    expect(loaded.supabaseObjects.buckets).toEqual(['avatars']);
    expect(loaded.supabaseObjects.functions).toEqual(['get_auth_user_by_email']);
  });
});

describe('renderDatabaseObjectsModule', () => {
  it('exporte DATABASE_OBJECTS et SUPABASE_OBJECTS en as const', () => {
    const loaded = {
      databaseObjects: extractDatabaseObjectsFromSql('CREATE INDEX a_idx ON t (c);'),
      supabaseObjects: extractDatabaseObjectsFromSql("insert into storage.buckets (id) values ('logos');")
    };
    const rendered = renderDatabaseObjectsModule(loaded);
    expect(rendered).toContain('export const DATABASE_OBJECTS = {');
    expect(rendered).toContain('export const SUPABASE_OBJECTS = {');
    expect(rendered).toContain('} as const;');
    expect(rendered).toContain('"a_idx"');
    expect(rendered).toContain('"logos"');
    expect(rendered.endsWith('\n')).toBe(true);
  });
});
