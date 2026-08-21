"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { SCHEDULE_EXPORT_COLUMNS } from "@/components/schedule/scheduleExportColumns";
import { getSchedulesAction } from "@/services/schedule";
import type { GetSchedulesReturn } from "@/services/schedule";
import type { PlanningResources } from "@/services/planning";
import { runExport } from "@/lib/export/exporters";
import type { ExportFormat } from "@/lib/export/types";
import { AXIS_LABEL } from "@/components/planning/export/constants";
import type { Axis, Period } from "@/components/planning/export/constants";
import { resolveRange } from "@/components/planning/export/utils";

const CUSTOM_DATE_DEBOUNCE_MS = 400;
const DONE_RESET_MS = 2000;

interface UsePlanningExportArgs {
  classId: string;
  resources: NonNullable<PlanningResources>;
}

export function usePlanningExport({ classId, resources }: UsePlanningExportArgs) {
  const teachers = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of resources.courses) {
      for (const t of c.teachers) {
        if (!map.has(t.id)) map.set(t.id, t.name ?? t.email ?? "Enseignant");
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [resources.courses]);

  const [open, setOpen] = useState(false);
  const [axis, setAxis] = useState<Axis>("class");
  const [entityId, setEntityId] = useState("");
  const [period, setPeriod] = useState<Period>("week");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");

  const [rows, setRows] = useState<GetSchedulesReturn>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce des dates custom : évite un refetch à chaque frappe dans les <input type="date">.
  const [debouncedCustom, setDebouncedCustom] = useState(custom);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedCustom(custom), CUSTOM_DATE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [custom]);

  const entityOptions = useMemo<{ id: string; name: string }[]>(() => {
    if (axis === "group") return resources.groups;
    if (axis === "teacher") return teachers;
    if (axis === "room") return resources.rooms;
    return [];
  }, [axis, resources.groups, resources.rooms, teachers]);

  useEffect(() => {
    if (axis === "class") {
      setEntityId("");
      return;
    }
    setEntityId((prev) => (entityOptions.some((o) => o.id === prev) ? prev : entityOptions[0]?.id ?? ""));
  }, [axis, entityOptions]);

  const range = useMemo(() => resolveRange(period, debouncedCustom), [period, debouncedCustom]);
  const needsEntity = axis !== "class";
  const ready = !needsEntity || Boolean(entityId);

  // Ne fetch que si le panneau est ouvert : évite un appel réseau au montage / avant toute interaction.
  useEffect(() => {
    if (!open || !ready) {
      if (!ready) setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params =
      axis === "teacher"
        ? { rangeStart: range.start, rangeEnd: range.end, teacherId: entityId }
        : axis === "room"
          ? { rangeStart: range.start, rangeEnd: range.end, roomId: entityId }
          : { rangeStart: range.start, rangeEnd: range.end, classId };
    getSchedulesAction(params)
      .then((res) => {
        if (cancelled) return;
        const data = "data" in res && res.data ? res.data : [];
        const filtered = axis === "group" ? data.filter((r) => !r.group || r.group.id === entityId) : data;
        setRows(filtered);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, axis, entityId, classId, range.start, range.end, ready]);

  const scopeLabel = useMemo(() => {
    if (axis === "class") return resources.class?.name ?? "Classe";
    const opt = entityOptions.find((o) => o.id === entityId);
    return `${AXIS_LABEL[axis]} · ${opt?.name ?? entityId}`;
  }, [axis, entityId, entityOptions, resources.class?.name]);

  const periodLabel = useMemo(
    () => `${format(range.start, "d MMM", { locale: fr })} – ${format(range.end, "d MMM yyyy", { locale: fr })}`,
    [range.start, range.end],
  );

  const handleExport = useCallback(async () => {
    if (loading || busy || rows.length === 0) return;
    setBusy(true);
    setDone(false);
    setError(null);
    try {
      await runExport(exportFormat, {
        columns: SCHEDULE_EXPORT_COLUMNS,
        rows,
        filename: `planning-${scopeLabel.replace(/[^\w-]+/g, "-").toLowerCase()}-${format(range.start, "yyyy-MM-dd")}`,
        title: `Planning · ${scopeLabel}`,
        subtitle: periodLabel,
        sheetName: "Planning",
      });
      setDone(true);
      clearTimeout(doneTimeoutRef.current);
      doneTimeoutRef.current = setTimeout(() => setDone(false), DONE_RESET_MS);
      setOpen(false);
    } catch (err) {
      console.error(err);
      setError("export_failed");
    } finally {
      setBusy(false);
    }
  }, [loading, busy, rows, exportFormat, scopeLabel, range.start, periodLabel]);

  // Nettoyage du timeout "Téléchargé" si le composant démonte pendant la fenêtre de 2s.
  useEffect(() => () => clearTimeout(doneTimeoutRef.current), []);

  return {
    // panneau
    open,
    setOpen,
    // filtres
    axis,
    setAxis,
    entityId,
    setEntityId,
    entityOptions,
    needsEntity,
    period,
    setPeriod,
    custom,
    setCustom,
    periodLabel,
    // format + export
    exportFormat,
    setExportFormat,
    handleExport,
    // état async
    rows,
    loading,
    busy,
    done,
    error,
    scopeLabel,
  };
}