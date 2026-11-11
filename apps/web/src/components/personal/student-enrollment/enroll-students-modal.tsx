// src/components/personal/student-enrollment/enroll-students-modal.tsx
"use client";

import { useState } from "react";
import { Plus, PlusCircleIcon } from "lucide-react";
import { button } from "@/styles";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { EnrollStudentsPanel } from "./enroll-students-panel";

export function EnrollStudentsModal({ classId, className }: { classId: string; className: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={button.addRound} aria-label={`Ajouter des étudiants à ${className}`}>
          <Plus className="size-10" />
        </button>

      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter à {className}</DialogTitle>
          <DialogDescription>Sélectionne les étudiants à inscrire dans cette classe.</DialogDescription>
        </DialogHeader>

        <EnrollStudentsPanel classId={classId} onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}