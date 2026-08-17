// // src/hooks/data/userFunctions/useUserFunctions.ts
// "use client";

// import { useCallback } from "react";
// import { useMutation } from "@tanstack/react-query";
// import { toast } from "sonner";
// import { useEntity } from "@/hooks/entity/useEntity";
// import {
//   assignFunctionAction,
//   getUserFunctionsAction,
//   getUsersByFunctionAction,
//   removeFunctionAction,
// } from "@/services/fonctions/user";
// import type { AssignFunctionInput } from "@/services/fonctions/user/validation";
// import type { UserFunctionAssignment } from "@/services/fonctions/user/types";

// /**
//  * Hook pour gérer les attributions de fonctions aux utilisateurs
//  *
//  * @example
//  * ```tsx
//  * // Charger les fonctions d'un utilisateur
//  * const { data, assign, remove, loading } = useUserFunctions({ userId: "user-123" });
//  *
//  * // Assigner une fonction
//  * await assign({ userId: "user-123", functionId: "function-456" });
//  *
//  * // Retirer une fonction
//  * await remove({ userId: "user-123", functionId: "function-456" });
//  *
//  * // Charger les utilisateurs pour une fonction donnée
//  * const byFunction = useUserFunctions({ functionId: "function-456" });
//  * ```
//  */
// export function useUserFunctions({
//   userId,
//   functionId,
//   staleTime,
//   enabled = true,
// }: {
//   userId?: string;
//   functionId?: string;
//   staleTime?: number;
//   enabled?: boolean;
// }) {
//   // Sélectionne la source de données (fonctions d'un user ou users d'une fonction)
//   const fetchFn = useCallback(async () => {
//     if (!userId && !functionId) {
//       throw new Error("userId ou functionId est requis");
//     }

//     const response = userId
//       ? await getUserFunctionsAction(userId)
//       : await getUsersByFunctionAction(functionId!);

//     if (response.error) {
//       throw new Error(response.error);
//     }
//     return response.data || [];
//   }, [userId, functionId]);

//   const entityName = userId ? `user-functions-${userId}` : `function-users-${functionId}`;

//   const entity = useEntity<UserFunctionAssignment>({
//     entityName,
//     fetchFn,
//     enabled,
//     staleTime,
//     revalidateMode: "invalidate",
//   });

//   const assignMutation = useMutation({
//     mutationFn: (data: AssignFunctionInput) => assignFunctionAction(data),
//     onSuccess: (res) => {
//       if (!res.success) throw new Error(res.error || "Assignation échouée");
//       toast.success("Fonction assignée");
//       entity.refetch();
//     },
//     onError: (error: Error) => toast.error(error.message || "Erreur d'assignation"),
//   });

//   const removeMutation = useMutation({
//     mutationFn: (data: AssignFunctionInput) => removeFunctionAction(data),
//     onSuccess: (res) => {
//       if (!res.success) throw new Error(res.error || "Suppression échouée");
//       toast.success("Fonction retirée");
//       entity.refetch();
//     },
//     onError: (error: Error) => toast.error(error.message || "Erreur de suppression"),
//   });

//   return {
//     ...entity,
//     assign: assignMutation.mutateAsync,
//     isAssigning: assignMutation.isPending,
//     remove: removeMutation.mutateAsync,
//     isRemoving: removeMutation.isPending,
//   };
// }

