// src/lib/filter.ts
// apps\web\src\lib\filter.ts
export type Relation = {
  id: string;
  name: string;
};

export type GroupedResources<T> = {
  relation: Relation;
  items: T[];
};

/* 
// Par cours
groupByRelation(evaluations, (e) => e.course)

// Par année académique
groupByRelation(evaluations, (e) => e.academicYear)

// Par étudiant
groupByRelation(evaluations, (e) => ({
  id: e.student.id,
  name: `${e.student.user.firstName} ${e.student.user.lastName}`
}))
*/
export function groupByRelation<T>(
  items: T[],
  getRelation: (item: T) => Relation
): GroupedResources<T>[] {
  const map = new Map<string, GroupedResources<T>>();

  for (const item of items) {
    const relation = getRelation(item);

    const existing = map.get(relation.id);

    if (existing) {
      existing.items.push(item);
    } else {
      map.set(relation.id, {
        relation,
        items: [item],
      });
    }
  }

  return Array.from(map.values());
}

type StringKey<T> = {
  [K in keyof T]: T[K] extends string ? K : never
}[keyof T]

type IdSelector<T> = StringKey<T> | ((item: T) => string)

/**
 * Retire de `items` ceux dont l'id figure dans `excludedIds`.
 * - par défaut, l'id est lu sur `item.id`
 * - sinon : nom d'une clé string (`'studentId'`) ou accesseur (`(e) => e.student.id`)
 */
export function excludeByIds<T extends { id: string }>(
  items: readonly T[],
  excludedIds: readonly string[],
): T[]
export function excludeByIds<T>(
  items: readonly T[],
  excludedIds: readonly string[],
  selector: IdSelector<T>,
): T[]
export function excludeByIds<T>(
  items: readonly T[],
  excludedIds: readonly string[],
  selector: IdSelector<T> = 'id' as IdSelector<T>,
) {
  const excluded = new Set(excludedIds)
  const getId =
    typeof selector === 'function' ? selector : (item: T) => String(item[selector])

  return items.filter((item) => !excluded.has(getId(item)))
}