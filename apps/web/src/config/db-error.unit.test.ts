// src/config/db-error.unit.test.ts
// Les clés de TRIGGER_ERROR qui ne viennent pas du SQL (fragments de messages RAISE EXCEPTION)
// restent écrites à la main : ce test détecte celles qui ne correspondent plus à aucun message.
// (DB_CONSTRAINTS et les index uniques de CONSTRAINT_ERROR sont déjà vérifiés par le compilateur.)
import { describe, expect, it } from 'vitest';
import { DATABASE_OBJECTS, SUPABASE_OBJECTS } from '@/generated/db-objects';
import { TRIGGER_ERROR } from '@/config/constants';

describe('TRIGGER_ERROR', () => {
  it('ne contient que des clés présentes dans le SQL (nom de contrainte ou fragment de message)', () => {
    const knownSources: readonly string[] = [
      ...Object.values(DATABASE_OBJECTS.CONSTRAINTS),
      ...DATABASE_OBJECTS.EXCEPTION_MESSAGES,
      ...SUPABASE_OBJECTS.EXCEPTION_MESSAGES
    ];
    const staleKeys = Object.keys(TRIGGER_ERROR).filter(
      key => !knownSources.some(source => source.includes(key))
    );
    expect(staleKeys).toEqual([]);
  });
});
