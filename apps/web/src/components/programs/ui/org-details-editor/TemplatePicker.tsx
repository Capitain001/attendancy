// src/components/programs/ui/org-details-editor/TemplatePicker.tsx
import { BlockTemplate } from "./types";

export interface TemplatePickerProps {
  templates: BlockTemplate[];
  onPick: (tpl: BlockTemplate) => void;
  onClose: () => void;
}

export function TemplatePicker({ templates, onPick, onClose }: TemplatePickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[92%] max-w-lg overflow-hidden rounded-xl bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-popover-foreground">Choisir un template</span>
          <button
            type="button"
            className="px-1 text-sm text-muted-foreground/40 hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-4">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="flex flex-col items-start gap-1 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left transition-colors hover:border-input hover:bg-card"
              onClick={() => { onPick(tpl); onClose(); }}
            >
              <span className="text-lg leading-none">{tpl.icon}</span>
              <span className="text-xs font-semibold text-card-foreground">{tpl.label}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">{tpl.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}