// hooks/user/useAvatarUploader.ts
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { updateAvatar } from "@/services/user";

const supabase = createClient();

export function useAvatarUploader() {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now()); // Timestamp de mise à jour

  const uploadAvatar = async (file: File) => {
    if (!file) return;

    try {
      setUploading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Utilisateur non authentifié");
      }

      const filePath = `${user.id}/avatar.png`;

      // Upload avec upsert
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Mettre à jour le timestamp
      const newTimestamp = Date.now();
      setLastUpdate(newTimestamp);

      // URL avec cache busting basé sur le timestamp
      const avatar_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
      
      // Mettre à jour l'état (sans le paramètre cache ici, il sera ajouté dans le composant)
      setAvatarUrl(avatar_url);

      // Mettre à jour le profil
      const result = await updateAvatar(avatar_url);

      if ('error' in result) {
        throw new Error(result.error);
      }

      toast.success("Photo de profil mise à jour");

    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error("Erreur de téléversement");
    } finally {
      setUploading(false);
    }
  };

  return {
    avatarUrl,
    uploading,
    uploadAvatar,
    lastUpdate, // Exposer le timestamp
  };
}