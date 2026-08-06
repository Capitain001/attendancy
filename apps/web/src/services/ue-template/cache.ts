// Pas d'import depuis @/cache/server/key — évite le cycle key.ts ↔ cache.ts.
// Format du tag : "ue-template-import:<orgId>" (identique à key("ue-template-import")(orgId)).
export const UE_TEMPLATE_GRAPH = {
  UE_TEMPLATE_IMPORTED:      (orgId: string) => [`ue-template-import:${orgId}`],
  UE_TEMPLATE_IMPORT_DELETED:(orgId: string) => [`ue-template-import:${orgId}`],
} as const
