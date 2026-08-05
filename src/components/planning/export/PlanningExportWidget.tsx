"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportButton } from "@/components/ui/ExportButton";
import { SCHEDULE_EXPORT_COLUMNS } from "@/components/schedule/scheduleExportColumns";
import { getSchedulesAction } from "@/services/schedule";
import type { GetSchedulesReturn } from "@/services/schedule";
import type { PlanningResources } from "@/services/planning";
import { cn } from "@/lib/utils";

type Axis = "class" | "group" | "teacher" | "room";
type Period = "day" | "week" | "month" | "custom";

const AXIS_LABEL: Record<Axis, string> = {
  class: "Classe entière",
  group: "Groupe",
  teacher: "Enseignant",
  room: "Salle",
};

const PERIOD_LABEL: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  custom: "Plage perso.",
};

function resolveRange(
  period: Period,
  custom: { start: string; end: string },
): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "custom": {
      const s = custom.start ? startOfDay(new Date(custom.start)) : startOfDay(now);
      const e = custom.end ? endOfDay(new Date(custom.end)) : endOfDay(now);
      return { start: s, end: e };
    }
  }
}

interface Props {
  classId: string;
  resources: NonNullable<PlanningResources>;
}

export function PlanningExportWidget({ classId, resources }: Props) {
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
  const [entityId, setEntityId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("week");
  const [custom, setCustom] = useState({ start: "", end: "" });

  const [rows, setRows] = useState<GetSchedulesReturn>([]);
  const [loading, setLoading] = useState(false);

  const entityOptions = useMemo<{ id: string; name: string }[]>(() => {
    if (axis === "group") return resources.groups;
    if (axis === "teacher") return teachers;
    if (axis === "room") return resources.rooms;
    return [];
  }, [axis, resources.groups, resources.rooms, teachers]);

  useEffect(() => {
    if (axis === "class") setEntityId("");
    else setEntityId((prev) => (entityOptions.some((o) => o.id === prev) ? prev : entityOptions[0]?.id ?? ""));
  }, [axis, entityOptions]);

  const range = useMemo(() => resolveRange(period, custom), [period, custom]);
  const needsEntity = axis !== "class";
  const ready = !needsEntity || Boolean(entityId);

  useEffect(() => {
    if (!open) return;
    if (!ready) {
      setRows([]);
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
        let filtered = data;
        if (axis === "group") {
          filtered = data.filter((r) => !r.group || r.group.id === entityId);
        }
        setRows(filtered);
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

  const periodLabel = `${format(range.start, "d MMM", { locale: fr })} – ${format(range.end, "d MMM yyyy", { locale: fr })}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="size-4" /> Exporter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div>
          <p className="text-sm font-semibold">Exporter le planning</p>
          <p className="text-xs text-muted-foreground">Choisis le périmètre et la période.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Périmètre</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(AXIS_LABEL) as Axis[]).map((a) => (
              <button
                key={a}
                onClick={() => setAxis(a)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                  axis === a
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "hover:bg-accent/40",
                )}
              >
                {AXIS_LABEL[a]}
              </button>
            ))}
          </div>
        </div>

        {needsEntity && (
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={`Choisir ${AXIS_LABEL[axis].toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {entityOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Période</label>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={custom.start}
                onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs"
              />
              <input
                type="date"
                value={custom.end}
                onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="min-w-0 text-xs text-muted-foreground">
            <p className="truncate">{periodLabel}</p>
            <p className="tabular-nums">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> chargement…
                </span>
              ) : (
                `${rows.length} séance${rows.length > 1 ? "s" : ""}`
              )}
            </p>
          </div>
          <ExportButton
            disabled={loading || rows.length === 0}
            size="sm"
            getConfig={() => ({
              columns: SCHEDULE_EXPORT_COLUMNS,
              rows,
              filename: `planning-${scopeLabel.replace(/[^\w-]+/g, "-").toLowerCase()}-${format(range.start, "yyyy-MM-dd")}`,
              title: `Planning · ${scopeLabel}`,
              subtitle: periodLabel,
              sheetName: "Planning",
            })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
