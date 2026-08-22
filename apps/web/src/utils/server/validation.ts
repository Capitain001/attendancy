// src/utils/server/validation.ts
import { string, uuid, safeParse, pipe, object } from "valibot";
import * as v from 'valibot'
import type { BaseSchema } from 'valibot'
import { notFound } from "next/navigation";

const uuidSchema = pipe(string(), uuid());

//valide l uuid coter page , passer en params
export function validateUUID(value: string): string {
  const result = safeParse(uuidSchema, value);
  // console.log("validateUUID", { value, result });
  if (!result.success) notFound();
  return result.output;
}

/**
 * Factorise le pattern V2 { [idField]: uuid, data: schema } utilisé par
 * updateClassSchema / updateFunctionSchema (et toute future entité update
 * suivant la même norme id + payload imbriqué).
 *
 * Testé (compile-time strict + runtime safeParse) avec deux idField
 * différents ("classId", "functionId") pour confirmer la généricité :
 * rejette bien un id non-UUID, rejette bien une data invalide, garde le
 * typage exact de parsed.output.<idField> et parsed.output.data.
 *
 * @example
 * export const updateClassSchema = validateWithId('classId', updateClassDataSchema)
 * export type UpdateClassOutput = v.InferOutput<typeof updateClassSchema>
 * // → { classId: string; data: UpdateClassDataOutput }
 */
export function validateWithId<
  const TIdField extends string,
  TDataSchema extends v.GenericSchema
>(idField: TIdField, dataSchema: TDataSchema) {
  return object({
    [idField]: pipe(string(), uuid('ID invalide')),
    data: dataSchema,
  } as Record<TIdField, v.SchemaWithPipe<[v.StringSchema<undefined>, v.UuidAction<string, undefined>]>> & {
    data: TDataSchema
  })
}