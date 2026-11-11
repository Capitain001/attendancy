// src/components/personal/organization/profile/PersonalRolePicker.tsx
import { X, Plus } from "lucide-react";
import { PersonalRoleOptions } from "./PersonalRoleOptions";
import { ROLE_OPTIONS, type RoleOptionConfig } from "./roles";

const MODAL_ID = "personal-role-picker";

type PersonalRolePickerProps = {
  action: (formData: FormData) => void | Promise<void>;
  options?: RoleOptionConfig[];
  triggerLabel?: string;
  triggerDescription?: string;
};

export function PersonalRolePicker({
  action,
  options = ROLE_OPTIONS,
  triggerLabel = "Ajouter un profil",
  triggerDescription,
}: PersonalRolePickerProps) {
  return (
    <>
      <button
        type="button"
        popoverTarget={MODAL_ID}
        className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
          <Plus aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-foreground">{triggerLabel}</span>
          {triggerDescription && (
            <span className="block text-sm text-muted-foreground">{triggerDescription}</span>
          )}
        </span>
        <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
          Ajouter →
        </span>
      </button>

      <div
        id={MODAL_ID}
        popover=""
        className="m-auto w-[min(92vw,36rem)] rounded-xl border border-foreground/10 bg-background p-0 text-foreground shadow-xl backdrop:bg-foreground/30"
      >
        <div className="grid gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold tracking-tight text-foreground/90">Ajouter un profil personnel</h2>
              <p className="text-xs text-foreground/50">Sélectionnez le rôle à associer à votre espace personnel.</p>
            </div>
            <button
              type="button"
              popoverTarget={MODAL_ID}
              popoverTargetAction="hide"
              aria-label="Fermer"
              className="rounded-md p-1 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/70"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <PersonalRoleOptions options={options} action={action} />
        </div>
      </div>
    </>
  );
}