"use client"
import { Organization, UserInfo } from "@/services/user";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
// import { Organization, UserInfo } from "@/types/user";


interface OrganizationState {
  organization: Organization | null;
  user: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  setOrganization: (org: Organization | null) => void;
  setUser: (user: UserInfo | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organization: null,
      user: null,
      isLoading: false,
      error: null,
      setOrganization: (org) => set({ organization: org }),
      setUser: (user) => set({ user: user }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
      reset: () =>
        set({ organization: null, user: null, error: null, isLoading: false }),
    }),
    {
      name: "organization-storage",
      storage: createJSONStorage(() => sessionStorage), // Utiliser sessionStorage au lieu de localStorage
    },
  ),
);
