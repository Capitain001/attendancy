import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sex } from "../types";

export const SEX_OPTIONS: Sex[] = ["MALE", "FEMALE", "OTHER"] as Sex[];

export const editInputClass =
  "w-full rounded-none border-b border-b-transparent bg-transparent px-1 py-0.5 text-xs outline-none transition-colors hover:border-b-border focus:border-b-primary";

export function HideButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Masquer la colonne"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid size-4 shrink-0 place-items-center rounded-sm text-muted-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground"
    >
      <X className="size-3" />
    </button>
  );
}

export function SortArrow({ dir }: { dir: "asc" | "desc" | null }) {
  if (!dir) return null;
  return <span className="text-[10px] text-muted-foreground">{dir === "asc" ? "↑" : "↓"}</span>;
}

export function Muted({ align }: { align?: "right" }) {
  return <span className={cn("text-muted-foreground/60", align === "right" && "ml-auto block w-fit")}>—</span>;
}
