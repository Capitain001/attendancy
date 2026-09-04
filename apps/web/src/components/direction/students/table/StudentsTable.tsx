"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarColor, fullName, initials } from "@/components/direction/students/utils";
import { SexIcon } from "@/components/direction/students/ui/icons";
import { useStudentsTable } from "./useStudentsTable";
import { HEADER_BORDER_CLASS, TIER_CELL_CLASS, TIER_HEADER_CLASS } from "./presentation";
import type { AttendanceRates, Sex, StudentRow } from "./types";
import { AddColumnPopover, EditCell, FooterBar, HeaderCell, HideButton, ReadCell, SortArrow, StudentDetailSheet, Toolbar, editInputClass } from "./ui";

type StudentsTableProps = {
  data: StudentRow[];
  rates: AttendanceRates;
  selected: Set<string>;
  onToggle: (studentId: string) => void;
  onOpen: (student: StudentRow) => void;
  hrefFor: (studentId: string) => string;
};

const pinnedClass = "sticky left-0 z-10 bg-card px-2 py-1.5 border-r border-r-border/60 shadow-[1px_0_0_0_hsl(var(--border)/0.5)] before:absolute before:inset-0 before:-z-10 before:bg-card";

export function StudentsTable({ data, rates, selected, onToggle, onOpen, hrefFor }: StudentsTableProps) {
  const t = useStudentsTable({ data, rates, selected, onToggle });
  const [sheetStudent, setSheetStudent] = useState<StudentRow | null>(null);
  const colSpan = 1 + t.visibleBaseColumns.length + t.customCols.length + (t.editMode ? 1 : 0);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Toolbar t={t} />

      {/* Zone défilante : la scrollbar reste strictement cantonnée au corps de la table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Colonne épinglée — Arrière-plan bg-card opaque pour masquer le contenu défilant */}
              <th className={cn(pinnedClass, "z-20 text-left align-middle", HEADER_BORDER_CLASS)}>
                <div className="flex items-center gap-1.5">
                  {t.selecting && <input type="checkbox" aria-label="Tout sélectionner" checked={t.allPageSelected} onChange={t.togglePageSelection} className="size-3.5 shrink-0 accent-primary" />}
                  <button type="button" onClick={() => t.toggleSort("name")} className="flex items-center gap-1 text-[11.5px] font-semibold text-foreground">
                    <GraduationCap className="size-3 text-muted-foreground" />
                    Étudiant
                    <SortArrow dir={t.sortDirectionOf("name")} />
                  </button>
                </div>
              </th>

              {t.visibleBaseColumns.map((c) => <HeaderCell key={c.id} column={c} t={t} />)}

              {t.customCols.map((c) => (
                <th key={c.id} className={cn("border-r border-r-border/40 min-w-[120px] px-2 py-1.5 text-left align-middle", HEADER_BORDER_CLASS)}>
                  <div className="flex items-center justify-between gap-1">
                    <span className={TIER_HEADER_CLASS.tertiary}>{c.label}</span>
                    {t.editMode && <HideButton onClick={() => t.removeCustomColumn(c.id)} />}
                  </div>
                </th>
              ))}

              {t.editMode && (
                <th className={cn("border-r border-r-border/40 w-9 px-1.5 py-1.5 align-middle", HEADER_BORDER_CLASS)}>
                  <AddColumnPopover t={t} />
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {t.pageRows.map((row) => {
              const s = row.original;
              const rate = rates[s.studentId];
              const isSelected = selected.has(s.studentId);
              const eFirst = t.valueOf(s, "prenom", s.firstName ?? "");
              const eLast = t.valueOf(s, "nom", s.lastName ?? "");
              const eSex = t.valueOf(s, "sexe", String(s.sex)) as Sex;
              const name = fullName({ firstName: eFirst, lastName: eLast, email: s.email });

              return (
                <tr key={s.studentId} onClick={() => (t.selecting ? onToggle(s.studentId) : onOpen(s))} className={cn("group cursor-pointer border-b last:border-b-0 hover:bg-muted/40", isSelected && "bg-primary/5 hover:bg-primary/10")}>
                  {/* Colonne épinglée avec fond bg-card opaque garantit l'opacité même au survol/sélection */}
                  <td className={cn(pinnedClass, "transition-colors group-hover:bg-muted/40", isSelected && "bg-primary/5 group-hover:bg-primary/10")}>
                    <div className="flex items-center gap-2">
                      {t.selecting && <input type="checkbox" aria-label={`Sélectionner ${name}`} checked={isSelected} onChange={() => onToggle(s.studentId)} onClick={(e) => e.stopPropagation()} className="size-3.5 shrink-0 accent-primary" />}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSheetStudent(s);
                        }}
                        title="Voir l'aperçu de l'étudiant"
                        className="grid size-6.5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white transition-transform hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ background: avatarColor(s.studentId) }}
                      >
                        {initials({ firstName: eFirst, lastName: eLast })}
                      </button>
                      <Link href={hrefFor(s.studentId)} onClick={(e) => (t.selecting ? e.preventDefault() : e.stopPropagation())} className="truncate text-xs font-semibold text-foreground hover:underline">
                        {name}
                      </Link>
                      <SexIcon sex={eSex} className="size-2.5 shrink-0" />
                    </div>
                  </td>

                  {t.visibleBaseColumns.map((c) => {
                    const value = t.valueOf(s, c.id, c.raw(s, rate));
                    return (
                      <td key={c.id} className="border-r border-r-border/40 px-2 py-1.5 align-middle" onClick={t.editMode ? (e) => e.stopPropagation() : undefined}>
                        {t.editMode ? <EditCell kind={c.kind} value={value} onChange={(v) => t.setField(s.studentId, c.id, v)} /> : <ReadCell column={c} value={value} />}
                      </td>
                    );
                  })}

                  {t.customCols.map((c) => {
                    const value = t.valueOf(s, c.id, "");
                    return (
                      <td key={c.id} className={cn("border-r border-r-border/40 px-2 py-1.5", TIER_CELL_CLASS.tertiary)} onClick={t.editMode ? (e) => e.stopPropagation() : undefined}>
                        {t.editMode ? <input value={value} onChange={(e) => t.setField(s.studentId, c.id, e.target.value)} placeholder="—" className={editInputClass} /> : value || <span className="text-muted-foreground/60">—</span>}
                      </td>
                    );
                  })}

                  {t.editMode && <td className="w-11 px-2 py-2.5" />}
                </tr>
              );
            })}

            {t.pageRows.length === 0 && (
              <tr>
                <td colSpan={colSpan}>
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                    <SearchX className="size-5 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Aucun étudiant ne correspond aux filtres</p>
                    <p className="max-w-xs text-xs text-muted-foreground">Ajustez la recherche ou les filtres pour élargir les résultats.</p>
                    {(t.search || t.activeFilterCount > 0) && (
                      <button type="button" onClick={t.resetFilters} className="mt-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FooterBar t={t} selectedCount={selected.size} />

      {/* Sheet de détail étudiant sur clic de l'avatar */}
      <StudentDetailSheet
        student={sheetStudent}
        rate={sheetStudent ? rates[sheetStudent.studentId] : undefined}
        open={!!sheetStudent}
        onOpenChange={(open) => !open && setSheetStudent(null)}
        href={sheetStudent ? hrefFor(sheetStudent.studentId) : undefined}
      />
    </div>
  );
}