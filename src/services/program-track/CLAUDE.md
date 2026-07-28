# Service : program-track

Gère la structure pédagogique : filières, maquettes, et composition des maquettes.
Modèles Prisma : `ProgramTrack`, `Program`, `ProgramUE`.

## Exception assumée — sous-entités structurelles

`Program` et `ProgramUE` sont des sous-entités de `ProgramTrack` dans ce service.
Justification : ils n'ont pas de page propre, et leurs mutations sont toujours en contexte
d'une filière. Les séparer créerait des services avec une seule mutation sans page dédiée.
**À réévaluer si** Program acquiert une page propre ou des mutations indépendantes.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/program-track.queries.ts` | `getProgramTracks` — liste avec compteurs |
| `database/program-track.mutations.ts` | `createProgramTrack` |
| `database/program.queries.ts` | `getProgramsByTrack` — maquettes + UEs par semestre |
| `database/program.mutations.ts` | `createProgram`, `addUEToProgram`, `removeUEFromProgram` |
| `cache.ts` | `PROGRAM_TRACK_GRAPH` — invalidation liste + détail par `programTrackId` |
| `validation.ts` | createProgramTrackSchema, createProgramSchema, addUEToProgramSchema |
| `actions/program-track.mutations.ts` | 4 actions DIRECTION-only |
| `actions/program-track.queries.ts` | `getProgramTracksAction`, `getProgramsByTrackAction` |

## Invariants

- @@unique([name, departmentId]) sur ProgramTrack
- @@unique([name, programTrackId]) sur Program
- @@unique([programId, ueId]) sur ProgramUE
- `Program.deletedAt` = soft delete — `where: { deletedAt: null }` dans les queries
- `removeUEFromProgram` : findFirst ownership check avant delete (ProgramUE sans orgId direct)
- Guard UE archivée (TODO) : vérifier `UE.deletedAt` avant `addUEToProgram` — nécessite appel vers `ue/` service

## Points d'extension (⚠)

- `updateProgramAction` si édition maquette nécessaire
- Guard UE archivée dans `addUEToProgram` : caller `getUEsAction` depuis l'UI avant soumission
- `reorderProgramUE` pour drag-and-drop des matières dans un semestre
