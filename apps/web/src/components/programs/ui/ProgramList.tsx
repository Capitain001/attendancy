"use client";

import { Button } from "@/components/ui/button";
import type { ProgramDto } from "@/services/program/types";

interface ProgramListProps {
  programs: ProgramDto[];
  loading?: boolean;
  onEdit: (program: ProgramDto) => void;
  onDelete: (id: string) => void;
}

export function ProgramList({
  programs,
  loading,
  onEdit,
  onDelete,
}: ProgramListProps) {
  if (loading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (programs.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucun programme trouvé
      </p>
    );
  }

  return (
    <div className="border rounded-md">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left">Nom</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((program) => (
            <tr
              key={program.id}
              className="border-b last:border-b-0"
            >
              <td className="px-4 py-2 font-medium">
                {program.name}
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {program.description || "—"}
              </td>
              <td className="px-4 py-2 text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(program)}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(program.id)}
                >
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
