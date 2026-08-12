//src/components/programs/ui/ProgramUeAction.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Check, Link, Trash2, Unlink } from "lucide-react";

interface ProgramUeActionProps {
  loading?: boolean;
  disabled?: boolean;
  onSubmit: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onAttach?: () => void | Promise<void>; // nouveau
  onDetach?: () => void | Promise<void>; // nouveau
}

export function ProgramUeAction({
  loading = false,
  disabled = false,
  onSubmit,
  onDelete,
  onAttach,
  onDetach,
}: ProgramUeActionProps) {
  return (
    <div className="flex ml-2 gap-1 w-fit">
      <Button size="sm" type="button" onClick={onSubmit} disabled={loading || disabled}>
        <Check size={14} />
      </Button>

      {onAttach && (
        <Button size="sm" variant="outline" type="button" onClick={onAttach}>
          <Link size={14} />
        </Button>
      )}

      {onDetach && (
        <Button size="sm" variant="outline" type="button" onClick={onDetach}>
          <Unlink size={14} />
        </Button>
      )}

      {onDelete && (
        <Button size="sm" variant="destructive" type="button" onClick={onDelete}>
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}
