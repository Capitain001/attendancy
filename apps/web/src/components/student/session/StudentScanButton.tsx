"use client";

// Émargement QR (D9). ⚠ Le lecteur live V1 (`@yudiel/react-qr-scanner`) n'est pas installé en V2 :
// le bouton + dialog sont portés à l'identique, le lecteur reste un placeholder jusqu'à l'ajout
// du package (cf. specs/student-pages-v2). Aucune logique de présence ici — tout passe par attendAction.

import { useState } from "react";
import { QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StudentScanButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <QrCode className="size-4" />
          Scanner le QR du prof
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scanner le QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
          <QrCode className="size-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Le lecteur QR sera bientôt disponible.
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Vise le QR affiché par ton enseignant.
        </p>
      </DialogContent>
    </Dialog>
  );
}
