// src/components/personal/teacher/class/enrollment/ClassEnrollModal.tsx
"use client"; // imposé par useClassEnrollForm (hook), le rendu lui-même est du pur HTML/CSS

import { X } from "lucide-react";

import { getStudentName } from "@/components/personal/teacher/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassEnrollForm } from "@/hooks/data/student-enrollments/useClassEnrollForm";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "../../student/StudentAvatar";
import { input } from "@/styles";
import { RippleButton } from "@/components/ui/ripple-button";

interface Props {
  classId: string;
  classLabel: string;
  groups?: readonly { id: string; name: string }[];
  onClose: () => void;
}

export function ClassEnrollModal({ classId, classLabel, groups = [], onClose }: Props) {
  const f = useClassEnrollForm({ classId, onClose });

  // Un seul champ : alimente la recherche ET l'ajout d'emails.
  const onChange = (value: string) => {
    f.setEmailInput(value);
    f.setQuery(value);
  };
  const add = () => {
    f.addEmails(f.emailInput);
    f.setQuery("");
  };
  const looksLikeEmail = f.emailInput.includes("@");

  return (
    <Dialog open onOpenChange={(open) => !open && !f.isSending && onClose()}>
      <DialogContent className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none">
        <DialogTitle className="sr-only">Inscrire des étudiants</DialogTitle>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 mt-14 pb-4">
          <div className="mx-auto max-w-md space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Inviter dans <span className="text-foreground">{classLabel}</span>
            </p>

            <Input
              type="text"
              inputMode="email"
              enterKeyHint="done"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              placeholder="Nom ou email…"
              value={f.emailInput}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (looksLikeEmail) add();
                }
              }}
              className={cn("h-12 bg-muted/30", input.underline)}
            />

            {looksLikeEmail && (
              <button
                type="button"
                onClick={add}
                className="w-full truncate rounded-md border border-dashed px-3 py-3 text-left text-sm"
              >
                Ajouter <span className="font-medium">{f.emailInput.trim()}</span>
              </button>
            )}

            {f.emailIssues.length > 0 && (
              <ul className="space-y-0.5 text-xs text-destructive">
                {f.emailIssues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            )}

            {f.failures.length > 0 && (
              <ul className="space-y-0.5 text-xs text-destructive">
                {f.failures.map(({ email, error }) => (
                  <li key={email}>{email} : {error}</li>
                ))}
              </ul>
            )}

            {f.newEmails.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {f.newEmails.map((email) => (
                  <li key={email} className="flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm">
                    <span className="max-w-52 truncate">{email}</span>
                    <button
                      type="button"
                      aria-label={`Retirer ${email}`}
                      className="rounded-full p-1.5"
                      onClick={() => f.removeEmail(email)}
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {groups.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <Button
                    key={g.id}
                    type="button"
                    size="sm"
                    variant={f.groupSelection.has(g.id) ? "default" : "outline"}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => f.groupSelection.toggle(g.id)}
                  >
                    {g.name}
                  </Button>
                ))}
              </div>
            )}

            {f.isLoading ? (
              <ul aria-busy="true" aria-label="Chargement des étudiants">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="flex items-center gap-3 px-1 py-2.5">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="size-4 rounded-[4px]" />
                  </li>
                ))}
              </ul>
            ) : f.students.length > 0 ? (
              <div className="space-y-1">
                <label className="flex items-center justify-end px-1 py-2">
                  <span className="sr-only">Tout sélectionner</span>
                  <Checkbox className="w-8" checked={f.allSelected} onCheckedChange={f.toggleAll} />
                </label>
                <ul>
                  {f.students.map((s) => {
                    const pending = f.isPending(s.user.email);
                    return (
                      <li key={s.id}>
                        <label
                          className={cn(
                            "flex items-center gap-3 rounded-md px-1 py-2.5",
                            pending && "opacity-50",
                          )}
                        >
                          <StudentAvatar user={s.user} className="size-8" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{getStudentName(s.user)}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {pending ? "Invité" : s.user.email}
                            </span>
                          </span>
                          <Checkbox
                            checked={f.isSelected(s.id)}
                            disabled={pending}
                            onCheckedChange={() => f.toggle(s.id)}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              !looksLikeEmail && (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun résultat</p>
              )
            )}
          </div>
        </div>

        <DialogFooter className="p-4 pt-1">
          <RippleButton
            type="button"
            className="h-12 w-full max-w-md self-center rounded-sm text-xl"
            onClick={f.submit}
            disabled={f.isSending || f.totalCount === 0}
          >
            {f.isSending ? "Envoi…" : f.totalCount > 0 ? `Inviter (${f.totalCount})` : "Inviter"}
          </RippleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}