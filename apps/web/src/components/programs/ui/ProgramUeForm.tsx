"use client";

import { useState, useEffect } from "react";
import type { CreateUeData, UpdateUEData } from "@/services/ue/database";
import { diff } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProgramUeFormProps {
  initialValues: CreateUeData | UpdateUEData;
  departments: { id: string; name: string }[];
  onChange?: (changedData: Partial<CreateUeData | UpdateUEData>) => void;
}

export function ProgramUeForm({ initialValues, departments, onChange }: ProgramUeFormProps) {
  const [form, setForm] = useState(initialValues);

  // 🔹 Sync form state with initialValues prop changes
  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...form, [field]: value };
    setForm(updated);

    // Only send changed data to parent
    const changedData = diff(updated, initialValues);
    onChange?.(changedData);
  };

  const ueStyle = "border-0 px-1 md:w-full md:px-2 rounded-none border-r-1 dark:bg-transparent shadow-none ";

  return (
    <>
      <Input
        className={`w-48 md:w-72 ${ueStyle}`}
        placeholder="Nom UE"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <Input
        className={`w-24 md:w-32 ${ueStyle} font-mono`}
        placeholder="Code"
        value={form.code || ""}
        onChange={(e) => handleChange("code", e.target.value)}
      />

      <Select
        value={form.departmentId || undefined}
        onValueChange={(val) => handleChange("departmentId", val)}
      >
        <SelectTrigger
          className={`w-44 h-9 ${ueStyle} focus:ring-0`}
        >
          <SelectValue placeholder="Département" />
        </SelectTrigger>

        <SelectContent>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className={`w-48 md:w-full ${ueStyle}`}
        placeholder="Description"
        value={form.description || ""}
        onChange={(e) =>
          handleChange("description", e.target.value)
        }
      />
    </>

  );
}
