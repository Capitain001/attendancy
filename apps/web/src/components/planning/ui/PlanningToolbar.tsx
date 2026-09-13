import type { ScheduleStatus } from "@/generated/prisma/browser";
import { Loader2, Lock, LockOpen, PencilLine, Trash2, Users } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToolbarButton } from "./ToolbarButton";
import { ResourceIcon } from "@/components/icons/ResourceIcon";

export type DialogMode = "view" | "edit" | "notes" | "group";

export interface PlanningToolbarProps {
  mode: DialogMode;
  locked: boolean;
  saving: boolean;
  savingNotes: boolean;
  togglingLock: boolean;
  canceling: boolean;
  deleting: boolean;
  hasEvent: boolean;
  status: ScheduleStatus;
  isElapsed: boolean;
  /** Éditabilité structurante : status DB + isLocked DB + créneau écoulé. */
  isScheduleEditable: boolean;
  onModeToggle: (target: DialogMode) => void;
  onLockToggle: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onSubmit: () => void;
  onSaveNotes: () => void;
  onCancelEdit: () => void;
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={10} side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function PlanningToolbar({
  mode,
  locked = false,
  saving = false,
  savingNotes = false,
  togglingLock = false,
  deleting = false,
  hasEvent = false,
  isElapsed = false,
  isScheduleEditable = true,
  onModeToggle,
  onLockToggle,
  onRemove,
  onSubmit,
  onSaveNotes,
  onCancelEdit,
}: PlanningToolbarProps) {
  const notEditing = mode !== "edit";
  const canEdit = notEditing && isScheduleEditable;

  return (
    <div className="flex items-center justify-between gap-2">
      {mode === "edit" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-sm border border-input bg-background px-3 text-[13px] font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-sm bg-primary px-3 text-[13px] font-medium text-primary-foreground"
          >
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      ) : mode === "notes" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onModeToggle("notes")}
            disabled={savingNotes}
            className="inline-flex h-9 items-center justify-center rounded-sm border border-input bg-background px-3 text-[13px] font-medium"
          >
            {locked ? "Fermer" : "Annuler"}
          </button>
          {!locked && (
            <button
              type="button"
              onClick={onSaveNotes}
              disabled={savingNotes}
              className="inline-flex h-9 items-center justify-center rounded-sm bg-primary px-3 text-[13px] font-medium text-primary-foreground"
            >
              {savingNotes && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Sauvegarder
            </button>
          )}
        </div>
      ) : (
        <div />
      )}

      <TooltipProvider delayDuration={250}>
        <span className="flex items-center gap-1 rounded-sm border bg-muted/80 p-1 text-muted-foreground shadow-sm">
          {canEdit && (
            <Tip label="Modifier la séance">
              <ToolbarButton onClick={() => onModeToggle("edit")} disabled={locked}>
                <PencilLine size={16} />
              </ToolbarButton>
            </Tip>
          )}
          <Tip label="Groupe assigné">
            <ToolbarButton onClick={() => onModeToggle("group")} active={mode === "group"}>
              <Users size={16} />
            </ToolbarButton>
          </Tip>
          {/* Notes : accessible même si verrouillé pour la lecture */}
          <Tip label="Notes de séance">
            <ToolbarButton onClick={() => onModeToggle("notes")} active={mode === "notes"}>
              <ResourceIcon name="comment" size={16} />
            </ToolbarButton>
          </Tip>
          {notEditing && <span className="mx-0.5 h-4 w-px bg-border" />}
          {notEditing && hasEvent && (
            <Tip label={locked ? "Déverrouiller" : "Verrouiller"}>
              <ToolbarButton onClick={onLockToggle} active={locked} activeColor="amber" disabled={togglingLock}>
                {togglingLock
                  ? <Loader2 size={16} className="animate-spin" />
                  : locked ? <Lock size={16} /> : <LockOpen size={16} />
                }
              </ToolbarButton>
            </Tip>
          )}
          {hasEvent && notEditing && (
            deleting ? (
              <span className="grid size-7 place-items-center">
                <Loader2 size={16} className="animate-spin text-destructive" />
              </span>
            ) : (
              <Tip label={locked ? "Séance verrouillée" : "Supprimer la séance"}>
                <ToolbarButton onClick={onRemove} hoverColor="destructive" disabled={locked}>
                  <Trash2 size={16} />
                </ToolbarButton>
              </Tip>
            )
          )}
        </span>
      </TooltipProvider>
    </div>
  );
}