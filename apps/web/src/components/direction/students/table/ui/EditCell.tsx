import { sexLabel } from "@/components/direction/students/utils";
import type { BaseColumnDef, Sex } from "../types";
import { SEX_OPTIONS, editInputClass } from "./TableHelpers";

export function EditCell({
  kind,
  value,
  onChange,
}: {
  kind: BaseColumnDef["kind"];
  value: string;
  onChange: (v: string) => void;
}) {
  if (kind === "sex") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={editInputClass}>
        {SEX_OPTIONS.map((sx) => (
          <option key={sx} value={sx}>{sexLabel(sx)}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      value={value}
      inputMode={kind === "number" ? "decimal" : undefined}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className={editInputClass}
    />
  );
}
