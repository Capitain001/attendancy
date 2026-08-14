// hooks/entity/useCrudEntity.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEntity, BaseEntityResult, EntityResultWithCRUD } from "./useEntity";

export type FlexiblePartial<T> = {
  [P in keyof T]?: T[P] extends Date ? Date | string : T[P] extends Date | null ? Date | string | null : T[P];
};

interface CrudConfig<T, CreateInput = any, UpdateInput extends FlexiblePartial<T> = FlexiblePartial<T>> {
  // ✅ create peut ne retourner qu'un sous-ensemble de champs (+ id), au même
  // titre que update : un objet fraîchement créé n'a souvent pas besoin de
  // renvoyer les champs calculés/relationnels (ex: compteurs de relations)
  // puisque ce sont des valeurs connues par construction (ex: une entité qui
  // vient d'être créée a 0 relation liée). `createDefaults` fournit ces
  // valeurs par défaut ; le retour serveur reste toujours prioritaire dessus.
  create?: (data: CreateInput) => Promise<Partial<T> & { id: string }>;
  // Valeurs par défaut fusionnées AVANT le retour serveur pour compléter les
  // champs que `create` ne renvoie pas (ex: `{ _count: { users: 0 } }`).
  // Contrairement à `update`, il n'y a pas d'item existant en cache à
  // merger pour un create : sans ces defaults, les champs manquants
  // resteraient absents jusqu'au prochain refetch complet.
  createDefaults?: Partial<T>;
  // ✅ update prend désormais Partial<T> (et non un UpdateInput générique
  // libre) : la forme de `data` est garantie structurellement compatible
  // avec T. Fini le risque de champs fantômes (mauvais nom) ou de merge
  // silencieux avec un type incompatible — cf. exemple discuté : si le
  // formulaire UI a sa propre forme (ex: `instructor` au lieu de
  // `instructorEmail`), le mapping doit se faire AVANT d'appeler update,
  // de façon explicite, plutôt que d'être absorbé silencieusement ici.
  // update peut par ailleurs ne retourner qu'un sous-ensemble de champs
  // (+ id) : applyPayload("UPDATE") fait un merge superficiel avec
  // l'item existant, donc un retour partiel ne détruit rien en cache.
  update?: (id: string, data: UpdateInput) => Promise<Partial<T> & { id: string }>;
  delete?: (id: string) => Promise<void>;

  // Messages optionnels
  messages?: {
    create?: string;
    update?: string;
    delete?: string;
    error?: string; // Message d'erreur générique
  };
}

interface UseCrudEntityOptions<T, CreateInput = any, UpdateInput extends FlexiblePartial<T> = FlexiblePartial<T>> {
  entityName: string;
  fetchFn: () => Promise<T[]>;
  crud?: CrudConfig<T, CreateInput, UpdateInput>;

  // Options useEntity standard
  transformFn?: (items: T[]) => any;
  staleTime?: number;
  enabled?: boolean;
}

export function useCrudEntity<
  T extends { id: string },
  CreateInput = any,
  UpdateInput extends FlexiblePartial<T> = FlexiblePartial<T>
>(options: UseCrudEntityOptions<T, CreateInput, UpdateInput>) {
  const { entityName, fetchFn, crud, ...entityOptions } = options;

  // ✅ Utilise useEntity existant
  // NB TypeScript : `revalidateMode: crud ? "patch" : undefined` a pour type
  // inféré "patch" | undefined, ce qui ne matche PAS le premier overload de
  // useEntity (qui exige littéralement "patch" | "invalidate"). TS retombe
  // donc sur le second overload (BaseEntityResult, sans applyPayload), alors
  // qu'à l'exécution applyPayload EST bien présent dès que crud est défini.
  // On type donc le résultat manuellement au lieu de compter sur la
  // résolution d'overload sur une valeur ternaire.
  const entity = useEntity({
    entityName,
    fetchFn,
    revalidateMode: crud ? "patch" : undefined, // Active applyPayload seulement si CRUD
    ...entityOptions
  }) as BaseEntityResult<T> & Partial<Pick<EntityResultWithCRUD<T>, "applyPayload">>;

  // 🔄 CREATE Mutation
  const createMutation = useMutation({
    // ✅ crud!.create! (et non crud?.create!) : cohérence avec le fix
    // appliqué sur update — évite de dépendre du comportement d'optional
    // chaining sur une référence de fonction plutôt qu'un appel direct.
    mutationFn: crud!.create!,
    onSuccess: (newItem) => {
      // ✅ Réutilise applyPayload (déjà branché sur la bonne queryKey,
      // [entityName, initialParams]) au lieu de réécrire à la main un
      // setQueryData([entityName]) qui ratait le cache réel dès que
      // initialParams était utilisé.
      // applyPayload!: garanti défini ici, car `create` n'est exposé
      // plus bas que si crud.create existe, ce qui implique
      // revalidateMode === "patch" au moment du render.
      //
      // ✅ createDefaults comble les champs que le serveur ne renvoie pas
      // (ex: _count.users: 0 pour une entité neuve). Le retour serveur
      // (`newItem`) reste prioritaire s'il fournit malgré tout ces champs.
      // Cast via `unknown` pour la même raison que sur update : T n'est
      // connu ici que par sa contrainte `{ id: string }`, TS ne peut pas
      // prouver le recouvrement structurel même s'il est réel.
      entity.applyPayload!({
        type: "INSERT",
        record: {
          ...(crud?.createDefaults ?? {}),
          ...newItem,
        } as unknown as T,
      });

      const message = crud?.messages?.create;
      if (message) toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || crud?.messages?.error || "Erreur");
    }
  });

  // 🔄 UPDATE Mutation
  const updateMutation = useMutation({
    // ⚠️ `crud?.update!(id, data)` ne suffit pas : le `!` porte sur `update`
    // seul, pas sur l'appel — l'optional chaining `?.` court-circuite quand
    // même toute la chaîne (y compris l'appel de fonction) et TS garde donc
    // `undefined` dans le type de retour. On asserte `crud` lui-même :
    // à ce stade cette mutation n'est déclenchable que via `entity.update`,
    // qui n'est exposé plus bas que si `crud?.update` existe.
    mutationFn: ({ id, data }: { id: string; data: UpdateInput }) =>
      crud!.update!(id, data),
    onSuccess: (updatedItem, variables) => {
      // ✅ Flow voulu : l'UI envoie {id, data (nouvelles valeurs)} ; le
      // serveur confirme via id et peut renvoyer aussi peu que { id } seul,
      // ou plus s'il le souhaite (ex: champs recalculés côté serveur).
      // Le merge se fait en 3 couches, dans l'ordre de priorité croissante :
      //   1. item existant en cache (source de départ)
      //   2. `data` envoyée par l'UI (reflète immédiatement le changement
      //      voulu, même si le serveur ne renvoie que { id })
      //   3. `updatedItem` retourné par le serveur (source de vérité si
      //      des champs sont présents — écrase data au besoin, ex: valeur
      //      recalculée/validée côté serveur différente de celle envoyée)
      // Le cast passe par `unknown` : TS ne peut pas prouver le recouvrement
      // direct vers T ici, car T n'est connu dans ce générique que comme
      // `{ id: string }` (contrainte minimale). La compatibilité réelle est
      // déjà garantie en amont par `UpdateInput extends Partial<T>` sur la
      // signature du hook — ce `unknown` ne réintroduit donc pas le risque
      // qu'on vient d'éliminer, il contourne juste une limite d'inférence
      // de TS sur les génériques contraints.
      entity.applyPayload!({
        type: "UPDATE",
        record: {
          ...variables.data,
          ...updatedItem,
        } as unknown as T,
        old_record: undefined as any, // non utilisé en mode "patch"
      });

      const message = crud?.messages?.update;
      if (message) toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || crud?.messages?.error || "Erreur");
    }
  });

  // 🔄 DELETE Mutation
  const deleteMutation = useMutation({
    mutationFn: crud!.delete!,
    onSuccess: (_, id) => {
      entity.applyPayload!({ type: "DELETE", old_record: { id } as T });

      const message = crud?.messages?.delete;
      if (message) toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || crud?.messages?.error || "Erreur");
    }
  });

  // 🎯 Retourne TOUJOURS la structure useEntity + mutations si configurées
  return {
    // ✅ Données de base (toujours présentes)
    ...entity,

    // ✅ Mutations (seulement si configurées)
    ...(crud?.create && {
      create: createMutation.mutateAsync,
      isCreating: createMutation.isPending,
      createError: createMutation.error
    }),

    ...(crud?.update && {
      update: updateMutation.mutateAsync,
      isUpdating: updateMutation.isPending,
      updateError: updateMutation.error
    }),

    ...(crud?.delete && {
      // ✅ mutateAsync (avant: .mutate) pour rester awaitable et cohérent
      // avec create/update, qui exposent tous les deux mutateAsync.
      delete: deleteMutation.mutateAsync,
      isDeleting: deleteMutation.isPending,
      deleteError: deleteMutation.error
    })
  };
}