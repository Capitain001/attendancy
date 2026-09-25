"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import type { CreateUnavailabilityInput } from "@/services/teacher-unavailability/validation";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

const REASON_MAX_LENGTH = 200;

function dateToTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
}

function dateToYMD(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0] ?? "";
}

/** Jour ISO (1 = lundi) d'une date "YYYY-MM-DD". Midi local : évite les décalages de fuseau. */
function isoDayFromYMD(ymd: string): number {
  const day = new Date(`${ymd}T12:00:00`).getDay();
  return day === 0 ? 7 : day;
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
      <Label htmlFor={htmlFor} className="cursor-pointer text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

const inputClass = "h-8 rounded-lg border-none bg-muted px-3 text-xs font-medium";

export interface TeacherUnavailabilityFormProps {
  initialData?: Partial<TeacherUnavailabilityItem> | null;
  onSubmit: (data: CreateUnavailabilityInput) => Promise<void>;
  onCancel: () => void;
}

export function TeacherUnavailabilityForm({
  initialData,
  onSubmit,
  onCancel,
}: TeacherUnavailabilityFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const initialStartYMD = dateToYMD(initialData?.startDate);

  // Axe 1 — Récurrence : un jour de semaine précis
  const [recurring, setRecurring] = useState(initialData?.dayOfWeek != null);
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    initialData?.dayOfWeek?.toString() ??
      (initialStartYMD ? String(isoDayFromYMD(initialStartYMD)) : "1"),
  );

  // Axe 2 — Période : obligatoire pour une absence ponctuelle, optionnelle si récurrente
  const [limitPeriod, setLimitPeriod] = useState(
    initialData?.dayOfWeek == null || initialData?.startDate != null,
  );
  const [startDateStr, setStartDateStr] = useState(initialStartYMD || dateToYMD(new Date()));
  const [endDateStr, setEndDateStr] = useState(
    dateToYMD(initialData?.endDate) || initialStartYMD || dateToYMD(new Date()),
  );

  // Axe 3 — Heures : sinon, journée entière
  const [timed, setTimed] = useState(initialData?.startTime != null);
  const [startTime, setStartTime] = useState(dateToTime(initialData?.startTime) || "08:00");
  const [endTime, setEndTime] = useState(dateToTime(initialData?.endTime) || "10:00");

  const [reason, setReason] = useState(initialData?.reason ?? "");

  const hasPeriod = !recurring || limitPeriod;

  const handleRecurringChange = (checked: boolean) => {
    setRecurring(checked);
    // Nouvelle récurrence : par défaut sans limite (sinon elle serait bornée au seul jour cliqué)
    if (checked && !initialData?.id) setLimitPeriod(false);
    if (!checked) setLimitPeriod(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      if (hasPeriod && (!startDateStr || !endDateStr)) {
        throw new Error("Veuillez sélectionner les dates de début et de fin.");
      }
      if (hasPeriod && startDateStr > endDateStr) {
        throw new Error("Le dernier jour doit être après le premier.");
      }
      if (timed && startTime >= endTime) {
        throw new Error("L'heure de fin doit être après l'heure de début.");
      }

      const payload: CreateUnavailabilityInput = {
        reason: reason.trim() || null,
        dayOfWeek: recurring ? parseInt(dayOfWeek, 10) : null,
        startDate: hasPeriod ? new Date(startDateStr) : null,
        endDate: hasPeriod ? new Date(endDateStr) : null,
        timeRange: timed ? { start: startTime, end: endTime } : null,
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-foreground">
      <div className="flex flex-col gap-2">
        {/* Récurrence hebdomadaire */}
        <Row label="Chaque semaine" htmlFor="unavailability-recurring">
          <Switch
            id="unavailability-recurring"
            checked={recurring}
            onCheckedChange={handleRecurringChange}
          />
        </Row>

        {recurring && (
          <Row label="Jour">
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className={`${inputClass} w-32`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        )}

        {/* Heures précises (sinon journée entière) */}
        <Row label="Heures précises" htmlFor="unavailability-timed">
          <Switch id="unavailability-timed" checked={timed} onCheckedChange={setTimed} />
        </Row>

        {timed && (
          <>
            <Row label="Heure de début">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={`${inputClass} w-28 text-center`}
              />
            </Row>
            <Row label="Heure de fin">
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={`${inputClass} w-28 text-center`}
              />
            </Row>
          </>
        )}

        {/* Période : facultative si récurrente */}
        {recurring && (
          <Row label="Limiter à une période" htmlFor="unavailability-period">
            <Switch
              id="unavailability-period"
              checked={limitPeriod}
              onCheckedChange={setLimitPeriod}
            />
          </Row>
        )}

        {hasPeriod && (
          <>
            <Row label="Premier jour">
              <Input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                required
                className={`${inputClass} w-auto text-right`}
              />
            </Row>
            <Row label="Dernier jour">
              <Input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                required
                className={`${inputClass} w-auto text-right`}
              />
            </Row>
          </>
        )}
      </div>

      {/* Note / Motif */}
      <div className="space-y-1.5 pt-1">
        <Label className="text-xs font-medium text-muted-foreground">
          Ajouter une note (optionnel)
        </Label>
        <div className="relative rounded-xl border border-border bg-muted/20 p-3 focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            placeholder="Ex: Congés, RDV Médical..."
            value={reason}
            maxLength={REASON_MAX_LENGTH}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px] resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
          <div className="mt-1 text-right text-[10px] text-muted-foreground">
            {reason.length} / {REASON_MAX_LENGTH}
          </div>
        </div>
        <p className="px-1 text-[11px] leading-tight text-muted-foreground">
          Cette note sera enregistrée dans votre planning d'absence.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl py-6 text-sm font-semibold"
      >
        {isPending ? "Enregistrement..." : "Confirmer les dates"}
      </Button>
    </form>
  );
}