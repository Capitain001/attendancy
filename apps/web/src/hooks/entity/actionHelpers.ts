// src/hooks/entity/actionHelpers.ts
/**
 * Helpers pour adapter les réponses d'actions server au format attendu par useCrudEntity
 * 
 * Les actions server retournent généralement :
 * - { data?: T, error?: string }
 * - { success: boolean, error?: string }
 * 
 * useCrudEntity attend :
 * - fetchFn: () => Promise<T[]>
 * - create: (data) => Promise<T>
 * - update: (id, data) => Promise<Partial<T> & { id: string }>
 * - delete: (id) => Promise<void>
 */

// Convention V2 : { data: T } | { error: string }
export type ActionResponse<T> = { data: T } | { error: string };
export type ActionArrayResponse<T> = { data: T[] } | { error: string };
// ✅ Le pattern V1 ({ success: boolean; error?: string }) est retiré : le
// projet est entièrement en V2, seule la présence d'`error` dans la réponse
// détermine l'échec. La forme de `data` (id, boolean, objet complet...)
// n'a plus d'importance pour toDeleteFn.
export type ActionDeleteResponse = ActionResponse<any>;

// Extrait T depuis { data: T } | { error: string } sans déclencher l'inférence distributive
type ExtractData<R> = R extends { data: infer T } ? T : never;

/**
 * Convertit une action qui retourne { data?: T[], error?: string } 
 * en fonction () => Promise<T[]>
 * 
 * @example
 * const fetchFn = toFetchFn(getCoursesAction, { classId: "123" });
 */
export function toFetchFn<TResponse extends ActionArrayResponse<any>>(
  action: (...args: any[]) => Promise<TResponse>,
  ...args: any[]
): () => Promise<ExtractData<TResponse>> {
  return async () => {
    const response = await action(...args);
    if ('error' in response) throw new Error(response.error);
    return (response as { data: ExtractData<TResponse> }).data;
  };
}

export function toCreateFn<TInput, TResponse extends ActionResponse<any>>(
  action: (data: TInput) => Promise<TResponse>
): (data: TInput) => Promise<ExtractData<TResponse>> {
  return async (data: TInput) => {
    const response = await action(data);
    if ('error' in response) throw new Error(response.error);
    return (response as { data: ExtractData<TResponse> }).data;
  };
}

/**
 * Convertit une action serveur V2 (id + payload NESTED sous `data`)
 * en fonction (id, data) => Promise<T>.
 *
 * Norme V2 : `updateXxxAction({ xxxId, data: {...} })`
 * → `toUpdateFn(updateXxxAction, "xxxId")`
 *
 * ⚠️ NORME (depuis ce fix) : le payload est TOUJOURS imbriqué sous la clé
 * `data`, jamais étalé à plat au même niveau que l'id — cf. updateClassAction
 * qui a servi de référence pour fixer ce helper :
 *   updateClassAction({ classId, data: { name, ... } })
 * Toute action `updateXxxAction` câblée via ce helper DOIT suivre cette
 * même forme `{ [idField]: id, data }`. Un ancien pattern flat
 * (`{ xxxId, ...data }`, ex: l'ancienne version de updateFunctionAction)
 * n'est PLUS supporté — l'action doit être migrée vers le format nested
 * avant d'être branchée ici, sous peine de recevoir `data: undefined`
 * côté validation serveur.
 *
 * Aucun générique explicite n'est nécessaire à l'appel : TResponse
 * s'infère directement depuis `action` (placé en premier paramètre de
 * type exprès pour ça), TId/TInput ont des valeurs par défaut (`string`,
 * `object`) suffisamment larges pour être assignables partout où le hook
 * consommateur attend un type plus précis (contravariance des paramètres
 * de fonction : accepter `object` est toujours valide là où `UpdateInput`
 * est attendu).
 *
 * @example
 * const update = toUpdateFn(updateFunctionAction, "functionId");
 */
export function toUpdateFn<
  TResponse extends ActionResponse<any>,
  TId = string,
  TInput extends object = object
>(
  action: (input: any) => Promise<TResponse>,
  idField: string
): (id: TId, data: TInput) => Promise<ExtractData<TResponse>> {
  return async (id: TId, data: TInput) => {
    const response = await action({ [idField]: id, data });
    if ('error' in response) throw new Error(response.error);
    return (response as { data: ExtractData<TResponse> }).data;
  };
}

/**
 * Convertit une action qui retourne { data: any, error?: string }
 * en fonction (id) => Promise<void>. La forme de `data` n'a pas
 * d'importance (id, boolean, objet complet...) : seule la présence
 * d'`error` déclenche un throw.
 * 
 * @example
 * const delete = toDeleteFn(removeCourseAction);
 */
export function toDeleteFn<TId>(
  action: (id: TId) => Promise<ActionDeleteResponse>
): (id: TId) => Promise<void> {
  return async (id: TId) => {
    const response = await action(id);
    if ('error' in response && response.error) throw new Error(response.error)
  };
}

/**
 * Helper complet pour créer tous les wrappers d'un coup
 * 
 * @example
 * const { fetchFn, create, update, delete: deleteFn } = createActionWrappers({
 *   fetch: (classId?: string) => getCoursesAction({ classId }),
 *   create: addCourseAction,
 *   update: updateCourseAction,
 *   delete: removeCourseAction
 * }, { classId: "123" });
 *
 * // Pattern V2 (id + data imbriqués), passer idField :
 * const { update } = createActionWrappers({ ... }, args, { updateIdField: "functionId" });
 */
export function createActionWrappers<
  TFetchInput extends any[],
  TCreateInput,
  TUpdateId,
  TUpdateInput extends object,
  TDeleteId,
  TFetchResponse extends ActionArrayResponse<any>,
  TCreateResponse extends ActionResponse<any>,
  TUpdateResponse extends ActionResponse<any>,
>(actions: {
  fetch: (...args: TFetchInput) => Promise<TFetchResponse>;
  create: (data: TCreateInput) => Promise<TCreateResponse>;
  update: (input: any) => Promise<TUpdateResponse>;
  delete: (id: TDeleteId) => Promise<ActionDeleteResponse>;
}, fetchArgs: TFetchInput, options: { updateIdField: string }) {
  return {
    fetchFn: toFetchFn(actions.fetch, ...fetchArgs),
    create: toCreateFn(actions.create),
    update: toUpdateFn<TUpdateResponse, TUpdateId, TUpdateInput>(actions.update, options.updateIdField),
    delete: toDeleteFn(actions.delete),
  };
}
