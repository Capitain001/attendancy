"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useClassGroups,
  useGroupEligibleStudents,
} from "@/hooks/data/groups/use-class-groups";
import { cn } from "@/lib/utils";

export type ManagedGroup = {
  id: string;
  name: string;
  description: string | null;
  count: number;
};

function fullName(s: { firstName: string | null; lastName: string | null }): string {
  return [s.firstName, s.lastName].filter(Boolean).join(" ") || "Étudiant";
}

interface GroupManageDialogProps {
  classId: string;
  group: ManagedGroup | null;
  onClose: () => void;
}

export function GroupManageDialog({ classId, group, onClose }: GroupManageDialogProps) {
  const open = group !== null;
  const groupId = group?.id ?? null;

  const { setMembers, isSavingMembers, updateGroup, deleteGroup } = useClassGroups(classId);
  const { students, isLoading } = useGroupEligibleStudents(classId, groupId, open);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initial, setInitial] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setError(null);
    setShowSettings(false);
    setConfirmDelete(false);
    setNameValue(group?.name ?? "");
    setDescValue(group?.description ?? "");
  }, [open, groupId, group?.name, group?.description]);

  const memberKey = useMemo(
    () =>
      students
        .filter((s) => s.inGroup)
        .map((s) => s.enrollmentId)
        .sort()
        .join(","),
    [students],
  );

  useEffect(() => {
    const ids = memberKey ? memberKey.split(",") : [];
    setSelected(new Set(ids));
    setInitial(new Set(ids));
  }, [memberKey]);

  if (!group || !groupId) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const membersDirty =
    selected.size !== initial.size || [...selected].some((id) => !initial.has(id));

  const filtered = query.trim()
    ? students.filter((s) =>
        fullName(s.student.user).toLowerCase().includes(query.trim().toLowerCase()),
      )
    : students;

  async function saveMembers() {
    if (!groupId || !membersDirty) return;
    await setMembers({ groupId, enrollmentIds: [...selected] });
    onClose();
  }

  const settingsDirty =
    nameValue.trim() !== (group?.name ?? "") ||
    (descValue.trim() || null) !== (group?.description ?? null);

  async function saveSettings() {
    if (!groupId) return;
    const name = nameValue.trim();
    if (name.length < 2) {
      setError("Le nom doit faire au moins 2 caractères.");
      return;
    }
    setSavingMeta(true);
    await updateGroup({ groupId, name, description: descValue.trim() || null });
    setSavingMeta(false);
    onClose();
  }

  async function handleDelete() {
    if (!groupId) return;
    setSavingMeta(true);
    await deleteGroup(groupId);
    setSavingMeta(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{group.name}</DialogTitle>
          <DialogDescription className="text-[12px]">
            {selected.size} membre{selected.size > 1 ? "s" : ""} · gère les étudiants et le groupe.
          </DialogDescription>
        </DialogHeader>

        {!showSettings && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un étudiant…"
                className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card pl-9 pr-3 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
              />
            </div>

            {isLoading ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">Chargement…</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="py-6 text-center text-[13px] text-muted-foreground">
                    Aucun étudiant.
                  </li>
                ) : (
                  filtered.map((s) => {
                    const checked = selected.has(s.enrollmentId);
                    return (
                      <li key={s.enrollmentId}>
                        <button
                          type="button"
                          onClick={() => toggle(s.enrollmentId)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-accent/40",
                            checked && "bg-primary/10",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-foreground/30",
                            )}
                          >
                            {checked && <Check className="size-3" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{fullName(s.student.user)}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </>
        )}

        <div className="border-t pt-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="flex w-full items-center gap-1.5 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="size-3.5" />
            {showSettings ? "Retour aux membres" : "Réglages du groupe"}
            <ChevronRight
              className={cn("ml-auto size-3.5 transition-transform", showSettings && "rotate-90")}
            />
          </button>

          {showSettings && (
            <div className="mt-2 space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="group-name-edit"
                  className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
                >
                  Nom
                </label>
                <input
                  id="group-name-edit"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={100}
                  className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-2.5 text-[13px] outline-none focus:border-foreground/60"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="group-desc-edit"
                  className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
                >
                  Description (optionnel)
                </label>
                <textarea
                  id="group-desc-edit"
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  maxLength={255}
                  rows={2}
                  placeholder="Description du groupe…"
                  className="w-full resize-none rounded-md border border-dashed border-foreground/30 bg-card px-2.5 py-2 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
                />
              </div>

              {confirmDelete ? (
                <div className="flex items-center gap-2 rounded-md bg-destructive/5 px-2 py-1.5">
                  <span className="flex-1 text-[12px] text-destructive">Supprimer ce groupe ?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-md border border-foreground/15 px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    Non
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={savingMeta}
                    className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground disabled:opacity-50"
                  >
                    {savingMeta && <Loader2 className="size-3 animate-spin" />} Supprimer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" /> Supprimer le groupe
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-[12px] text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-foreground/15 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04]"
          >
            Fermer
          </button>
          {showSettings ? (
            <button
              type="button"
              onClick={saveSettings}
              disabled={savingMeta || !settingsDirty || nameValue.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {savingMeta && <Loader2 className="size-3.5 animate-spin" />}
              Enregistrer
            </button>
          ) : (
            <button
              type="button"
              onClick={saveMembers}
              disabled={isSavingMembers || !membersDirty}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSavingMembers && <Loader2 className="size-3.5 animate-spin" />}
              Enregistrer les membres
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
