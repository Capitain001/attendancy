// scripts/generate/db/constraints-render.ts
// Produit le texte du module généré des contraintes lues dans le catalogue Postgres (pure, testable).
//   DATABASE_CONSTRAINTS.FOREIGN_KEYS.ACADEMIC_YEAR_ORG_ID_FKEY === 'AcademicYear_orgId_fkey'
import { toKeyedNames } from './render';

export type ConstraintNames = {
  uniques: readonly string[];
  foreignKeys: readonly string[];
};

// Retire les noms déjà couverts ailleurs (ex. index uniques écrits dans le SQL), puis trie.
export function excludeKnownNames(names: readonly string[], knownNames: readonly string[]): string[] {
  const known = new Set(knownNames);
  return [...new Set(names)].filter(name => !known.has(name)).sort();
}

export function renderConstraintsModule({ uniques, foreignKeys }: ConstraintNames): string {
  const shape = {
    UNIQUES: toKeyedNames(uniques),
    FOREIGN_KEYS: toKeyedNames(foreignKeys)
  };
  return [
    '// ⚠️ Fichier généré par scripts/generate/db/constraints.ts — ne pas modifier à la main.',
    '// Source : catalogue Postgres (index uniques non partiels et clés étrangères du schéma public).',
    '/* eslint-disable */',
    '',
    `export const DATABASE_CONSTRAINTS = ${JSON.stringify(shape, null, 2)} as const;`,
    '',
    'export type DatabaseConstraints = typeof DATABASE_CONSTRAINTS;',
    ''
  ].join('\n');
}
