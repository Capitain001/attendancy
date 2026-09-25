// hooks/entity/useCrudEntity.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEntity } from "./useEntity";

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

  /**
   * Convertit ce que l'UI a envoyé (CreateInput ou UpdateInput — la forme
   * "écriture" du formulaire) en un patch partiel de l'entité T (la forme
   * "lecture"), AVANT le merge avec le retour serveur.
   *
   * Pourquoi c'est nécessaire : CreateInput/UpdateInput n'ont aucune raison
   * de partager la forme exacte de T (un champ groupé côté formulaire qui se
   * décompose en plusieurs colonnes, ou un champ dérivé d'un autre plutôt que
   * saisi directement). Sans ce mapper, les variables brutes sont fusionnées
   * telles quelles dans le cache (`{...variables, ...serverResponse}`) : si
   * le serveur ne renvoie qu'un sous-ensemble de champs (cas normal et
   * documenté ci-dessus), les champs "écriture" incompatibles polluent le
   * cache et les champs "lecture" qu'ils étaient censés représenter restent
   * absents ou périmés — jusqu'au prochain refetch complet.
   *
   * Optionnel : si omis, comportement inchangé (merge des variables brutes,
   * valable quand CreateInput/UpdateInput sont déjà structurellement des
   * Partial<T>, ce qui reste le cas par défaut pour beaucoup d'entités —
   * n'ajoutez ce mapper que lorsque ce n'est plus vrai).
   *
   * Écrire ce mapper en réutilisant la fonction qui produit déjà les colonnes
   * côté DB (ex: `resolveXFields` du service), plutôt qu'en dupliquant la
   * traduction : les deux DOIVENT rester en phase, ou le cache optimiste et
   * l'écriture réelle divergent silencieusement.
   *
   * Premier usage : services/teacher-unavailability (toUnavailabilityEntityPatch,
   * qui réutilise resolveUnavailabilityFields). Détail du raisonnement et du
   * bug que ça corrige : docs/patterns/toEntityPatch.md
   */
  toEntityPatch?: (data: CreateInput | UpdateInput) => Partial<T>;

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

  // useEntity retourne toujours applyPayload (voir useEntity.ts) : plus besoin
  // du cast manuel qui compensait ici l'ancien overload mal résolu par TS
  // dès que revalidateMode était construit dynamiquement.
  const entity = useEntity({
    entityName,
    fetchFn,
    revalidateMode: crud ? "patch" : undefined, // Active applyPayload seulement si CRUD
    ...entityOptions
  });

  // 🔄 CREATE Mutation
  const createMutation = useMutation({
    // ✅ crud!.create! (et non crud?.create!) : cohérence avec le fix
    // appliqué sur update — évite de dépendre du comportement d'optional
    // chaining sur une référence de fonction plutôt qu'un appel direct.
      mutationFn: (data: CreateInput) => crud!.create!(data),
    // `variables` ajouté : nécessaire pour dériver le patch de cache via
    // `toEntityPatch` à partir de ce que l'UI a réellement envoyé.
    onSuccess: (newItem, variables) => {
      // ✅ Réutilise applyPayload (déjà branché sur la bonne queryKey,
      // [entityName, initialParams]) au lieu de réécrire à la main un
      // setQueryData([entityName]) qui ratait le cache réel dès que
      // initialParams était utilisé.
      // applyPayload!: garanti défini ici, car `create` n'est exposé
      // plus bas que si crud.create existe, ce qui implique
      // revalidateMode === "patch" au moment du render.
      //
      // Ordre de priorité croissante (chaque couche peut compléter/écraser
      // la précédente) :
      //   1. createDefaults : valeurs par défaut génériques (ex: compteurs)
      //   2. toEntityPatch(variables) : ce que l'UI vient d'envoyer, déjà
      //      mappé vers la forme T (ex: timeRange -> startTime/endTime)
      //   3. newItem : retour serveur, source de vérité si présente
      // Cast via `unknown` pour la même raison que sur update : T n'est
      // connu ici que par sa contrainte `{ id: string }`, TS ne peut pas
      // prouver le recouvrement structurel même s'il est réel.
      entity.applyPayload!({
        type: "INSERT",
        record: {
          ...(crud?.createDefaults ?? {}),
          ...(crud?.toEntityPatch?.(variables) ?? {}),
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
      //   1. item existant en cache (source de départ, via merge
      //      superficiel fait par applyPayload lui-même)
      //   2. toEntityPatch(variables.data) si fourni, sinon variables.data
      //      brut — reflète immédiatement le changement voulu, même si le
      //      serveur ne renvoie que { id }. `toEntityPatch` mappe la forme
      //      "écriture" (ex: timeRange) vers la forme "lecture" (T) pour
      //      que ce reflet immédiat soit structurellement correct plutôt
      //      que de poser des champs qui n'existent pas sur T.
      //   3. `updatedItem` retourné par le serveur (source de vérité si
      //      des champs sont présents — écrase le patch au besoin, ex:
      //      valeur recalculée/validée côté serveur différente de celle
      //      envoyée)
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
          ...(crud?.toEntityPatch?.(variables.data) ?? variables.data),
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
     mutationFn: (id: string) => crud!.delete!(id),
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