// src/components/users/settings/EditPasswordDialog.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { input } from "@/styles/input";

// Les noms de props restent identiques : aucun changement côté appelants
interface EditPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPasswordDialog({ open, onOpenChange }: EditPasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Garde-fou : la confirmation doit être identique au nouveau mot de passe
    if (newPassword !== confirmPassword) {
      toast.error("Erreur", { description: "Les mots de passe ne correspondent pas" });
      return;
    }

    startTransition(async () => {
      toast.success("Mot de passe mis à jour avec succès");
      onOpenChange(false);

      // Réinitialisation des champs après fermeture
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Panneau latéral droit : sm:max-w-md garde la même largeur que l'ancien dialog */}
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Changer le mot de passe</SheetTitle>
          <SheetDescription>
            Définissez un mot de passe sécurisé pour votre compte.
          </SheetDescription>
        </SheetHeader>

        {/* flex-1 + flex-col : le footer reste collé en bas du panneau */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Mot de passe actuel</label>
            {/* input.underline : pas de border/ring, seulement un soulignement */}
            <Input
              type="password"
              className={input.underline}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nouveau mot de passe</label>
            <Input
              type="password"
              className={input.underline}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Confirmer le mot de passe</label>
            <Input
              type="password"
              className={input.underline}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {/* flex-row : les deux boutons sur la même ligne (SheetFooter est en colonne par défaut) */}
          {/* mt-auto pousse les boutons en bas ; px-0 car le form a déjà son padding */}
          <SheetFooter className="mt-auto flex-row gap-2 px-0 pb-8">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}