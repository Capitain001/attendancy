import { getUserInfo } from "@/modules/user/userInfo";
import { PERSONAL_ROUTE_SEGMENT, ROLE_PATHS } from "@/config/redirects";
import { UserRoles } from "@/types/user";

// ── Chemins du parcours perso : réutilise PERSONAL_ROUTE_SEGMENT et
// ROLE_PATHS (config/redirects.ts) plutôt que de redupliquer "personal" et
// "teacher" en dur — ce sont littéralement les mêmes segments qu'orgBasePath
// calcule pour le même cas (org.type === "PERSONAL" && role === TEACHER).
// Un seul endroit à changer si l'un des deux évolue.
export const personal = {
  home: (slug: string) => `/${PERSONAL_ROUTE_SEGMENT}/${encodeURIComponent(slug)}/${ROLE_PATHS[UserRoles.TEACHER]}`,
  start: (slug: string) => `${personal.home(slug)}?start`,
  classes: (slug: string) => `${personal.home(slug)}/classes`,
};

export async function getUserSlug() {
  const user = await getUserInfo();
  return user?.organization?.slug ?? null;
}