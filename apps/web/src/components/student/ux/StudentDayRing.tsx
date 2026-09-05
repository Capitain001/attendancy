"use client";

import { cloneElement, isValidElement, useState } from "react";
import { CalendarCheck, Clock, Hourglass, Info, UserCheck } from "lucide-react";
import { AnalyticRing, type RingSegment } from "@/components/ux/analytic-ring";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StudentDayRingProps {
  doneSessions: number;
  totalSessions: number;
  absences: number;
  doneMinutes: number;
  totalMinutes: number;
  /** Délai/heure du prochain cours, déjà formaté côté page ("25 min", "14:00", "mer. 3 déc."). */
  nextLead: string | null;
  size?: number;
}

/** "150" → "2 h 30", "240" → "4 h", "0" → "0 h". */
function formatHours(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/**
 * Anneau « ta journée » : 4 onglets (séances, absences, prochain cours, heures).
 * Cliquer un segment affiche son détail au centre.
 */
export function StudentDayRing({
  doneSessions,
  totalSessions,
  absences,
  doneMinutes,
  totalMinutes,
  nextLead,
  size = 320,

}: StudentDayRingProps) {
  const [active, setActive] = useState("sessions");

  const segments: RingSegment[] = [
    { value: "sessions", label: "Séances du jour", color: "#7FB3D5", icon: <CalendarCheck size={20} />, weight: 4 },
    { value: "attendance", label: "Assiduité du jour", color: "#F4B9C8", icon: <UserCheck size={20} />, weight: 4 },
    { value: "hours", label: "Heures cumulées", color: "#E5C07B", icon: <Hourglass size={20} />, weight: 4 },
    { value: "next", label: "Prochain cours", color: "#C9A7EB", icon: <Clock size={20} />, weight: 1 },
  ];

  // Assiduité du jour : part de présences sur les séances déjà clôturées
  // (seules celles-ci ont un verdict ; absences = ABSENT du jour).
  const settled = doneSessions;
  const present = Math.max(0, settled - absences);
  const attendanceRate = settled > 0 ? Math.round((present / settled) * 100) : 100;

  const center: Record<string, { value: string; hint: string; description: string }> = {
    sessions: {
      value: `${doneSessions} / ${totalSessions}`,
      hint: `${doneSessions} effectuée${doneSessions > 1 ? "s" : ""} sur ${totalSessions}`,
      description:
        "Nombre de séances déjà terminées aujourd'hui sur le total prévu (cours annulés exclus).",
    },
    attendance: {
      value: `${attendanceRate}%`,
      hint:
        absences === 0
          ? "Aucune absence aujourd'hui"
          : `${present} présence${present > 1 ? "s" : ""} sur ${settled}`,
      description:
        "Part de présences sur les séances du jour déjà clôturées par l'enseignant. Une absence n'est comptée qu'après clôture.",
    },
    next: {
      value: nextLead ?? "—",
      hint: nextLead ? "avant le prochain cours" : "plus de cours aujourd'hui",
      description:
        "Temps restant avant ta prochaine séance (ou son heure si elle est plus lointaine).",
    },
    hours: {
      value: `${formatHours(doneMinutes)} / ${formatHours(totalMinutes)}`,
      hint: "heures effectuées sur prévues",
      description:
        "Volume horaire de cours déjà suivi aujourd'hui sur le total prévu dans votre planning.",
    },
  };

  return (
    <AnalyticRing
      segments={segments}
      value={active}
      onValueChange={setActive}
      size={size}
      segmentGap={23}
      thickness={40}
    >
      {(seg) => {
        const info = seg ? center[seg.value] : null;
        const isEmpty = !info?.value || info.value === "—";
        return (
          <div className="flex flex-col items-center justify-center gap-1.5">
            {isEmpty && isValidElement(seg?.icon) ? (
              <span className="flex h-[2.75rem] items-center text-muted-foreground/60">
                {cloneElement(seg.icon as React.ReactElement<{ size?: number }>, { size: 40 })}
              </span>
            ) : (
              <span className="font-serif text-4xl font-bold tabular-nums leading-none text-foreground inline-block w-max">
                {info?.value}
              </span>
            )}

            <span className="flex max-w-[12rem] items-center gap-1.5 text-sm font-semibold text-foreground">
              {seg?.label}
              {info?.description && (
                <Popover>
                  <PopoverTrigger
                    aria-label={`À propos : ${seg?.label}`}
                    className="rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Info size={14} />
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="center"
                    sideOffset={8}
                    className="w-64 overflow-hidden p-0"
                  >
                    {/* En-tête : badge coloré + titre */}
                    <div
                      className="flex items-center gap-2.5 px-4 py-3"
                      style={{ backgroundColor: `${seg?.color}1f` }}
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-800"
                        style={{ backgroundColor: `${seg?.color}59` }}
                      >
                        {seg?.icon}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{seg?.label}</p>
                    </div>

                    {/* Corps : description + valeur */}
                    <div className="space-y-2 px-4 py-3">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {info.description}
                      </p>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Aujourd'hui
                        </span>
                        <span className="font-serif text-sm font-bold tabular-nums text-foreground">
                          {info.value}
                        </span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </span>

            {info?.hint && (
              <span className="max-w-[12rem] text-xs leading-tight text-muted-foreground">
                {info.hint}
              </span>
            )}
          </div>
        );
      }}
    </AnalyticRing>
  );
}


/* 
1. Valeur vide → icône : si info.value est absente ou "—" (ex. plus de cours), le centre affiche l'icône du segment agrandie (size: 40, via cloneElement) en gris doux, au lieu du tiret.

2. Taille des icônes de segment — 2 leviers :
- Prop size de l'icône lucide dans segments (passée de 15 → 22).
- ICON_BOX dans AnalyticRing qui clippait à 24px : maintenant auto = thickness * 0.7 (donc ~28 avec ton thickness={40}), et surchargeable via la nouvelle prop iconBox.


*/
