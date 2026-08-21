import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ToolbarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  activeColor?: "amber" | "green";
  hoverColor?: "destructive" | "orange";
  title?: string;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton({ onClick, children, active, disabled, activeColor, hoverColor, title, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={disabled ? undefined : onClick}
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={cn(
          "grid size-7 place-items-center rounded-sm transition-colors cursor-pointer",
          disabled && "opacity-40 cursor-default",
          !disabled && !active && "hover:bg-background/70",
          active && !activeColor && "bg-background text-foreground shadow-sm",
          active && activeColor === "amber" && "text-amber-500 hover:text-foreground",
          !disabled && !active && hoverColor === "destructive" && "hover:text-destructive",
          !disabled && !active && hoverColor === "orange" && "hover:text-orange-500",
          !disabled && !active && !hoverColor && "hover:text-foreground",
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
