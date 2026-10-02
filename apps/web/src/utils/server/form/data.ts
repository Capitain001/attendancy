const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// FormData -> objet imbriqué. Les noms de champs en notation pointée deviennent
// des clés imbriquées : `classId` -> { classId }, `data.name` -> { data: { name } }.
// Les valeurs restent des chaînes : la validation (et la conversion éventuelle)
// est faite par le safeParse de l'action de service.
export function formDataToObject(formData: FormData) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData) {
    if (typeof value !== "string") continue; // fichiers ignorés
    if (key.startsWith("$ACTION")) continue; // champs internes de Next
    const path = key.split(".");
    if (path.some((k) => FORBIDDEN_KEYS.has(k))) continue;

    let node = out;
    for (const k of path.slice(0, -1)) {
      const next = node[k];
      node = (typeof next === "object" && next !== null ? next : (node[k] = {})) as Record<string, unknown>;
    }
    node[path[path.length - 1]] = value;
  }
  return out;
}