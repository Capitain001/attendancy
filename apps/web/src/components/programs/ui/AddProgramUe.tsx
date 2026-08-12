//src/components/programs/ui/AddProgramUe.tsx
"use client";

import { useState } from "react";
import type { CreateUeData } from "@/services/ue/database";
import type { OrgUEDTO } from "@/services/ue/types";
import { ProgramUeForm } from "./ProgramUeForm";
import { ProgramUeAction } from "./ProgramUeAction";
import SelectUe from "./SelectUe";

interface AddProgramUeProps {
  departments: { id: string; name: string }[];
  availableUes: OrgUEDTO;
  onCreate: (data: CreateUeData) => Promise<void>;
  onAttach: (ueId: string) => Promise<void>;
}

export function AddProgramUe({ departments, availableUes, onCreate, onAttach }: AddProgramUeProps) {
  // 🔹 Form state
  const [form, setForm] = useState<CreateUeData>({
    name: "",
    code: "",
    departmentId: "",
    description: "",
    imageUrl: "",
  });

  // 🔹 Selected UE pour le SelectUe
  const [selectedUeId, setSelectedUeId] = useState<string>("");

  // 🔹 Quand on sélectionne une UE dans le SelectUe
  const handleSelectUE = (ueId: string) => {
    setSelectedUeId(ueId);

    const selected = availableUes.find((ue) => ue.id === ueId);
    console.log("Selected UE :", selected);
    if (!selected) return;

    setForm({
      name: selected.name,
      code: selected.code ?? "",
      departmentId: selected.departmentId ?? "",
      description: selected.description ?? "",
      imageUrl: selected.imageUrl ?? "",
    });
  };

  // 🔹 Soumission du form
  const handleSubmit = async () => {
    if (!form.name || !form.departmentId) return;
    await onCreate(form);

    // Réinitialisation
    setForm({
      name: "",
      code: "",
      departmentId: "",
      description: "",
      imageUrl: "",
    });
    setSelectedUeId("");
  };

  const isSubmitDisabled = !form.name || !form.departmentId;

  return (
    <div className="flex items-center gap-2 rounded p-2 bg-muted/40 min-w-max">
      {/* 🔹 SelectUe contrôlé */}

      {/* 🔹 Formulaire */}
      <ProgramUeForm
        initialValues={form}
        departments={departments}
        onChange={(updated) => setForm((prev) => ({ ...prev, ...updated }))}
      />

      {/* 🔹 Bouton submit */} 
      <ProgramUeAction
        onSubmit={handleSubmit}
        loading={false}
        disabled={isSubmitDisabled}
        onAttach={async () => {
          if (!selectedUeId) return;
          await onAttach(selectedUeId);
        }}
      />

      <SelectUe
        ues={availableUes}
        value={selectedUeId}
        onChange={handleSelectUE}
        placeholder="---"
        className="w-fit px-2"
      />
    </div>
  );
}
