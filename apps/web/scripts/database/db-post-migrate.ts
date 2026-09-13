import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const postMigrateDir = join(__dirname, '../../prisma/post-migrate');

function getSqlFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSqlFiles(filePath));
    } else if (file.endsWith('.sql')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = getSqlFiles(postMigrateDir);

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
