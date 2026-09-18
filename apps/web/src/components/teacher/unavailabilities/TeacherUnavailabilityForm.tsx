"use client";

import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState, useEffect } from "react";
import { createUnavailabilitySchema } from "@/services/teacher-unavailability/validation";
import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

function timeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

function dateToTime(d: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
}

function dateToYMD(d: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

export function TeacherUnavailabilityForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: TeacherUnavailabilityItem | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [type, setType] = useState<"WEEKLY" | "DATE_RANGE">(initialData?.type ?? "WEEKLY");
  
  // States pour WEEKLY
  const [dayOfWeek, setDayOfWeek] = useState<string>(initialData?.dayOfWeek?.toString() ?? "1");
  const [startTime, setStartTime] = useState(dateToTime(initialData?.startTime ?? null) || "08:00");
  const [endTime, setEndTime] = useState(dateToTime(initialData?.endTime ?? null) || "10:00");
  
  // States pour DATE_RANGE
  const [startDateStr, setStartDateStr] = useState(dateToYMD(initialData?.startDate ?? null));
  const [endDateStr, setEndDateStr] = useState(dateToYMD(initialData?.endDate ?? null));

  // Reason
  const [reason, setReason] = useState(initialData?.reason ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      let payload: any = { reason: reason || null };

      if (type === "WEEKLY") {
        payload.dayOfWeek = parseInt(dayOfWeek, 10);
        payload.startDate = timeToDate(startTime);
        payload.endDate = timeToDate(endTime);
      } else {
        payload.dayOfWeek = null;
        if (!startDateStr || !endDateStr) {
          throw new Error("Veuillez sélectionner les dates de début et de fin.");
        }
        payload.startDate = new Date(startDateStr);
        payload.endDate = new Date(endDateStr);
      }

      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="space-y-3">
        <Label>Type d'indisponibilité</Label>
        <RadioGroup 
          value={type} 
          onValueChange={(v) => setType(v as "WEEKLY" | "DATE_RANGE")}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="WEEKLY" id="r-weekly" />
            <Label htmlFor="r-weekly" className="font-normal cursor-pointer">Hebdomadaire (ex: tous les lundis matin)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="DATE_RANGE" id="r-daterange" />
            <Label htmlFor="r-daterange" className="font-normal cursor-pointer">Ponctuelle (ex: congés sur une période)</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="h-px bg-border" />

      {type === "WEEKLY" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Jour de la semaine</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un jour" />
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Heure de début</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Heure de fin</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date de début</Label>
            <Input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Date de fin</Label>
            <Input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} required />
          </div>
        </div>
      )}

      <div className="space-y-1.5 mt-2">
        <Label>Motif (Optionnel)</Label>
        <Textarea 
          placeholder="Ex: Réunion de département, Congés..." 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          className="resize-none"
          rows={3}
        />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
