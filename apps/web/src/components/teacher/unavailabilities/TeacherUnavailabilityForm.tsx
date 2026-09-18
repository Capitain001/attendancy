"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function timeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours ?? 0, minutes ?? 0));
}

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
  const [type, setType] = useState<"WEEKLY" | "DATE_RANGE">(
    initialData?.type ?? "DATE_RANGE"
  );

  // States pour WEEKLY
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    initialData?.dayOfWeek?.toString() ?? "1"
  );
  const [startTime, setStartTime] = useState(
    dateToTime(initialData?.startTime) || "08:00"
  );
  const [endTime, setEndTime] = useState(
    dateToTime(initialData?.endTime) || "10:00"
  );

  // States pour DATE_RANGE
  const [startDateStr, setStartDateStr] = useState(
    dateToYMD(initialData?.startDate) || dateToYMD(new Date())
  );
  const [endDateStr, setEndDateStr] = useState(
    dateToYMD(initialData?.endDate) || dateToYMD(new Date())
  );

  // Reason
  const [reason, setReason] = useState(initialData?.reason ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      let payload: CreateUnavailabilityInput;

      if (type === "WEEKLY") {
        payload = {
          reason: reason.trim() || null,
          dayOfWeek: parseInt(dayOfWeek, 10),
          startDate: timeToDate(startTime),
          endDate: timeToDate(endTime),
        };
      } else {
        if (!startDateStr || !endDateStr) {
          throw new Error("Veuillez sélectionner les dates de début et de fin.");
        }
        payload = {
          reason: reason.trim() || null,
          dayOfWeek: null,
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr),
        };
      }

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-foreground">
      {/* Header Modal/Drawer style iOS */}
      <div className="flex items-center justify-between pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-base font-semibold">
          {initialData?.id ? "Modifier l'indisponibilité" : "Définir l'indisponibilité"}
        </span>
        <div className="w-8" />
      </div>

      {/* Selecteur de type (Segmented Control) */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setType("DATE_RANGE")}
          className={`rounded-lg py-2 text-xs font-medium transition-all ${
            type === "DATE_RANGE"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Ponctuelle (Dates)
        </button>
        <button
          type="button"
          onClick={() => setType("WEEKLY")}
          className={`rounded-lg py-2 text-xs font-medium transition-all ${
            type === "WEEKLY"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Récurrente (Hebdo)
        </button>
      </div>

      {/* Form Fields : Range style iOS / Pill inputs */}
      <div className="flex flex-col gap-2">
        {type === "DATE_RANGE" ? (
          <>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
              <Label className="text-sm font-medium text-foreground">Premier jour</Label>
              <Input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                required
                className="w-auto h-8 rounded-lg bg-muted border-none text-xs font-medium px-3 text-right"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
              <Label className="text-sm font-medium text-foreground">Dernier jour</Label>
              <Input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                required
                className="w-auto h-8 rounded-lg bg-muted border-none text-xs font-medium px-3 text-right"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
              <Label className="text-sm font-medium text-foreground">Jour</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="w-32 h-8 rounded-lg bg-muted border-none text-xs font-medium px-3">
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
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
              <Label className="text-sm font-medium text-foreground">Heure de début</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-28 h-8 rounded-lg bg-muted border-none text-xs font-medium px-3 text-center"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5">
              <Label className="text-sm font-medium text-foreground">Heure de fin</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-28 h-8 rounded-lg bg-muted border-none text-xs font-medium px-3 text-center"
              />
            </div>
          </>
        )}
      </div>

      {/* Note / Motif avec compteur de caractères (comme la maquette) */}
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
            className="resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 min-h-[80px]"
          />
          <div className="text-right text-[10px] text-muted-foreground mt-1">
            {reason.length} / {REASON_MAX_LENGTH}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight px-1">
          Cette note sera enregistrée dans votre planning d'absence.
        </p>
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Bouton de confirmation Full Width */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl py-6 text-sm font-semibold mt-2"
      >
        {isPending ? "Enregistrement..." : "Confirmer les dates"}
      </Button>
    </form>
  );
}