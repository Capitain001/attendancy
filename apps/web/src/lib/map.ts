// apps/web/src/lib/map.ts
import { getFullName } from "./utils";

export function withName<
  T extends { firstName?: string | null; lastName?: string | null }
>(user: T): Omit<T, "name"> & { name: string | null } {
  return {
    ...user,
    name: getFullName(user.firstName, user.lastName) || null,
  };
}