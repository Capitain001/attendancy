"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareAction } from "@/hooks/data/sessions/use-session-share";

const ACTIONS: Record<
  ShareAction,
  { icon: React.ElementType; label: string; description: string; successLabel: string }
> = {
  copy: {
    icon: Copy,
    label: "Copier le lien",
    description: "Copier l'URL dans le presse-papiers",
    successLabel: "Copié !",
  },
  share: {
    icon: Share2,
    label: "Partager",
    description: "Via les options système",
    successLabel: "Partagé !",
  },
  download: {
    icon: Download,
    label: "Télécharger le QR",
    description: "Exporter en PNG",
    successLabel: "Téléchargé !",
  },
};

interface SessionShareButtonProps {
  selected: ShareAction;
  success: ShareAction | null;
  onSelect: (action: ShareAction) => void;
  onRun: (action: ShareAction) => void;
}

export function SessionShareButton({ selected, success, onSelect, onRun }: SessionShareButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = ACTIONS[selected];
  const isSuccess = success === selected;
  const MainIcon = isSuccess ? Check : current.icon;

  return (
    <div ref={rootRef} className="relative inline-flex">
      <div className="inline-flex border border-border/50 rounded-[10px] overflow-hidden">
        <button
          onClick={() => onRun(selected)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium",
            "border-r border-border/50 bg-card hover:bg-muted/50 transition-all duration-150",
            isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
          )}
        >
          <MainIcon size={12} strokeWidth={isSuccess ? 2.5 : 2} />
          <span>{isSuccess ? current.successLabel : current.label}</span>
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Autres options de partage"
          className="flex items-center justify-center w-8 bg-card hover:bg-muted/50 transition-colors duration-150 text-muted-foreground"
        >
          <ChevronDown
            size={12}
            className={cn("transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] right-0 z-50 w-56 rounded-[12px] border border-border/50 bg-card p-1 shadow-sm flex flex-col gap-px">
          {(Object.entries(ACTIONS) as [ShareAction, (typeof ACTIONS)[ShareAction]][]).map(
            ([key, action]) => {
              const ItemIcon = action.icon;
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onSelect(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[8px] transition-colors duration-100",
                    isSelected ? "bg-muted/60" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-[7px] border border-border/50 bg-background shrink-0 text-muted-foreground">
                    <ItemIcon size={13} />
                  </div>
                  <div className="flex flex-col gap-px flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-foreground">{action.label}</span>
                    <span className="text-[11px] text-muted-foreground">{action.description}</span>
                  </div>
                  {isSelected && <Check size={12} className="text-muted-foreground shrink-0" />}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
