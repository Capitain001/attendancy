"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast/custom-toast";
import { createPersonalCourseAction } from "@/services/personal/actions";
import type { CreatePersonalCourseInput } from "@/services/course/types";

const QK = ["personal-courses"] as const;

export function useCreatePersonalCourse() {
  const router = useRouter();

  const create = useMutation({
    mutationKey: [...QK, "create"],
    mutationFn: async (input: CreatePersonalCourseInput) => {
      const result = await createPersonalCourseAction(input);
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (course) => {
      toast.success("Cours créé avec succès");
      router.refresh();
      return course;
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de la création du cours");
    },
  });

  return { createCourse: create.mutateAsync, isPending: create.isPending };
}
