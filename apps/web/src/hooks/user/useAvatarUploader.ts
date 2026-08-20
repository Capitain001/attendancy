"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { updateAvatar } from "@/services/user";
import { AVATAR_BUCKET, getAvatarPath, getAvatarPublicUrl } from "@/lib/storage/avatar";

const supabase = createClient();

export function useAvatarUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const uploadAvatar = async (file: File) => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(false);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Utilisateur non authentifié");
      }

      const filePath = getAvatarPath(user.id);

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) {
        throw uploadErr;
      }

      const avatar_url = getAvatarPublicUrl(filePath);

      const result = await updateAvatar(avatar_url);

      if ("error" in result) {
        throw new Error(result.error);
      }

      setAvatarUrl(avatar_url);
      setLastUpdate(Date.now());

      // Force le re-render des Server Components de la route (dont le header)
      router.refresh();

      toast.success("Photo de profil mise à jour");

    } catch (error: any) {
      console.error("Erreur upload:", error);
      setUploadError(true);
      toast.error("Erreur de téléversement");
    } finally {
      setUploading(false);
    }
  };

  return {
    avatarUrl,
    uploading,
    uploadError,
    uploadAvatar,
    lastUpdate,
  };
}