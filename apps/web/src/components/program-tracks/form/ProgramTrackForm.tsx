"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ProgramTrackDto } from "@/services/program-track/types";
import type { UpdateProgramTrackData } from "@/services/program-track/database";
import { diff } from "@/lib/utils";



interface ProgramTrackFormProps {
  programTrack?: ProgramTrackDto;
  departments: Array<{ id: string; name: string }>;
  onSubmit: (data: UpdateProgramTrackData) => Promise<void>;
  onDelete?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProgramTrackForm({
  programTrack,
  departments,
  onSubmit,
  onDelete,
  onCancel,
  isLoading = false,
}: ProgramTrackFormProps) {
  const [name, setName] = useState(programTrack?.name ?? "");
  const [departmentId, setDepartmentId] = useState(
    programTrack?.department?.id ?? ""
  );

  const data = diff<UpdateProgramTrackData>(
    { name, departmentId },
    programTrack
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du programme <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Informatique"
          required
        />
      </div>

      {/* Département */}
      <div className="space-y-2">
        <Label htmlFor="departmentId">Département</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger id="departmentId">
            <SelectValue placeholder="Sélectionner un département" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dep) => (
              <SelectItem key={dep.id} value={dep.id}>
                {dep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        {programTrack && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
          >
            Supprimer
          </Button>
        )}

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "En cours..." : programTrack ? "Modifier" : "Créer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
