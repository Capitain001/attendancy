"use client";
import { createClient } from "@/utils/supabase/client";

export const useLogoUpload = () => {
const supabase = createClient();

  const uploadLogo = async (organizationId: string, logoFile: File) => {
    // Utiliser l'ID de l'organisation pour le chemin du fichier
    const filePath = `organizations/${organizationId}/logo.png`;

    const { data, error } = await supabase.storage
      .from("logos")
      .upload(filePath, logoFile, {
        contentType: "image/png",
        upsert: true,
      });

    if (error)
      throw new Error(`Erreur lors de l'upload du logo: ${error.message}`);

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${data.path}`;
  };

  return {
    uploadLogo,
  };
};
