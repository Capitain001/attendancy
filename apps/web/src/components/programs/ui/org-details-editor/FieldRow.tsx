// src/components/programs/ui/org-details-editor/FieldRow.tsx
import { BlockField, TemplateField } from "./types";

export interface FieldRowProps {
  field: BlockField;
  tplField?: TemplateField;
  isFixed?: boolean;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
  onMultiAdd: () => void;
  onMultiRemove: (idx: number) => void;
  onMultiChange: (idx: number, val: string) => void;
  onRemoveField: () => void;
}

export function FieldRow({
  field, tplField, isFixed = false,
  onKeyChange, onValueChange,
  onMultiAdd, onMultiRemove, onMultiChange,
  onRemoveField,
}: FieldRowProps) {
  const placeholder = tplField?.placeholder ?? "valeur";

  return (
    <div className="flex items-start gap-2">
      {/* Key */}
      <div className="w-36 shrink-0">
        {isFixed ? (
          <span className="block w-full truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs font-medium text-muted-foreground">
            {field.key}
          </span>
        ) : (
          <input
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-muted-foreground outline-none focus:border-input"
            placeholder="clé"
            value={field.key}
            onChange={(e) => onKeyChange(e.target.value)}
          />
        )}
      </div>

      {/* Value(s) */}
      <div className="flex-1 min-w-0">
        {field.type === "text" ? (
          <input
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-input"
            placeholder={placeholder}
            value={field.value}
            onChange={(e) => onValueChange(e.target.value)}
          />
        ) : (
          <div className="flex flex-col gap-1">
            {field.values.map((v, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-input"
                  placeholder={placeholder}
                  value={v}
                  onChange={(e) => onMultiChange(idx, e.target.value)}
                />
                {field.values.length > 1 && (
                  <button
                    type="button"
                    className="shrink-0 px-1 text-xs text-muted-foreground/40 hover:text-destructive"
                    onClick={() => onMultiRemove(idx)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-0.5 self-start rounded border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-input hover:text-foreground"
              onClick={onMultiAdd}
            >
              + Valeur
            </button>
          </div>
        )}
      </div>

      {/* Remove field */}
      {!isFixed && (
        <button
          type="button"
          className="shrink-0 pt-1.5 px-1 text-xs text-muted-foreground/40 hover:text-destructive"
          onClick={onRemoveField}
          title="Supprimer ce champ"
        >
          ✕
        </button>
      )}
    </div>
  );
}
