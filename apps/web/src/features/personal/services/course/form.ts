//apps\web\src\features\personal\services\course\form.ts

// Versions « formulaire » (FormData + redirect) des actions de cours.
//
// Chemin "" : redirection relative, la page courante est rechargée avec
// ?status=<verb> ou ?error=<verb>. Aucun resolver, donc pas de classId à reconstruire.
"use server";

import { toFormAction, withRedirect } from "@/utils/server/form/action";
import { createPersonalCourseAction } from "./actions";

// Champs : classId, name
export const createPersonalCourseFormAction = withRedirect(
  toFormAction(createPersonalCourseAction),
  "create",
  "",
);