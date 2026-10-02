import { redirect } from "next/navigation";
import { ERRORS } from "@/config";
import { formDataToObject } from "./data";

// ── Protocole d'URL : ?status=<verb> | ?error=<verb|quota|failed> (jamais de message)
export type FormVerb = "create" | "update" | "remove";
export type FeedbackError = FormVerb | "quota" | "failed";

export function withParams(path: string, params: Record<string, string>) {
  return `${path}${path.includes("?") ? "&" : "?"}${new URLSearchParams(params)}`;
}

// Message affichable pour un code d'URL ; undefined si le code est inconnu.
export function getFeedbackMessage(kind: "error" | "status", code?: string) {
  const messages: Record<string, string> = ERRORS.UI.FEEDBACK[kind];
  return code && Object.hasOwn(messages, code) ? messages[code] : undefined;
}

// Erreur de limite (quota), produite par la contrainte DB (via tryConstraint).
// Seul endroit qui dépend du mot « limite » dans ce message.
export function isLimitError(message: string) {
  return /limite/i.test(message);
}

// Chemin résolu par l'appelant — statique, ou calculé (slug, id, contexte
// métier quelconque). Le module de redirection ne connaît jamais de path
// en dur : c'est exactement ce qui manquait pour réutiliser ce système
// avec un autre service que `class`.
type PathResolver = string | (() => Promise<string | null> | string | null);

async function resolvePath(path: PathResolver): Promise<string | null> {
  return typeof path === "function" ? await path() : path;
}

// succès -> ?status=<verb> | échec -> ?error=<verb> (ou quota si limite atteinte)
function redirectWithResult(path: string, res: { error?: string }, verb: FormVerb): never {
  redirect(
    withParams(path, res.error ? { error: isLimitError(res.error) ? "quota" : verb } : { status: verb }),
  );
}

// FormData -> action de service existante. Pas de redirection ici : cette
// fonction ne fait que la conversion FormData -> appel d'action, pour
// rester composable avec n'importe quelle stratégie de redirection (ou
// aucune, pour un test par exemple). Le cast `as I` est sûr : l'action
// refait un safeParse sur ce qui traverse la frontière client/serveur.
export function toFormAction<I = unknown>(
  action: (input: I) => Promise<{ error?: string }>,
  input: (formData: FormData) => I = (formData) => formDataToObject(formData) as I,
) {
  return (formData: FormData) => action(input(formData));
}

// Compose un formAction (toFormAction) avec une redirection. `path` est
// fourni par l'appelant — jamais déduit ici. redirect() lève une exception :
// dernière instruction, hors try/catch.
export function withRedirect(
  formAction: (formData: FormData) => Promise<{ error?: string }>,
  verb: FormVerb,
  path: PathResolver,
) {
  return async (formData: FormData) => {
    const res = await formAction(formData);
    const target = await resolvePath(path);

    if (!target) return; // aucune destination : la page reste telle quelle

    redirectWithResult(target, res, verb);
  };
}