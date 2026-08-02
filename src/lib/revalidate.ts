"use server";

import { revalidatePath } from "next/cache";

interface RevalidateActionProps {
  /**
   * Un ou plusieurs chemins à revalider.
   * Exemple:
   * - "direction/classes"
   * - ["direction/classes", "direction/program-tracks"]
   */
  path: string | string[];
  /**
   * Slug de l'organisation permettant de préfixer le path.
   * Exemple: "org-123"
   */
  slug?: string;
}

/**
 * @param path - Chemin ou liste de chemins à revalider
 * @param slug - Optionnel, permet de préfixer les paths dynamiquement
 *
 * @example
 * // Revalider une seule page
 * await revalidateAction({
 *   path: "direction/classes",
 *   slug: "org-123",
 * });
 *
 * @example
 * // Revalider plusieurs pages
 * await revalidateAction({
 *   path: [
 *     "direction/classes",
 *     "direction/program-tracks"
 *   ],
 *   slug: "org-123",
 * });
 */
export async function revalidateAction({ path, slug }: RevalidateActionProps) {
  const paths = Array.isArray(path) ? path : [path];

  for (const p of paths) {
    const pathUrl = slug ? `/${slug}/${p}` : `/${p}`;
    revalidatePath(pathUrl);
  }
}