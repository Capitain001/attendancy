// Versions « formulaire » (FormData + redirect) des actions de class.
//
//   withRedirect(toFormAction(action), verb, pathResolver)
//     action       : l'action de service existante (auth + validation + DB)
//     verb         : 'create' | 'update' | 'remove' -> code du retour dans l'URL
//     pathResolver : construit ici, pas dans l'utilitaire générique — c'est
//                    ce qui permet de réutiliser form-action.ts pour
//                    n'importe quel autre service sans toucher à son code.
//
// RÈGLE : les champs du formulaire portent les noms de l'entrée de l'action.
// Une clé imbriquée s'écrit avec un point (`data.name`).
"use server";

import { toFormAction, withRedirect } from "@/utils/server/form/action";
import { personal, getUserSlug } from "@/modules/personal/paths";
import { createPersonalClassAction, removeClassAction, updateClassAction } from "./actions";

async function resolveClassesPath() {
  const slug = await getUserSlug();
  return slug ? personal.classes(slug) : null;
}

// Champs : name
export const createClassFormAction = withRedirect(toFormAction(createPersonalClassAction), "create", resolveClassesPath);

// Champs : classId, data.name
export const updateClassFormAction = withRedirect(toFormAction(updateClassAction), "update", resolveClassesPath);

// Champ : classId
export const removeClassFormAction = withRedirect(toFormAction(removeClassAction), "remove", resolveClassesPath);