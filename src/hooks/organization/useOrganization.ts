"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganizationBySlug } from "@/services/organization";

interface UseOrganizationProps {
  slug: string;
}

export function useOrganization({ slug }: UseOrganizationProps) {
  const {
    data: organization,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["organization", slug],
    queryFn: () => getOrganizationBySlug(slug),
    enabled: !!slug,
  });

  return {
    organization: organization?.organization,
    isLoading,
    error,
    refetch,
  };
}
