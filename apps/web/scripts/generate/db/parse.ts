// scripts/generate/db/parse.ts
// Lit du SQL et en extrait les objets de base de données qu'il déclare.
// Aucune connexion à la base : le seul accès disque est le chargeur de dossier.
import { readFileSync } from 'node:fs';
import { listSqlFilesRecursively } from '../../database/list-sql-files';

// Marqueur d'en-tête des fichiers SQL qui dépendent des schémas auth/storage de Supabase.
const SUPABASE_ONLY_MARKER = 'TEST_DB_SKIP';

// Identifiant SQL, quoté ou non : "name" | name
const IDENTIFIER = String.raw`"?([A-Za-z_]\w*)"?`;
// Nom qualifié optionnel : "public"."name" | public.name | name
const QUALIFIED_NAME = String.raw`(?:"?\w+"?\.)?${IDENTIFIER}`;

export type DerivedColumn = { table: string; column: string };

export type DatabaseObjects = {
  extensions: string[];
  indexes: string[];
  uniqueIndexes: string[];
  constraints: string[];
  functions: string[];
  triggers: string[];
  views: string[];
  buckets: string[];
  policies: string[];
  derivedColumns: DerivedColumn[];
  exceptionMessages: string[];
  cronJobs: string[];
};

export type LoadedDatabaseObjects = {
  databaseObjects: DatabaseObjects; // fichiers sans marqueur
  supabaseObjects: DatabaseObjects; // fichiers marqués TEST_DB_SKIP
};

// Retire les commentaires `--` et `/* */` en gardant les littéraux '...' intacts
// (un `--` dans une chaîne n'est pas un commentaire, une apostrophe dans un
// commentaire n'ouvre pas de chaîne : le premier élément rencontré gagne).
export function stripSqlComments(sqlContent: string): string {
  return sqlContent.replace(
    /'(?:[^']|'')*'|--[^\n]*|\/\*[\s\S]*?\*\//g,
    matched => (matched.startsWith("'") ? matched : '')
  );
}

function collectFirstGroupMatches(sqlContent: string, pattern: RegExp): string[] {
  return [...sqlContent.matchAll(pattern)].map(match => match[1]);
}

export function extractDatabaseObjectsFromSql(rawSqlContent: string): DatabaseObjects {
  const sql = stripSqlComments(rawSqlContent);
  const collect = (pattern: RegExp) => collectFirstGroupMatches(sql, pattern);

  const derivedColumns = [
    ...sql.matchAll(
      new RegExp(
        String.raw`ALTER\s+TABLE\s+(?:ONLY\s+)?${QUALIFIED_NAME}\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?${IDENTIFIER}`,
        'gi'
      )
    )
  ].map(match => ({ table: match[1], column: match[2] }));

  return {
    extensions: collect(
      new RegExp(String.raw`CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?${IDENTIFIER}`, 'gi')
    ),
    indexes: collect(
      new RegExp(String.raw`CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?${IDENTIFIER}`, 'gi')
    ),
    uniqueIndexes: collect(
      new RegExp(String.raw`CREATE\s+UNIQUE\s+INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?${IDENTIFIER}`, 'gi')
    ),
    constraints: collect(new RegExp(String.raw`ADD\s+CONSTRAINT\s+${IDENTIFIER}`, 'gi')),
    functions: collect(
      new RegExp(String.raw`CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+${QUALIFIED_NAME}\s*\(`, 'gi')
    ),
    triggers: collect(
      new RegExp(String.raw`CREATE\s+(?:OR\s+REPLACE\s+)?(?:CONSTRAINT\s+)?TRIGGER\s+${IDENTIFIER}`, 'gi')
    ),
    views: collect(
      new RegExp(String.raw`CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+${QUALIFIED_NAME}`, 'gi')
    ),
    buckets: collect(
      /INSERT\s+INTO\s+"?storage"?\."?buckets"?\s*\([^)]*\)\s*VALUES\s*\(\s*'([^']+)'/gi
    ),
    policies: collect(/CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+"?storage"?\."?objects"?/gi),
    derivedColumns,
    exceptionMessages: collect(/RAISE\s+EXCEPTION\s+'((?:[^']|'')*)'/gi).map(message =>
      message.replace(/''/g, "'")
    ),
    cronJobs: collect(/cron\.schedule\(\s*'([^']+)'/gi)
  };
}

const sortedUnique = (values: string[]) => [...new Set(values)].sort();

function mergeDerivedColumns(columns: DerivedColumn[]): DerivedColumn[] {
  const columnsByKey = new Map(columns.map(column => [`${column.table}.${column.column}`, column]));
  return [...columnsByKey.entries()]
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
    .map(([, column]) => column);
}

export function mergeDatabaseObjects(allObjects: DatabaseObjects[]): DatabaseObjects {
  const mergeNames = (pick: (objects: DatabaseObjects) => string[]) =>
    sortedUnique(allObjects.flatMap(pick));

  return {
    extensions: mergeNames(objects => objects.extensions),
    indexes: mergeNames(objects => objects.indexes),
    uniqueIndexes: mergeNames(objects => objects.uniqueIndexes),
    constraints: mergeNames(objects => objects.constraints),
    functions: mergeNames(objects => objects.functions),
    triggers: mergeNames(objects => objects.triggers),
    views: mergeNames(objects => objects.views),
    buckets: mergeNames(objects => objects.buckets),
    policies: mergeNames(objects => objects.policies),
    derivedColumns: mergeDerivedColumns(allObjects.flatMap(objects => objects.derivedColumns)),
    exceptionMessages: mergeNames(objects => objects.exceptionMessages),
    cronJobs: mergeNames(objects => objects.cronJobs)
  };
}

export function countDatabaseObjects(databaseObjects: DatabaseObjects): number {
  return Object.values(databaseObjects).reduce((total, objects) => total + objects.length, 0);
}

// Lit le marqueur dans le contenu brut : il vit dans un commentaire d'en-tête.
export function isSupabaseOnlySql(rawSqlContent: string): boolean {
  return rawSqlContent.includes(SUPABASE_ONLY_MARKER);
}

export function loadDatabaseObjectsFromSqlDirectory(sqlDirectory: string): LoadedDatabaseObjects {
  const sqlContents = listSqlFilesRecursively(sqlDirectory).map(filePath =>
    readFileSync(filePath, 'utf8')
  );

  const extractMerged = (contents: string[]) =>
    mergeDatabaseObjects(contents.map(extractDatabaseObjectsFromSql));

  return {
    databaseObjects: extractMerged(sqlContents.filter(content => !isSupabaseOnlySql(content))),
    supabaseObjects: extractMerged(sqlContents.filter(isSupabaseOnlySql))
  };
}
