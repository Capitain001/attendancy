// Délègue au service function/ (propriétaire du modèle Function).
// La query est cachée via CACHE.FUNCTION(orgId) dans function/database/function.queries.ts.
import { getFunctionsByNames } from '@/services/function/database'

export async function checkFunctionsExist(
  functionNames: string[],
  orgId: string
): Promise<{ valid: string[]; invalid: string[] }> {
  if (functionNames.length === 0) return { valid: [], invalid: [] }

  const found = await getFunctionsByNames(functionNames, orgId)
  const validSet = new Set(found.map((f) => f.name))

  return functionNames.reduce(
    (acc, name) => {
      if (validSet.has(name)) acc.valid.push(name)
      else acc.invalid.push(name)
      return acc
    },
    { valid: [] as string[], invalid: [] as string[] }
  )
}
