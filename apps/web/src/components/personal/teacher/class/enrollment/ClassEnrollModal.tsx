"use client";

import { Plus, X } from "lucide-react";


import { getStudentName } from "@/components/personal/teacher/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassEnrollForm } from "@/hooks/data/student-enrollments/useClassEnrollForm";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "../../student/StudentAvatar";

interface Props {
  classId: string;
  classLabel: string;
  /** Groupes de la classe (optionnel) : masque la section si vide. */
  groups?: readonly { id: string; name: string }[];
  onClose: () => void;
}

const RING_NEW = "ring-2 ring-blue-500 ring-offset-2 ring-offset-background";
const RING_SELECTED = "ring-2 ring-green-500 ring-offset-2 ring-offset-background";

// Monté uniquement à l'ouverture : sélection, emails et recherche repartent de zéro.
export function ClassEnrollModal({ classId, classLabel, groups = [], onClose }: Props) {
  const f = useClassEnrollForm({ classId, onClose });

  return (
    <Dialog open onOpenChange={(open) => !open && !f.isSending && onClose()}>
      <DialogContent className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Inscrire des étudiants</DialogTitle>
          <DialogDescription>
            {classLabel} · les nouveaux reçoivent un email, les comptes existants une notification à accepter.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* ── Ajout par email ─────────────────────────────────────────── */}
            <section className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="email"
                  placeholder="Ajouter un ou plusieurs emails…"
                  value={f.emailInput}
                  onChange={(e) => f.setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      f.addEmails(f.emailInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!f.emailInput.trim()}
                  onClick={() => f.addEmails(f.emailInput)}
                >
                  <Plus className="size-4" />
                  Ajouter
                </Button>
              </div>

              {f.emailIssues.length > 0 && (
                <ul className="space-y-0.5 text-xs text-destructive">
                  {f.emailIssues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              )}

              {f.newEmails.length > 0 && (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {f.newEmails.map((email) => (
                    <li key={email} className="flex items-center gap-2 rounded-full border py-1 pr-1 pl-1.5">
                      <StudentAvatar
                        user={{ email, firstName: null, lastName: null, avatar_url: null }}
                        className={cn("size-6", RING_NEW)}
                      />
                      <span className="text-sm">{email}</span>
                      <button
                        type="button"
                        aria-label={`Retirer ${email}`}
                        className="rounded-full p-1 hover:bg-muted"
                        onClick={() => f.removeEmail(email)}
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Échecs du dernier envoi ─────────────────────────────────── */}
            {f.failures.length > 0 && (
              <section className="space-y-1 rounded-md border border-destructive/40 p-3 text-sm">
                <p className="font-medium text-destructive">Non envoyées (sélection conservée pour réessayer)</p>
                <ul className="text-xs text-muted-foreground">
                  {f.failures.map(({ email, error }) => (
                    <li key={email}>{email} : {error}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Groupes (optionnel) ─────────────────────────────────────── */}
            {groups.length > 0 && (
              <section className="space-y-2">
                <p className="text-sm font-medium">Ajouter aussi à un groupe (optionnel)</p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <Button
                      key={g.id}
                      type="button"
                      size="sm"
                      variant={f.groupSelection.has(g.id) ? "default" : "outline"}
                      onClick={() => f.groupSelection.toggle(g.id)}
                    >
                      {g.name}
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {/* ── Étudiants disponibles de l'organisation ─────────────────── */}
            <section className="space-y-3">
              <Input
                placeholder="Rechercher dans l'établissement (nom, email)…"
                value={f.query}
                onChange={(e) => f.setQuery(e.target.value)}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={f.allSelected}
                    onCheckedChange={f.toggleAll}
                    disabled={f.students.length === 0}
                  />
                  Tout sélectionner
                </label>
                <span className="text-muted-foreground">{f.totalCount} à inscrire</span>
              </div>

              {f.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {f.students.map((s) => {
                    const pending = f.isPending(s.user.email);
                    const selected = f.isSelected(s.id);
                    return (
                      <li key={s.id}>
                        <label
                          className={cn(
                            "flex items-center gap-3 rounded-md p-2",
                            pending ? "opacity-60" : "cursor-pointer hover:bg-muted",
                          )}
                        >
                          <Checkbox
                            checked={selected}
                            disabled={pending}
                            onCheckedChange={() => f.toggle(s.id)}
                          />
                          <StudentAvatar
                            user={s.user}
                            className={cn("size-9", selected && RING_SELECTED)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{getStudentName(s.user)}</p>
                            <p className="truncate text-xs text-muted-foreground">{s.user.email}</p>
                          </div>
                          {pending && <Badge variant="secondary">Invité</Badge>}
                        </label>
                      </li>
                    );
                  })}
                  {f.students.length === 0 && (
                    <li className="col-span-full py-4 text-center text-sm text-muted-foreground">
                      Aucun étudiant disponible
                    </li>
                  )}
                </ul>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={f.isSending}>
            Annuler
          </Button>
          <Button onClick={f.submit} disabled={f.isSending || f.totalCount === 0}>
            {f.isSending ? "Envoi…" : `Inviter (${f.totalCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}