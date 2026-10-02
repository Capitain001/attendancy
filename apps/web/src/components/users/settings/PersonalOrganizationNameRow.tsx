"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
import { updateOrgIdentityAction } from "@/services/organization/actions";

export function PersonalOrganizationNameRow({ initialName }: { initialName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentName, setCurrentName] = useState(initialName);
  const [draftName, setDraftName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateOrgIdentityAction({ name: draftName });

      if ("error" in result) {
        toast.error("Erreur", { description: result.error });
        return;
      }

      setCurrentName(result.data.name);
      setDraftName(result.data.name);
      toast.success("Nom mis à jour avec succès");
      router.refresh();
      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraftName(currentName);
          setIsOpen(true);
        }}
        className="group flex w-full items-center justify-between rounded-md  py-2.5 text-left transition hover:bg-muted/40"
      >
        <span className="text-sm font-medium text-foreground">Nom de l’espace</span>
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
          <span className="truncate">{currentName}</span>
          <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le nom de l’espace</DialogTitle>
            <DialogDescription>
              Saisissez le nom à afficher pour votre espace personnel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="personal-organization-name" className="text-xs font-semibold text-foreground">
                Nom
              </label>
              <Input
                id="personal-organization-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                minLength={2}
                maxLength={120}
                required
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}