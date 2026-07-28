

## Hook `useFonctions` 

file: [useFonctions.ts ](/src/hooks/data/fonctions/useFonctions.ts)

**`src/hooks/data/fonctions/useFonctions.ts`** — Hook suivant le même pattern que `useClasses` :

- Utilise `useCrudEntity` pour la gestion CRUD
- Utilise les helpers `toFetchFn`, `toCreateFn`, `toUpdateFn`, `toDeleteFn`
- Importe les actions depuis `@/services/fonctions/actions`
- Types définis : `CreateFunctionInput` et `UpdateFunctionInput`
- Options : `isMain`, `staleTime`, `enabled`
- Messages de succès/erreur en français
- Export ajouté dans `src/hooks/data/index.ts`

### Utilisation :

```tsx
const { data, create, update, delete: deleteFunction, loading } = useFonctions();

// Créer une fonction
await create({ name: "Directeur", description: "Direction", isMain: true });

// Mettre à jour
await update({ id: "function-123", data: { name: "Directeur Général" } });

// Supprimer
deleteFunction("function-123");
```

