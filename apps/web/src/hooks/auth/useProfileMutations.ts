"use client"

import { useMutation } from "@tanstack/react-query"
import { upsertUserProfile } from "@/modules/auth/profile/user"

interface ProfileData {
  firstName: string
  lastName: string
  sex: "MALE" | "FEMALE"
  dateOfBirth: string
  phone: string
  avatar_url: string
}

export function useProfileMutations() {
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      return upsertUserProfile(data)
    },
  })

  const submitProfile = async (payload: ProfileData) => {
    try {
      await profileMutation.mutateAsync(payload)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      throw error
    }
  }

  return {
    submitProfile,
    profileMutation,
  }
}
