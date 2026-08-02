"use client";

import { GraduationCap, Users, UserRound, DoorOpen, CircleDashed } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import type { ScheduleStatus } from "@/generated/prisma/client";
import { SCHEDULE_STATUS_VALUES } from "./constants";

export { SCHEDULE_STATUS_VALUES } from "./constants";
export { FilterShell } from "./FilterShell";
export { matchesPlanningFilters } from "./matchSchedule";

export const SCHEDULE_STATUS_OPTIONS: { value: ScheduleStatus; label: string; dot: string }[] = [
  { value: "PENDING",   label: "En attente",  dot: "bg-yellow-400" },
  { value: "COMPLETED", label: "Terminé",      dot: "bg-green-500"  },
  { value: "CANCELED",  label: "Annulé",       dot: "bg-red-500"    },
  { value: "MISSED",    label: "Manqué",       dot: "bg-gray-400"   },
];

interface BaseFilterProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

export function ClassFilter({ options, value, onChange }: BaseFilterProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <GraduationCap className="size-3.5" /> Classe
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <MultiSelect options={options} value={value} onChange={onChange} placeholder="Toutes les classes" />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function GroupFilter({ options, value, onChange, disabled }: BaseFilterProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <Users className="size-3.5" /> Groupe
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <MultiSelect
          options={options}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={disabled ? "Sélectionnez une classe" : "Tous les groupes"}
          emptyText="Aucun groupe."
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function TeacherFilter({ options, value, onChange }: BaseFilterProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <UserRound className="size-3.5" /> Enseignant
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <MultiSelect options={options} value={value} onChange={onChange} placeholder="Tous les enseignants" />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function RoomFilter({ options, value, onChange }: BaseFilterProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <DoorOpen className="size-3.5" /> Salle
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <MultiSelect options={options} value={value} onChange={onChange} placeholder="Toutes les salles" />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface StatusFilterProps {
  value: ScheduleStatus[];
  onChange: (v: ScheduleStatus[]) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const options: MultiSelectOption[] = SCHEDULE_STATUS_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
  }));
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <CircleDashed className="size-3.5" /> Statut
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <MultiSelect
          options={options}
          value={value}
          onChange={(v) => onChange(v as ScheduleStatus[])}
          placeholder="Tous les statuts"
          searchable={false}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
