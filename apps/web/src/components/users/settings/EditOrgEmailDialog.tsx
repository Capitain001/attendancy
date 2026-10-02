"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrgIdentity } from "@/hooks/data/organization/useOrgIdentity";

interface EditOrgEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string | null;
  organizationId?: string;
}

export function EditOrgEmailDialog({
  open,
  onOpenChange,
  currentEmail,
  organizationId,
}: EditOrgEmailDialogProps) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const { isPending, updateIdentity } = useOrgIdentity(organizationId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await updateIdentity({ email });
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;email de l&apos;espace</DialogTitle>
          <DialogDescription>
            Cet email identifie votre espace personnel sur Attendancy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="org-email" className="text-xs font-semibold text-foreground">
              Email
            </label>
            <Input
              id="org-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@exemple.com"
              required
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
