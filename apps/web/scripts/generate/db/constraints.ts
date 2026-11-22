// scripts/generate/db/constraints.ts
// Génère src/generated/db-constraints.ts depuis le catalogue Postgres (base migrée requise).
//   tsx --env-file=.env scripts/generate/db/constraints.ts           → écrit le fichier
//   tsx --env-file=.env scripts/generate/db/constraints.ts --check   → échoue si le fichier est obsolète
// À lancer après `db:migrate` et `db:generate-objects` (les index déjà générés depuis le SQL sont exclus).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { DATABASE_OBJECTS } from '../../../src/generated/db-objects';
import { excludeKnownNames, renderConstraintsModule } from './constraints-render';

const GENERATED_FILE_PATH = path.resolve(__dirname, '../../../src/generated/db-constraints.ts');

async function generateConstraintsFile(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  });

  try {
    // Index uniques du schéma public (hors clé primaire) ; ceux du SQL post-migrate sont retirés par excludeKnownNames.
    const uniques = await prisma.$queryRaw<{ name: string }[]>`
      SELECT i.relname AS name
      FROM pg_index x
      JOIN pg_class i ON i.oid = x.indexrelid
      JOIN pg_class t ON t.oid = x.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND x.indisunique AND NOT x.indisprimary`;

    const foreignKeys = await prisma.$queryRaw<{ name: string }[]>`
      SELECT c.conname AS name
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND c.contype = 'f'`;

    const knownNames = [
      ...Object.values(DATABASE_OBJECTS.UNIQUE_INDEXES),
      ...Object.values(DATABASE_OBJECTS.CONSTRAINTS)
    ];
    const renderedModule = renderConstraintsModule({
      uniques: excludeKnownNames(uniques.map(row => row.name), knownNames),
      foreignKeys: excludeKnownNames(foreignKeys.map(row => row.name), knownNames)
    });

    if (uniques.length + foreignKeys.length === 0) {
      throw new Error('Aucune contrainte trouvée : base vide ou non migrée.');
    }

    if (process.argv.includes('--check')) {
      const currentModule = existsSync(GENERATED_FILE_PATH)
        ? readFileSync(GENERATED_FILE_PATH, 'utf8')
        : '';
      if (currentModule !== renderedModule) {
        console.error('db-constraints.ts est obsolète : lancer `bun run db:generate-constraints`.');
        process.exit(1);
      }
      console.log('db-constraints.ts est à jour.');
      return;
    }

    mkdirSync(path.dirname(GENERATED_FILE_PATH), { recursive: true });
    writeFileSync(GENERATED_FILE_PATH, renderedModule, 'utf8');
    console.log(
      `Généré : ${path.relative(process.cwd(), GENERATED_FILE_PATH)} (${uniques.length} uniques, ${foreignKeys.length} clés étrangères)`
    );
  } finally {
    await prisma.$disconnect();
  }
}

generateConstraintsFile().catch(error => {
  console.error(error);
  process.exit(1);
});
