## Hook `useTerms`

file: [useTerms.ts](./useTerms.ts)

**`src/hooks/data/term/useTerms.ts`** — Hook de gestion CRUD des semestres (`Term`) d'une classe :

- Basé sur `useCrudEntity` et les helpers `toFetchFn`, `toCreateFn`, `toUpdateFn`, `toDeleteFn` (convention **V2** : actions serveur au format `{ data } | { error }`).
- Action d'update structurée sous la norme V2 nested (`updateTermAction({ termId, data })`).
- Messages de toast en français.

---

### ⚠️ Structure de l'objet `data` (Attention aux appelants)

Contrairement à un `useQuery` standard qui retournerait un tableau `Term[]`, l'objet `data` retourné par `useTerms()` (via `useCrudEntity`) possède une structure normalisée à 2 éléments :

```typescript
data: {
  items: Term[],              // Liste ordonnée des semestres
  byId: Record<string, Term>  // Dictionnaire indexé par id (ex: data.byId["term-123"])
}
```

> **IMPORTANT :** `data` n'est **PAS** un tableau directement ! Pour itérer sur les semestres, il faut accéder à **`data.items`** (ou déstructurer `const { data: { items, byId } } = useTerms({ classId })`).

---

### Signature & Options

```typescript
export interface UseTermsOptions {
  classId: string;    // ID de la classe (obligatoire)
  staleTime?: number; // Temps avant re-fetch (en ms)
  enabled?: boolean;  // Active/désactive le fetch automatique
}
```

---

### Exemples d'utilisation

#### 1. Lecture et affichage des semestres

```tsx
import { useTerms } from "@/hooks/data";

function TermsList({ classId }: { classId: string }) {
  const { data, loading, error } = useTerms({ classId });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error.message}</div>;

  // Accès au tableau via data.items
  const terms = data.items;

  // Accès rapide par ID via data.byId
  // const specificTerm = data.byId["term-xyz"];

  return (
    <ul>
      {terms.map((term) => (
        <li key={term.id}>
          {term.name} (Ordre: {term.order})
        </li>
      ))}
    </ul>
  );
}
```

#### 2. Création, Modification & Suppression

```tsx
import { useTerms } from "@/hooks/data";

function TermManager({ classId }: { classId: string }) {
  const { create, update, delete: deleteTerm, isCreating, isUpdating, isDeleting } = useTerms({ classId });

  //  Créer un semestre
  const handleCreate = async () => {
    await create({
      classId,
      order: 1,
      name: "Semestre 1",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-01-31"),
    });
  };

  //  Modifier un semestre
  // Format: update({ id, data })
  const handleUpdate = async (termId: string) => {
    await update({
      id: termId,
      data: {
        name: "Semestre 1 — Modifié",
      },
    });
  };

  // ❌ Supprimer un semestre
  const handleDelete = async (termId: string) => {
    await deleteTerm(termId);
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        Ajouter Semestre
      </button>
    </div>
  );
}
```
