import { cn } from "@/lib/utils";
import { ReactNode } from "react";
const BAR_BTN =
  "inline-flex h-7 items-center gap-1 rounded px-2 text-muted-foreground transition-colors hover:bg-foreground/[0.04]";

export function RecordBarButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        BAR_BTN,
        active && "bg-foreground/[0.06] text-foreground",
        "disabled:opacity-40 disabled:hover:bg-transparent ",
      )}
    >
      {children}
    </button>
  );
}
