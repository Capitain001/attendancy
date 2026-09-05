"use client";

import { useState, useMemo } from "react";
import { ProgramUeForm } from "./ProgramUeForm";
import { ProgramUeAction } from "./ProgramUeAction";
import type { UpdateUEData } from "@/services/ue/database";
import type { ProgramUEsItem } from "@/services/ue/types";

interface ProgramUeProps {
  ue: ProgramUEsItem["ue"];
  departments: { id: string; name: string }[];
  loading: boolean;
  onEdit?: (ueId: string, data: Partial<UpdateUEData>) => Promise<void>;
  onDetach?: (ueId: string) => Promise<void>;
  onDelete?: (ueId: string) => Promise<void>;
}

export function ProgramUe({ ue, departments, loading, onEdit, onDelete, onDetach }: ProgramUeProps) {
  const [form, setForm] = useState<Partial<UpdateUEData>>({
    name: ue.name,
    code: ue.code || "",
    description: ue.description || "",
    imageUrl: ue.imageUrl || "",
    departmentId: ue.departmentId || "",
  });
  const [changedData, setChangedData] = useState<Partial<UpdateUEData>>({});
  const [isOpen, setIsOpen] = useState(false); // toggle pour les UE courses

  const handleSubmit = async () => {
    if (Object.keys(changedData).length === 0) return;
    await onEdit?.(ue.id, changedData);
  };

  const hasChanges = Object.keys(changedData).length > 0;

  const { totalCredits, totalDuration } = useMemo(() => {
    const totalCredits = ue.ueCourses?.reduce((sum, c) => sum + c.credits, 0) ?? 0;
    const totalDuration = ue.ueCourses?.reduce((sum, c) => sum + c.duration, 0) ?? 0;
    return { totalCredits, totalDuration };
  }, [ue.ueCourses]);

  return (
    <div className="flex flex-col min-w-max w-full">

      {/* Ligne principale : Form + Actions + Toggle */}
      <div className="flex gap-2 justify-between overflow-x-auto border-b border-dashed p-2 md:w-full items-center">
        <ProgramUeForm
          initialValues={form}
          departments={departments}
          onChange={(updated) => setChangedData(updated)}
        />

        <div className="flex items-center gap-2">
          <ProgramUeAction
            loading={loading}
            disabled={!hasChanges}
            onSubmit={handleSubmit}
            onDetach={() => onDetach?.(ue.id)}
            onDelete={() => onDelete?.(ue.id)}
          />

          {/* Trigger pour déplier les UE courses */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-muted/40  transition-colors"
          >
            <span className={`block transition-transform  px-2 ${isOpen ? "rotate-180" : ""}`}>⌄</span>
          </button>
        </div>
      </div>

      {/* Contenu dépliable des UE courses */}
      {isOpen && (
        <div className="p-2  flex mb-2 flex-col max-w-4xl gap-1">
          {ue.ueCourses?.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-2 p-2 justify-between border-b border-l-4 border-l-primary/30 bg-muted/10 text-sm italic py-1"
            >
              <span className="font-bold text-primary">{course.name}</span>
              <span className="text-muted-foreground">{course.code}</span>
              <span className="ml-auto text-muted-foreground">{course.credits} crédits</span>
              <span className="text-muted-foreground">{course.duration}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}