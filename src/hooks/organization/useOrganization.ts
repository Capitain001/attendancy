"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganizationBySlugAction } from "@/services/organization";

interface UseOrganizationProps {
  slug: string;
}

export function useOrganization({ slug }: UseOrganizationProps) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["organization", slug],
    queryFn: () => getOrganizationBySlugAction(slug),
    enabled: !!slug,
  });

  return {
    organization: data?.data ?? null,
    isLoading,
    error: error ?? data?.error,
    refetch,
  };
}