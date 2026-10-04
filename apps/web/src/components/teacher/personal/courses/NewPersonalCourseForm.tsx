"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { personal } from "@/modules/personal/paths";
import { useCreatePersonalCourse } from "@/hooks/data/courses/useCreatePersonalCourse";

interface NewPersonalCourseFormProps {
  slug: string;
  classes: { id: string; name: string }[];
}

export function NewPersonalCourseForm({ slug, classes }: NewPersonalCourseFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const { createCourse, isPending } = useCreatePersonalCourse();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !classId) return;

    try {
      await createCourse({ name, classId });
      router.push(personal.courses(slug));
    } catch {
      // Erreur déjà toastée par le hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 sm:flex-row sm:items-end">
      <label className="grid flex-1 gap-1.5 text-xs font-medium text-foreground/60" htmlFor="new-course-name">
        Nom du cours
        <input
          id="new-course-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="Ex. Mathématiques"
          className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary/50"
        />
      </label>

      <label className="grid flex-1 gap-1.5 text-xs font-medium text-foreground/60" htmlFor="new-course-class">
        Classe
        <select
          id="new-course-class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          required
          className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
        >
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending || !name.trim() || !classId}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus aria-hidden="true" className="size-4" />
        {isPending ? "Création…" : "Créer le cours"}
      </button>
    </form>
  );
}
