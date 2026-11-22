// scripts/database/list-sql-files.ts
// Source unique de « quels fichiers .sql comptent » : partagée par l'exécuteur
// (db-post-migrate.ts) et le générateur (generate/db/objects.ts).
import { readdirSync } from 'node:fs';
import path from 'node:path';

export function listSqlFilesRecursively(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter(relativePath => relativePath.endsWith('.sql'))
    .map(relativePath => path.join(directory, relativePath));
}
