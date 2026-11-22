// scripts/generate/db/render.ts
// Produit le texte du module TypeScript généré (pure, testable).
// Les noms d'objets sont émis en objets clé → nom, pour pouvoir être référencés :
//   DATABASE_OBJECTS.CONSTRAINTS.NO_ROOM_OVERLAP === 'no_room_overlap'
import type { DatabaseObjects, LoadedDatabaseObjects } from './parse';

// Catégories dont les éléments sont des identifiants SQL (donc nommables).
const KEYED_CATEGORIES = [
  'extensions',
  'indexes',
  'uniqueIndexes',
  'constraints',
  'functions',
  'triggers',
  'views',
  'buckets',
  'policies',
  'cronJobs'
] as const;

// no_room_overlap → NO_ROOM_OVERLAP ; purge-deleted-notes → PURGE_DELETED_NOTES ;
// uniqueIndexes → UNIQUE_INDEXES
export function toConstantCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function toKeyedNames(names: readonly string[]): Record<string, string> {
  const keyedNames: Record<string, string> = {};
  for (const name of names) {
    const key = toConstantCase(name);
    if (key in keyedNames && keyedNames[key] !== name) {
      throw new Error(`Collision de clé « ${key} » entre « ${keyedNames[key]} » et « ${name} ».`);
    }
    keyedNames[key] = name;
  }
  return keyedNames;
}

// Toutes les clés du module généré sont en CONSTANT_CASE (EXTENSIONS, UNIQUE_INDEXES, CRON_JOBS, …).
function toGeneratedShape(objects: DatabaseObjects) {
  return {
    ...Object.fromEntries(
      KEYED_CATEGORIES.map(category => [toConstantCase(category), toKeyedNames(objects[category])])
    ),
    DERIVED_COLUMNS: objects.derivedColumns,
    EXCEPTION_MESSAGES: objects.exceptionMessages
  };
}

export function renderDatabaseObjectsModule({
  databaseObjects,
  supabaseObjects
}: LoadedDatabaseObjects): string {
  return [
    '// ⚠️ Fichier généré par scripts/generate/db/objects.ts — ne pas modifier à la main.',
    '// Source : prisma/post-migrate/**/*.sql',
    '/* eslint-disable */',
    '',
    `export const DATABASE_OBJECTS = ${JSON.stringify(toGeneratedShape(databaseObjects), null, 2)} as const;`,
    '',
    '// Objets des fichiers marqués TEST_DB_SKIP : ils dépendent des schémas auth/storage de Supabase.',
    `export const SUPABASE_OBJECTS = ${JSON.stringify(toGeneratedShape(supabaseObjects), null, 2)} as const;`,
    '',
    'export type DatabaseObjects = typeof DATABASE_OBJECTS;',
    ''
  ].join('\n');
}
