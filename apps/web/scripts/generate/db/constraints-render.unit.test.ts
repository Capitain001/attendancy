// scripts/generate/db/constraints-render.test.ts
import { describe, expect, it } from 'vitest';
import { excludeKnownNames, renderConstraintsModule } from './constraints-render';

describe('excludeKnownNames', () => {
  it('retire les noms connus, les doublons, et trie', () => {
    expect(excludeKnownNames(['b_key', 'a_key', 'b_key', 'sql_idx'], ['sql_idx'])).toEqual([
      'a_key',
      'b_key'
    ]);
  });
});

describe('renderConstraintsModule', () => {
  const rendered = renderConstraintsModule({
    uniques: ['AcademicYear_name_orgId_key'],
    foreignKeys: ['AcademicYear_orgId_fkey']
  });

  it('émet des objets clé → nom référençables', () => {
    expect(rendered).toContain('export const DATABASE_CONSTRAINTS = {');
    expect(rendered).toContain('"UNIQUES": {');
    expect(rendered).toContain('"FOREIGN_KEYS": {');
    expect(rendered).toContain('"ACADEMIC_YEAR_NAME_ORG_ID_KEY": "AcademicYear_name_orgId_key"');
    expect(rendered).toContain('"ACADEMIC_YEAR_ORG_ID_FKEY": "AcademicYear_orgId_fkey"');
    expect(rendered).toContain('} as const;');
    expect(rendered.endsWith('\n')).toBe(true);
  });

  it('émet des catégories vides valides', () => {
    expect(renderConstraintsModule({ uniques: [], foreignKeys: [] })).toContain('"UNIQUES": {}');
  });
});
