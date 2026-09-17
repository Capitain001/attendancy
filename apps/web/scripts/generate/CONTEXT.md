# scripts/generate — Vue d'ensemble

| Script | Commande rapide | Rôle |
|--------|-----------------|------|
| `api/api.ts` | `npx tsx scripts/generate/api/api.ts <svc>` | Index AST `.api/` d'un service |
| `api/sync.ts` | `npx tsx scripts/generate/api/sync.ts` | Lance `api.ts` sur tous les services |
| `naming/check.ts` | `npx tsx scripts/generate/naming/check.ts [svc]` | Vérifie les conventions de nommage |
| `types/types.ts` | `npx tsx scripts/generate/types/types.ts <svc>` | Génère `types.ts` depuis les queries |
| `context/context.ts` | `npx tsx scripts/generate/context/context.ts` | Met à jour la section `## Fichiers` des `CLAUDE.md` de chaque service |
| `svg/index.js` | `node scripts/generate/svg/index.js` | Compile toutes les collections SVG → composants React |
| `path/comment.ts` | `npx tsx scripts/generate/path/comment.ts <dir>` | Ajoute l'en-tête de chemin `// src/...` dans les fichiers source |

Référence complète → `docs/cmd/generators.md`
