//packages\auth\src\useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import type { UserInfo } from "@attendancy/types";
import { useAuth } from "./AuthProvider";
import { api } from "./api";

export function useCurrentUser() {
  const auth = useAuth();
  const isSignedIn = auth?.status === "signed-in";
  const userId = isSignedIn ? auth.session.user.id : null;

  return useQuery({
    queryKey: ["currentUser", userId],
    queryFn: async (): Promise<UserInfo | null> => {
      const res = await api.getCurrentUserAction();
      if ("error" in res && res.error) {
        throw new Error(res.error);
      }
      return (res.data as UserInfo) ?? null;
    },
    enabled: isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
