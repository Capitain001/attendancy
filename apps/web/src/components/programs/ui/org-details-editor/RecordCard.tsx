// src/components/programs/ui/org-details-editor/RecordCard.tsx
import { BlockField, TemplateField } from "./types";
import { FieldRow } from "./FieldRow";

export interface RecordCardProps {
  record: BlockField[];
  index: number;
  tplFields: TemplateField[];
  onFieldChange: (fid: string, patch: Partial<BlockField>) => void;
  onMultiAdd: (fid: string) => void;
  onMultiRemove: (fid: string, idx: number) => void;
  onMultiChange: (fid: string, idx: number, val: string) => void;
  onAddField: () => void;
  onRemoveField: (fid: string) => void;
  onRemoveRecord: () => void;
}

export function RecordCard({
  record, index, tplFields,
  onFieldChange, onMultiAdd, onMultiRemove, onMultiChange,
  onAddField, onRemoveField, onRemoveRecord,
}: RecordCardProps) {
  const titleField = record.find((f) => f.key === "ville") ?? record[0];
  const titleVal = titleField?.value || `Entrée ${index + 1}`;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          #{index + 1}
        </span>
        <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
          {titleVal}
        </span>
        <button
          type="button"
          className="px-1 text-xs text-muted-foreground/40 hover:text-destructive"
          onClick={onRemoveRecord}
          aria-label="Supprimer"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3">
        {record.map((f) => {
          const tplF = tplFields.find((t) => t.key === f.key);
          return (
            <FieldRow
              key={f.id}
              field={f}
              tplField={tplF}
              isFixed={!!tplF}
              onKeyChange={(v) => onFieldChange(f.id, { key: v })}
              onValueChange={(v) => onFieldChange(f.id, { value: v })}
              onMultiAdd={() => onMultiAdd(f.id)}
              onMultiRemove={(idx) => onMultiRemove(f.id, idx)}
              onMultiChange={(idx, v) => onMultiChange(f.id, idx, v)}
              onRemoveField={() => onRemoveField(f.id)}
            />
          );
        })}

        {/* Footer */}
        <div className="mt-1 border-t border-dashed border-border pt-2">
          <button
            type="button"
            className="rounded border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-input hover:text-foreground"
            onClick={onAddField}
          >
            + Champ libre
          </button>
        </div>
      </div>
    </div>
  );
}