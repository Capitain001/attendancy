// src/components/personal/teacher/class/PersonalClassPlaceholder.tsx
import { Plus } from "lucide-react";

type PersonalClassPlaceholderProps = {
  label?: string;
  disabled?: boolean;
  /** id du popover à ouvrir (API Popover native, aucun JS client requis). */
  popoverTarget?: string;
};

export function PersonalClassPlaceholder({
  label,
  disabled = false,
  popoverTarget,
}: PersonalClassPlaceholderProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      popoverTarget={popoverTarget}
      className="flex h-56 lg:h-full lg:min-h-24  w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-foreground/[0.02] text-foreground/45 transition-colors hover:border-foreground/30 hover:bg-foreground/[0.03] hover:text-foreground/75 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus aria-hidden="true" className="size-6" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}