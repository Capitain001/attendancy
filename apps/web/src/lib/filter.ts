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

