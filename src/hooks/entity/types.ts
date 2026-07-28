//@/hooks/entity/types.ts
import { UseEntityOptions } from "./useEntity";


/**
 * Types de base pour le système d'entités
 */
export interface EntityParams {
    /** Paramètres de pagination */
    page?: number;
    limit?: number;
    /** Autres paramètres personnalisés */
    [key: string]: any;
  }
  
  export type EntityFetchFn<T> = (params?: EntityParams) => Promise<T[]>;
  
  /**
   * Type pour le filtrage profond (nested objects)
   */

/**
 * Opérateurs de filtrage typés
 */
export type FilterOperators<T> = {
  $eq?: T;
  $ne?: T;
  $gt?: T extends number | Date ? T : never;
  $gte?: T extends number | Date ? T : never;
  $lt?: T extends number | Date ? T : never;
  $lte?: T extends number | Date ? T : never;
  $in?: T[];
  $contains?: T extends string ? string : never;
  $startsWith?: T extends string ? string : never;
  $endsWith?: T extends string ? string : never;
  $between?: T extends number | Date ? [T, T] : never;
};

/**
 * Condition de filtrage - supporte la syntaxe shorthand ou les opérateurs
 */
export type WhereCondition<T> = 
  | T  // Syntaxe shorthand: where: { name: "John" } 
  | FilterOperators<T>;

/**
 * Type pour le filtrage profond (nested objects) avec opérateurs
 */
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object 
    ? PartialDeep<T[P]> 
    : WhereCondition<T[P]>;
};



export interface UseEntityCacheOptions<T> extends UseEntityOptions<T> {
  where?: PartialDeep<T>;
  sort?: { key: Path<T>; order: "asc" | "desc" };
}

  export type Path<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object 
        ? `${K & string}.${Path<T[K]>}` 
        : K & string
    }[keyof T]
  : never;



