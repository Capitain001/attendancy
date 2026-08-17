## Hook `useUEs`

file: [useUEs.ts](/src/hooks/data/ue/useUEs.ts)

**`src/hooks/data/ue/useUEs.ts`** — Hook de gestion CRUD des Unités d'Enseignement (UE) :

- Utilise `useCrudEntity` pour la gestion des mutations optimistes et du cache
- Utilise les helpers `toFetchFn`, `toCreateFn`, `toUpdateFn`, `toDeleteFn` (convention **V2** : `{ data } | { error }`)
- Importe les actions depuis le barrel file `@/services/ue`
- Typage strict via les schémas Valibot (`CreateUEInput`) et Prisma (`UpdateUEData`, via la méthode `Partial` excluant `orgId`)
- Options : `departmentId` pour filtrer par département, `staleTime`, `enabled`
- Messages de succès/erreur en français

### Détails d'implémentation à connaître

- **`create`** : `createUEAction` est mappé via Valibot (`CreateUEInput` ne contenant pas de clause `nullable`, il attend strictement `undefined` pour les champs optionnels manquants). Le hook expose un type `CreateUEInput` complet qui attend `{ data: ServiceCreateInput, programId?: string, ... }` parfaitement aligné avec l'action côté serveur.
- **`update`** : `updateUEAction` attend un payload partiel issu de Prisma (`UpdateUEData`). Les champs optionnels doivent explicitement utiliser `null` et non `undefined` pour être vidés en base. Le wrapper `toUpdateFn(updateUEAction, "ueId")` s'attend à être appelé par `useCrudEntity` sous le format `{ id, data }`.
- **`delete` (archive)** : `archiveUEAction` fait un "soft delete" (archivage) en base de données. Le hook expose cette mutation sous la clé standard `delete` renvoyée par `useCrudEntity`.

### Utilisation :

```tsx
const { data, create, update, delete: archive, isLoading } = useUEs();

// Créer une UE
await create({ 
  data: { 
    name: "Développement Web", 
    code: "DEV101", // ou undefined si absent
    departmentId: undefined 
  } 
});

// Mettre à jour
// { id, data } — data peut être partiel. Utiliser `null` pour vider un champ.
await update({ 
  id: "ue-123", 
  data: { 
    name: "Développement Web Avancé",
    description: null // Utiliser null (pas undefined) pour vider
  } 
});

// Archiver (Soft Delete)
await archive("ue-123");
```

### Filtrer par département

```tsx
// Récupère uniquement les UEs d'un département spécifique
const { data: uesInfo } = useUEs({ departmentId: "dept-456" });
```
