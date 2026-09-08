import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createMainFunctionsAction } from "@/services/function"

export function useCreateMainFunctions() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await createMainFunctionsAction()
      if ("error" in res && res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      // Ajuste la clé selon celle utilisée par useFonctions
      queryClient.invalidateQueries({ queryKey: ["functions"] })
    },
  })

  return {
    createMainFunctions: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error?.message ?? null,
    data: mutation.data ?? null,
  }
}