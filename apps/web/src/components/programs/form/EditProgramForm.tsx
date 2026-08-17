"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProgramForm } from "@/components/programs/form/ProgramForm";
import { updateProgramAction } from "@/services/program/actions";
import type { ProgramDto } from "@/services/program/types";

interface EditProgramFormProps {
  program: ProgramDto;
  slug: string;
}

export function EditProgramForm({ program, slug }: EditProgramFormProps) {
  const router = useRouter();

  const handleSubmit = async (data: {
    name: string;
    description?: string | null;
  }) => {
    try {
      const res = await updateProgramAction({
        programId: program.id,
        data: {
          name: data.name,
          description: data.description ?? undefined,
        },
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Programme modifié avec succès");
      router.push(`/${slug}/direction/program`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    }
  };

  return (
    <ProgramForm
      program={program}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/${slug}/direction/program`)}
    />
  );
}
