// src/lib/map.ts
import { getFullName } from "./utils";

export function withName<
  T extends { firstName?: string | null; lastName?: string | null }
>(user: T): Omit<T, "name"> & { name: string | null } {
  return {
    ...user,
    name: getFullName(user.firstName, user.lastName) || null,
  };
}


/** Rend toutes les clés optionnelles sauf celles listées dans K. */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>


export function hasId<T extends { id?: string }>(u: T | null | undefined): u is T & { id: string } {
  return !!u?.id
}