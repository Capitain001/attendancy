import { pickKeys } from "./pick";
import type { UserInfo } from "./types";

/** Seules clés de UserInfo diffusées en présence : visibles de tous les membres, fournies par le client. */
export const PRESENCE_USER_KEYS = [
  "id",
  "name",
  "avatar_url",
  "email",
  "role",
  "function",
  "status",
] as const satisfies readonly (keyof UserInfo)[];

export type PresenceUser = Pick<
  UserInfo,
  (typeof PRESENCE_USER_KEYS)[number] | "online_at"
>;

export function toPresenceUser(user: UserInfo): PresenceUser {
  return pickKeys(user, PRESENCE_USER_KEYS);
}
