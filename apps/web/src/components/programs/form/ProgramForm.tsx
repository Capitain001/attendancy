"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ProgramDto } from "@/services/program/types";
import type { CreateProgramInput } from "@/hooks/data/programs/usePrograms";

interface ProgramFormProps {
  program?: ProgramDto;
  onSubmit: (
    data: Pick<CreateProgramInput, "name" | "description">
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProgramForm({
  program,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProgramFormProps) {
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(
    program?.description ?? ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit({
      name,
      description: description || null,
    });
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description du programme"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "En cours..."
            : program
            ? "Modifier"
            : "Créer"}
        </Button>
      </div>
    </form>
  );
}
