# scripts/generate — Vue d'ensemble

| Script | Commande rapide | Rôle |
|--------|-----------------|------|
| `api/api.ts` | `npx tsx scripts/generate/api/api.ts <svc>` | Index AST `.api/` d'un service |
| `api/sync.ts` | `npx tsx scripts/generate/api/sync.ts` | Lance `api.ts` sur tous les services |
| `naming/check.ts` | `npx tsx scripts/generate/naming/check.ts [svc]` | Vérifie les conventions de nommage |
| `types/types.ts` | `npx tsx scripts/generate/types/types.ts <svc>` | Génère `types.ts` depuis les queries |
| `icons.js` | `node scripts/generate/icons.js` | Compile SVG → composants React `Icon*` |
| `svg.js` | `node scripts/generate/svg.js` | Compile collections SVG (resource, illustration…) |

Référence complète → `docs/cmd/generators.md`
