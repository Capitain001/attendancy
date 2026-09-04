//useStudentsTable
import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { computeAge, fullName } from "@/components/direction/students/utils";
import { BASE_COLUMNS } from "./columns";
import type {
  AttendanceRates,
  BaseColumnId,
  ColumnFilters,
  CustomColumnDef,
  Overrides,
  StudentRow,
} from "./types";

const PAGE_SIZE = 25;

const EMPTY_FILTERS: ColumnFilters = { filiere: "", classe: "", sexe: "", presenceMin: "" };

/**
 * Toute la logique de la table étudiants : aucune ligne de JSX ici.
 * Le composant de présentation ne fait que lire l'objet retourné et l'afficher.
 */
export function useStudentsTable({
  data,
  rates,
  selected,
  onToggle,
}: {
  data: StudentRow[];
  rates: AttendanceRates;
  selected: Set<string>;
  onToggle: (studentId: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearchState] = useState("");
  const [colFilters, setColFilters] = useState<ColumnFilters>(EMPTY_FILTERS);
  const [editMode, setEditMode] = useState(false);
  const [hidden, setHidden] = useState<Set<BaseColumnId>>(new Set());
  const [customCols, setCustomCols] = useState<CustomColumnDef[]>([]);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [newFieldLabel, setNewFieldLabel] = useState("");

  // Le mode édition active aussi la sélection multiple des lignes.
  const selecting = editMode;

  /**
   * Valeur effective d'une cellule : override local sinon valeur brute serveur.
   * Les overrides ne sont JAMAIS envoyés au backend — édition d'affichage uniquement.
   */
  const valueOf = (s: StudentRow, key: string, raw: string): string =>
    overrides[s.studentId]?.[key] ?? raw;

  const setField = (studentId: string, key: string, value: string) =>
    setOverrides((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [key]: value } }));

  const filiereOptions = useMemo(
    () => Array.from(new Set(data.map((s) => s.programTrackName).filter(Boolean) as string[])).sort(),
    [data],
  );
  const classeOptions = useMemo(
    () => Array.from(new Set(data.map((s) => s.className).filter(Boolean) as string[])).sort(),
    [data],
  );

  const activeFilterCount =
    (colFilters.filiere ? 1 : 0) +
    (colFilters.classe ? 1 : 0) +
    (colFilters.sexe ? 1 : 0) +
    (colFilters.presenceMin ? 1 : 0);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = colFilters.presenceMin ? Number(colFilters.presenceMin) : null;
    return data.filter((s) => {
      if (q && !(fullName(s).toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q))) {
        return false;
      }
      if (colFilters.filiere && s.programTrackName !== colFilters.filiere) return false;
      if (colFilters.classe && s.className !== colFilters.classe) return false;
      if (colFilters.sexe && String(s.sex) !== colFilters.sexe) return false;
      if (min !== null) {
        const r = rates[s.studentId]?.rate;
        if (r === null || r === undefined || r < min) return false;
      }
      return true;
    });
  }, [data, search, colFilters, rates]);

  // Colonnes "virtuelles" servant uniquement au tri.
  const sortColumns = useMemo<ColumnDef<StudentRow>[]>(
    () => [
      { id: "name", accessorFn: (s) => `${s.lastName ?? ""} ${s.firstName ?? ""}`.trim() },
      { id: "nom", accessorFn: (s) => s.lastName ?? "" },
      { id: "prenom", accessorFn: (s) => s.firstName ?? "" },
      { id: "filiere", accessorFn: (s) => s.programTrackName ?? "" },
      { id: "classe", accessorFn: (s) => s.className ?? "" },
      { id: "age", accessorFn: (s) => computeAge(s.dateOfBirth) ?? -1 },
      { id: "sexe", accessorFn: (s) => String(s.sex) },
      { id: "email", accessorFn: (s) => s.email ?? "" },
      { id: "phone", accessorFn: (s) => s.phone ?? "" },
      { id: "parents", accessorFn: (s) => s.parentCount ?? 0 },
      { id: "rate", accessorFn: (s) => rates[s.studentId]?.rate ?? -1 },
    ],
    [rates],
  );

  const table = useReactTable({
    data: rows,
    columns: sortColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const sortDirectionOf = (id: string): "asc" | "desc" | null => {
    const s = sorting.find((x) => x.id === id);
    return s ? (s.desc ? "desc" : "asc") : null;
  };
  const toggleSort = (id: string) => table.getColumn(id)?.toggleSorting();

  const pageRows = table.getRowModel().rows;
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.original.studentId));
  const togglePageSelection = () => {
    const target = !allPageSelected;
    pageRows.forEach((r) => {
      const id = r.original.studentId;
      if (selected.has(id) !== target) onToggle(id);
    });
  };

  const visibleBaseColumns = BASE_COLUMNS.filter((c) => !hidden.has(c.id));
  const hiddenBaseColumns = BASE_COLUMNS.filter((c) => hidden.has(c.id));

  const hideColumn = (id: BaseColumnId) => setHidden((p) => new Set(p).add(id));
  const showColumn = (id: BaseColumnId) =>
    setHidden((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });

  const addCustomColumn = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    setCustomCols((p) => [...p, { id: `c_${Date.now()}`, label }]);
    setNewFieldLabel("");
  };
  const removeCustomColumn = (id: string) => setCustomCols((p) => p.filter((c) => c.id !== id));

  const setSearch = (v: string) => {
    setSearchState(v);
    table.setPageIndex(0);
  };
  const setFilter = (patch: Partial<ColumnFilters>) => {
    setColFilters((p) => ({ ...p, ...patch }));
    table.setPageIndex(0);
  };
  const resetFilters = () => {
    setSearchState("");
    setColFilters(EMPTY_FILTERS);
    table.setPageIndex(0);
  };

  return {
    // recherche / filtres
    search,
    setSearch,
    colFilters,
    setFilter,
    resetFilters,
    activeFilterCount,
    filiereOptions,
    classeOptions,

    // lignes
    rows,
    pageRows,
    pageIndex: table.getState().pagination.pageIndex,
    pageCount: table.getPageCount() || 1,
    canPreviousPage: table.getCanPreviousPage(),
    canNextPage: table.getCanNextPage(),
    previousPage: () => table.previousPage(),
    nextPage: () => table.nextPage(),

    // tri
    sortDirectionOf,
    toggleSort,

    // édition locale (non persistée)
    editMode,
    setEditMode,
    valueOf,
    setField,

    // colonnes
    visibleBaseColumns,
    hiddenBaseColumns,
    hideColumn,
    showColumn,
    customCols,
    addCustomColumn,
    removeCustomColumn,
    newFieldLabel,
    setNewFieldLabel,

    // sélection
    selecting,
    allPageSelected,
    togglePageSelection,
  };
}

export type StudentsTableState = ReturnType<typeof useStudentsTable>;
