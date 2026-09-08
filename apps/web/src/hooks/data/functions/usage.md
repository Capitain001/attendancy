## Hook `useFonctions`

file: [useFonctions.ts](/src/hooks/data/fonctions/useFonctions.ts)

**`src/hooks/data/fonctions/useFonctions.ts`** — Hook suivant le même pattern que `useClasses` :

- Utilise `useCrudEntity` pour la gestion CRUD
- Utilise les helpers `toFetchFn`, `toCreateFn`, `toUpdateFn`, `toDeleteFn` (convention **V2** : actions serveur au format `{ data } | { error }`)
- Importe les actions depuis `@/services/function/actions`
- Types définis : `CreateFunctionInput` et `UpdateFunctionInput`
- Options : `isMain`, `staleTime`, `enabled`
- Messages de succès/erreur en français
- Export ajouté dans `src/hooks/data/index.ts`

### Détails d'implémentation à connaître

- **`update`** : `updateFunctionAction` attend l'id fusionné dans l'objet (`{ functionId, ...data }`), pas en paramètre séparé. `toUpdateFn(updateFunctionAction, "functionId")` gère ce mapping automatiquement — aucun générique explicite à préciser, aucun lambda à écrire.
- **`create` et `_count`** : `createFunctionAction` ne renvoie pas le champ `_count` (une fonction tout juste créée a toujours 0 utilisateur, pas besoin de le requêter côté serveur). Le hook fournit `createDefaults: { _count: { users: 0 } }` à `useCrudEntity` pour compléter ce champ dans le cache local. Si le serveur venait à renvoyer `_count` un jour, sa valeur primerait automatiquement sur le default.
- **`update` et champs partiels** : `updateFunctionAction` ne renvoie que les champs modifiés (+ `id`). Le cache local est mis à jour en fusionnant `existant → data envoyée par l'UI → retour serveur` (dans cet ordre de priorité), donc l'UI reflète le changement immédiatement même si le serveur ne renvoie rien de plus que l'id.
- **`delete`** est maintenant awaitable (`mutateAsync`), donc utilisable avec `await` + `try/catch` comme `create`/`update`.

### Utilisation :

```tsx
const { data, create, update, delete: deleteFunction, loading } = useFonctions();

// Créer une fonction
// _count.users est automatiquement à 0 dans le cache, pas besoin de le fournir
await create({ name: "Directeur", description: "Direction", isMain: true });

// Mettre à jour
// { id, data } — data peut être partiel (seuls les champs à changer)
await update({ id: "function-123", data: { name: "Directeur Général" } });

// Supprimer
await deleteFunction("function-123");
```

### Filtrer par type de fonction

```tsx
// Récupère uniquement les fonctions "principales"
const { data, loading } = useFonctions({ isMain: true });
```