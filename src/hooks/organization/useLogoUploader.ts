// hooks/organization/useLogoUploader.ts
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { updateOrganizationLogo } from "@/services/org";

const supabase = createClient();

export function useLogoUploader(organizationId: string) {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // Démarre à 0 (déterministe) pour éviter un mismatch d'hydratation : `Date.now()` à
  // l'init divergerait entre SSR et client (l'URL d'image embarque ?cache=<ts>). Le
  // cache-busting réel n'est nécessaire qu'après un upload, où setLastUpdate(Date.now()) s'applique.
  const [lastUpdate, setLastUpdate] = useState<number>(0); // Timestamp de mise à jour (0 = avant tout upload)

  const uploadLogo = async (file: File) => {
    if (!file) return;

    try {
      setUploading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Utilisateur non authentifié");
      }
      const filePath = `organizations/${organizationId}/logo.png`;

      // Upload avec upsert
      const { error: uploadError , data } = await supabase.storage
        .from("logo")
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
      const logo_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${data.path}`;
      
      // Mettre à jour l'état (sans le paramètre cache ici, il sera ajouté dans le composant)
      setLogoUrl(logo_url);

      // Mettre à jour l'organisation
      const result = await updateOrganizationLogo(organizationId, logo_url);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Logo de l'organisation mis à jour");

    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error("Erreur de téléversement du logo");
    } finally {
      setUploading(false);
    }
  };

  return {
    logoUrl,
    uploading,
    uploadLogo,
    lastUpdate, // Exposer le timestamp
  };
}
