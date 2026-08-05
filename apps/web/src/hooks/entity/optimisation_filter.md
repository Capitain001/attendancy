Parfait 🔥 !
On va faire deux améliorations à ton système :

Ajout d’opérateurs façon Prisma ($eq, $gt, $lt, $in, $contains, etc.)

Pagination côté client (utilisant déjà page et limit dans EntityParams).

1. Prisma-like operators pour where

On enrichit ton PartialDeep<T> pour supporter des opérateurs :

// types.ts
export type FilterOperators<T> = {
  $eq?: T;
  $gt?: T extends number | Date ? T : never;
  $lt?: T extends number | Date ? T : never;
  $in?: T[];
  $contains?: T extends string ? string : never;
};

export type WhereCondition<T> =
  | FilterOperators<T>
  | (T extends object ? PartialDeep<T> : T);

export type PartialDeep<T> = {
  [P in keyof T]?: WhereCondition<T[P]>;
};


Puis dans useFilterFn, on interprète :

// entityFilters.ts
const matchesOperator = (val: any, condition: any): boolean => {
  if (typeof condition !== "object" || condition === null) {
    return val === condition;
  }

  if (condition.$eq !== undefined) return val === condition.$eq;
  if (condition.$gt !== undefined) return val > condition.$gt;
  if (condition.$lt !== undefined) return val < condition.$lt;
  if (condition.$in !== undefined) return condition.$in.includes(val);
  if (condition.$contains !== undefined && typeof val === "string") {
    return val.includes(condition.$contains);
  }

  return true;
};


Et dans ton useFilterFn:

export const useFilterFn = <T>(where?: PartialDeep<T>): ((item: T) => boolean) | undefined => {
  return useMemo(() => {
    if (!where) return undefined;

    const compiledFilters = Object.entries(where).map(([path, value]) => ({
      keys: path.split("."),
      value
    }));

    return (item: T) =>
      compiledFilters.every(filter => {
        let val: any = item;
        for (const key of filter.keys) {
          val = val?.[key];
          if (val === undefined) break;
        }
        return matchesOperator(val, filter.value);
      });
  }, [where]);
};


👉 Exemple d’utilisation :

const { data } = useEntityFilter<User>({
  entity: "users",
  where: {
    age: { $gt: 18 },
    email: { $contains: "@gmail.com" },
    role: { $in: ["admin", "vendor"] }
  },
  sort: { key: "createdAt", order: "desc" },
});
