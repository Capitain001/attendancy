// src/services/course/form.ts

// Versions « formulaire » (FormData + redirect) des actions de cours.
//
// Chemin "" : redirection relative, la page courante est rechargée avec
// ?status=<verb> ou ?error=<verb>. Aucun resolver, donc pas de classId à reconstruire.
"use server";

import { removeCourseAction } from "@/services/course"; // adapter le chemin d'import si besoin
import { toFormAction } from "@/utils/server/form/action";


// Champ : courseId.
// removeCourseAction attend un simple string (pas un objet) : on remplace le
// mapping par défaut (formDataToObject) par une lecture directe de courseId.
// Pas de redirection ici : la destination dépend de la page appelante,
// qui compose elle-même avec withRedirect.
export const removeCourseFormAction = toFormAction(removeCourseAction, (formData) =>
  String(formData.get("courseId") ?? ""),
);