// scripts/generate/db/objects.ts
// Génère src/generated/db-objects.ts depuis prisma/post-migrate/**/*.sql.
//   tsx scripts/generate/db/objects.ts           → écrit le fichier
//   tsx scripts/generate/db/objects.ts --check   → échoue si le fichier est obsolète
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { countDatabaseObjects, loadDatabaseObjectsFromSqlDirectory } from './parse';
import { renderDatabaseObjectsModule } from './render';

const SQL_DIRECTORY = path.resolve(__dirname, '../../../prisma/post-migrate');
const GENERATED_FILE_PATH = path.resolve(__dirname, '../../../src/generated/db-objects.ts');

function generateDatabaseObjectsFile(): void {
  const loadedObjects = loadDatabaseObjectsFromSqlDirectory(SQL_DIRECTORY);
  const totalObjects =
    countDatabaseObjects(loadedObjects.databaseObjects) +
    countDatabaseObjects(loadedObjects.supabaseObjects);

  // Garde-fou global : certains fichiers (20_profile, 60_evaluation) sont volontairement vides.
  if (totalObjects === 0) {
    throw new Error(`Aucun objet détecté dans ${SQL_DIRECTORY} : parsing cassé ou dossier vide.`);
  }

  const renderedModule = renderDatabaseObjectsModule(loadedObjects);

  if (process.argv.includes('--check')) {
    const currentModule = existsSync(GENERATED_FILE_PATH)
      ? readFileSync(GENERATED_FILE_PATH, 'utf8')
      : '';
    if (currentModule !== renderedModule) {
      console.error('db-objects.ts est obsolète : lancer `bun run db:generate-objects`.');
      process.exit(1);
    }
    console.log('db-objects.ts est à jour.');
    return;
  }

  mkdirSync(path.dirname(GENERATED_FILE_PATH), { recursive: true });
  writeFileSync(GENERATED_FILE_PATH, renderedModule, 'utf8');
  console.log(
    `Généré : ${path.relative(process.cwd(), GENERATED_FILE_PATH)} (${totalObjects} objets)`
  );
}

generateDatabaseObjectsFile();
