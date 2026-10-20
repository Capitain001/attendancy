import * as v from 'valibot'

/** Tout schéma d'objet Valibot dont on peut parcourir les entrées (ex. `v.partial(v.object({...}))`). */
type MetadataSchema = v.GenericSchema & { entries: Record<string, v.GenericSchema> }

/**
 * Lit des metadata Supabase brutes avec un schéma, clé par clé.
 * Une valeur invalide est ignorée (la clé retombe sur la valeur restrictive par défaut)
 * et loggée, sans effacer les autres clés. Le type de retour est déduit du schéma.
 *
 * @example
 * const access = readMetadata(AppMetadataSchema, user.app_metadata)    // → AppMetadata
 * const profile = readMetadata(UserMetadataSchema, user.user_metadata) // → UserMetadata
 */
export function readMetadata<TSchema extends MetadataSchema>(
  schema: TSchema,
  raw: Record<string, unknown> = {},
): v.InferOutput<TSchema> {
  const result: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(schema.entries)) {
    const parsed = v.safeParse(entry, raw[key])
    if (parsed.success) {
      if (parsed.output !== undefined) result[key] = parsed.output
    } else {
      console.error(`[metadata] clé "${key}" invalide, ignorée:`, parsed.issues[0]?.message)
    }
  }

  return result as v.InferOutput<TSchema>
}