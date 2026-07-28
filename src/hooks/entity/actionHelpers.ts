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
 * - update: (id, data) => Promise<T>
 * - delete: (id) => Promise<void>
 */

// Convention V2 : { data: T } | { error: string }
export type ActionResponse<T> = { data: T } | { error: string };
export type ActionArrayResponse<T> = { data: T[] } | { error: string };
export type ActionSuccessResponse = { success: boolean; error?: string };

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

export function toUpdateFn<TId, TInput, TResponse extends ActionResponse<any>>(
  action: (id: TId, data: TInput) => Promise<TResponse>
): (id: TId, data: TInput) => Promise<ExtractData<TResponse>> {
  return async (id: TId, data: TInput) => {
    const response = await action(id, data);
    if ('error' in response) throw new Error(response.error);
    return (response as { data: ExtractData<TResponse> }).data;
  };
}

/**
 * Convertit une action qui retourne { success: boolean, error?: string }
 * en fonction (id) => Promise<void>
 * 
 * @example
 * const delete = toDeleteFn(removeCourseAction);
 */
export function toDeleteFn<TId>(
  action: (id: TId) => Promise<ActionSuccessResponse>
): (id: TId) => Promise<void> {
  return async (id: TId) => {
    const response = await action(id);
    if (!response.success || response.error) {
      throw new Error(response.error || "Erreur lors de la suppression");
    }
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
 */
export function createActionWrappers<
  TFetchInput extends any[],
  TCreateInput,
  TUpdateId,
  TUpdateInput,
  TDeleteId,
  TFetchResponse extends ActionArrayResponse<any>,
  TCreateResponse extends ActionResponse<any>,
  TUpdateResponse extends ActionResponse<any>,
>(actions: {
  fetch: (...args: TFetchInput) => Promise<TFetchResponse>;
  create: (data: TCreateInput) => Promise<TCreateResponse>;
  update: (id: TUpdateId, data: TUpdateInput) => Promise<TUpdateResponse>;
  delete: (id: TDeleteId) => Promise<ActionSuccessResponse>;
}, fetchArgs: TFetchInput) {
  return {
    fetchFn: toFetchFn(actions.fetch, ...fetchArgs),
    create: toCreateFn(actions.create),
    update: toUpdateFn(actions.update),
    delete: toDeleteFn(actions.delete),
  };
}

