// scripts/database/db-post-migrate.ts
import { execSync } from 'child_process';
import { join } from 'path';
import { listSqlFilesRecursively } from './list-sql-files';

const postMigrateDir = join(__dirname, '../../prisma/post-migrate');

const files = listSqlFilesRecursively(postMigrateDir);

// Optionnel: Trier les fichiers pour assurer un ordre d'exécution (ex: 00_extensions.sql d'abord)
files.sort();

console.log(`Trouvé ${files.length} fichiers SQL à exécuter dans ${postMigrateDir}`);

for (const file of files) {
  console.log(`\n========================================`);
  console.log(`Exécution de ${file}`);
  console.log(`========================================`);
  try {
    execSync(`npx prisma db execute --file "${file}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\nErreur lors de l'exécution de ${file}`);
    process.exit(1);
  }
}

console.log('\n✅ Tous les scripts post-migrate ont été exécutés avec succès.');
