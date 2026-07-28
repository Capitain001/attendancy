"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createOrgAction } from "@/services/org";
import { createOrganizationSchema } from "@/services/org";
import { useLogoUpload } from "./useLogoUpload";
import { toast } from "sonner";
import * as v from "valibot";

type CreateOrganizationFormData = v.InferInput<typeof createOrganizationSchema>;

export function useCreateOrganization() {
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const router = useRouter();
  const { uploadLogo } = useLogoUpload();

  const form = useForm<CreateOrganizationFormData>({
    resolver: valibotResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationFormData) => {
      // Nettoyer les données vides
      const name = data.name.trim()
      const cleanData = {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50),
        email: data.email?.trim() || undefined,
      };

      const result = await createOrgAction(cleanData);

      if ('error' in result) {
        throw new Error(result.error || "Erreur lors de la création de l'organisation");
      }

      return result.data;
    },
    onSuccess: (organization) => {
      toast.success("Organisation créée avec succès");
      form.reset();
      setSelectedLogoUrl(null);
      setSelectedLogoFile(null);
      router.push(organization?.slug ? `/${organization.slug}/direction` : "/login");
    },
    onError: (error) => {
      console.error("Erreur création organisation:", error);
      toast.error(error.message || "Une erreur inattendue s'est produite");
    },
  });

  const onSubmit = (data: CreateOrganizationFormData) => {
    createOrganizationMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setSelectedLogoUrl(null);
    setSelectedLogoFile(null);
  };

  // Fonction pour gérer la sélection d'un fichier logo
  const handleLogoFileChange = (file: File | null) => {
    if (file) {
      setSelectedLogoFile(file);
      // Créer une URL de prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setSelectedLogoUrl(previewUrl);
    } else {
      setSelectedLogoFile(null);
      setSelectedLogoUrl(null);
    }
  };

  // Fonction pour uploader un logo si nécessaire
  const handleLogoUpload = async (organizationId: string, logoFile: File) => {
    try {
      const logoUrl = await uploadLogo(organizationId, logoFile);
      return logoUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload du logo:", error);
      throw error;
    }
  };

  return {
    // État du formulaire
    form,
    isLoading: createOrganizationMutation.isPending,
    selectedLogoUrl,
    selectedLogoFile,
    
    // Actions
    onSubmit,
    setSelectedLogoUrl,
    resetForm,
    handleLogoUpload,
    handleLogoFileChange,
  };
}
