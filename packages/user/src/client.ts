import { pickKeys } from "./pick";
import {
  APP_METADATA_KEYS,
  USER_METADATA_KEYS,
  type UserInfo,
} from "./types";

/**
 * Clés de UserInfo exposées au client, et SEULE source du type que le client lit.
 * Volontairement complète tant que les besoins côté client ne sont pas arrêtés :
 * pour restreindre, retirer des clés ici, la compilation signale alors chaque usage
 * côté client d'un champ qui n'est plus exposé.
 * `id` est toujours ajouté par mapClientUser, inutile de le lister.
 */
export const CLIENT_USER_KEYS = [
  ...APP_METADATA_KEYS,
  ...USER_METADATA_KEYS,
  "email",
  "email_verified",
  "phone_verified",
  "online_at",
  "updated_at",
] as const satisfies readonly (keyof UserInfo)[];

/** Ce que lit le client : UserInfo réduit aux clés de CLIENT_USER_KEYS, plus `id`. */
export type ClientUser = Pick<
  UserInfo,
  (typeof CLIENT_USER_KEYS)[number] | "id"
>;

export function mapClientUser(user: UserInfo): ClientUser {
  // `id` toujours inclus, même si quelqu'un le retire de la liste
  return pickKeys(user, [...CLIENT_USER_KEYS, "id"]);
}
