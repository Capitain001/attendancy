// scripts/generate/db/render.test.ts
import { describe, expect, it } from 'vitest';
import { extractDatabaseObjectsFromSql } from './parse';
import { renderDatabaseObjectsModule, toConstantCase, toKeyedNames } from './render';

describe('toConstantCase', () => {
  it('convertit un nom SQL en clé de constante', () => {
    expect(toConstantCase('no_room_overlap')).toBe('NO_ROOM_OVERLAP');
    expect(toConstantCase('purge-deleted-notes')).toBe('PURGE_DELETED_NOTES');
    expect(toConstantCase('_private_idx')).toBe('PRIVATE_IDX');
    expect(toConstantCase('uniqueIndexes')).toBe('UNIQUE_INDEXES');
    expect(toConstantCase('cronJobs')).toBe('CRON_JOBS');
  });
});

describe('toKeyedNames', () => {
  it('associe chaque nom à sa clé', () => {
    expect(toKeyedNames(['a_idx', 'b_idx'])).toEqual({ A_IDX: 'a_idx', B_IDX: 'b_idx' });
  });

  it('refuse deux noms différents qui donnent la même clé', () => {
    expect(() => toKeyedNames(['foo_bar', 'foo-bar'])).toThrow(/Collision/);
  });
});

describe('renderDatabaseObjectsModule', () => {
  it('émet DATABASE_OBJECTS et SUPABASE_OBJECTS avec des noms référençables', () => {
    const rendered = renderDatabaseObjectsModule({
      databaseObjects: extractDatabaseObjectsFromSql(
        "CREATE INDEX a_idx ON t (c); ALTER TABLE t ADD CONSTRAINT no_room_overlap CHECK (true); RAISE EXCEPTION 'Boom';"
      ),
      supabaseObjects: extractDatabaseObjectsFromSql("insert into storage.buckets (id) values ('logos');")
    });
    expect(rendered).toContain('export const DATABASE_OBJECTS = {');
    expect(rendered).toContain('export const SUPABASE_OBJECTS = {');
    expect(rendered).toContain('"INDEXES": {');
    expect(rendered).toContain('"UNIQUE_INDEXES": {');
    expect(rendered).toContain('"CRON_JOBS": {');
    expect(rendered).toContain('"DERIVED_COLUMNS": [');
    expect(rendered).toContain('"EXCEPTION_MESSAGES": [');
    expect(rendered).toContain('"A_IDX": "a_idx"');
    expect(rendered).toContain('"NO_ROOM_OVERLAP": "no_room_overlap"');
    expect(rendered).toContain('"LOGOS": "logos"');
    expect(rendered).toContain('"Boom"');
    expect(rendered).toContain('} as const;');
    expect(rendered.endsWith('\n')).toBe(true);
  });
});
