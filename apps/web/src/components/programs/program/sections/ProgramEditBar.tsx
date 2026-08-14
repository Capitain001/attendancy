"use client";

import React from "react";
import { Lock, Unlock, CheckCircle, XCircle, Copy } from "lucide-react";

export function ProgramEditBar({
  isEditing,
  isDirty,
  reorderStatus,
  isLocked = false,
  isActive = true,
  onToggleEdit,
  onSaveOrder,
  onToggleLock,
  onToggleActive,
  onDuplicate,
}: {
  isEditing: boolean;
  isDirty: boolean;
  reorderStatus: "idle" | "saving" | "success" | "error";
  isLocked?: boolean;
  isActive?: boolean;
  onToggleEdit: () => void;
  onSaveOrder: () => void;
  onToggleLock?: () => void;
  onToggleActive?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      {onToggleActive && (
        <button
          onClick={onToggleActive}
          className={`h-8 px-3 text-[11px] font-medium border border-dashed rounded-sm flex items-center gap-1.5 transition-colors ${
            isActive
              ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
              : "border-muted-foreground/30 text-muted-foreground hover:bg-foreground/[0.05]"
          }`}
          title={isActive ? "Programme actif (applicable aux nouvelles classes)" : "Programme inactif (masqué pour les nouvelles classes)"}
        >
          {isActive ? <XCircle className="size-3.5" /> :<CheckCircle className="size-3.5" />  }
          {isActive ? "Désactiver" : "Activer"}
        </button>
      )}

      {onToggleLock && (
        <button
          onClick={onToggleLock}
          className={`h-8 px-3 text-[11px] font-medium border border-dashed rounded-sm flex items-center gap-1.5 transition-colors ${
            isLocked
              ? "border-amber-500/50 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
              : "border-muted-foreground/30 text-muted-foreground hover:bg-foreground/[0.05]"
          }`}
          title={isLocked ? "Déverrouiller la maquette pédagogique" : "Verrouiller la maquette pédagogique"}
        >
          {isLocked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        </button>
      )}
{/* 
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          className="h-8 px-3 text-[11px] font-medium border border-dashed rounded-sm flex items-center gap-1.5 transition-colors border-muted-foreground/30 text-muted-foreground hover:bg-foreground/[0.05]"
          title="Dupliquer ce programme"
        >
          <Copy className="size-3.5" />
          Dupliquer
        </button>
      )} */}

      {!isEditing && isDirty && (
        <span className="text-amber-500 text-xs font-medium self-center">
          Changements non sauvegardés
        </span>
      )}

      {isEditing && isDirty && (
        <button
          onClick={onSaveOrder}
          disabled={reorderStatus === "saving"}
          className="h-8 px-4 text-[12px] font-medium bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {reorderStatus === "saving" ? "Enregistrement..." : "Sauvegarder l'ordre"}
        </button>
      )}

      <button
        onClick={onToggleEdit}
        disabled={isLocked}
        title={isLocked ? "Impossible d'éditer un programme verrouillé" : "Éditer"}
        className={`h-8 px-4 text-[12px] font-medium border border-dashed rounded-sm transition-colors ${
          isLocked
            ? "opacity-50 cursor-not-allowed text-muted-foreground border-foreground/20"
            : isEditing
            ? "bg-foreground/[0.2] text-background border-transparent hover:opacity-80"
            : "text-foreground border-foreground/30 bg-foreground/[0.05] hover:bg-muted/80"
        }`}
      >
        { isEditing ? "Terminer l'édition" : "Éditer"}
      </button>
    </div>
  );
}

