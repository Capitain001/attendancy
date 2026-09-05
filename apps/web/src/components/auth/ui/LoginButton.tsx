import { LogIn } from "lucide-react";

export function LoginButton({
  onClick,
  label = "Se connecter",
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="
        group relative inline-flex h-12 items-center justify-center gap-2
        overflow-hidden rounded-full border border-border bg-background px-7
        text-[15px] font-medium text-foreground
        transition-transform duration-150 ease-out
        hover:bg-foreground hover:text-background
        active:scale-[0.97]
      "
    >
      {/* Rayures obliques pilotées par --foreground, visibles seulement au hover */}
      <span
        aria-hidden="true"
        className="
          oblique-bar-foreground absolute inset-0
          opacity-0 transition-opacity duration-150
          group-hover:opacity-20
        "
      />

      <LogIn size={18} className="relative z-10" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}
