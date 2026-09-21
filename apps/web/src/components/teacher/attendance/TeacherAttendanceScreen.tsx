"use client";

import { useState, useMemo } from "react";
import { format, isToday, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ClipboardCheck,
  Clock,
  MapPin,
  Users,
  Search,
  ChevronRight,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AttendanceList } from "@/components/session/AttendanceList";

export interface TeacherScheduleInfoItem {
  id: string;
  status: string;
  notes: string | null;
  startTime: Date | string;
  endTime: Date | string;
  course: { id: string; name: string } | null;
  room: { id: string; name: string } | null;
  class: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
}

interface TeacherAttendanceScreenProps {
  teacherId: string;
  initialSchedules: TeacherScheduleInfoItem[];
}

type PeriodFilter = "today" | "upcoming" | "past" | "all";

// Ghost Empty State standard — docs/skills/ghost-empty-state/SKILL.md
function GhostEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-foreground/15 px-6 py-16 text-center bg-foreground/[0.01]">
      <svg width="140" height="104" viewBox="0 0 140 104" fill="none" className="text-foreground">
        {/* Row 1 — closest, highest opacity */}
        <rect x="10" y="8" width="120" height="26" rx="8" fill="currentColor" fillOpacity="0.08" />
        <rect x="10" y="8" width="120" height="26" rx="8" stroke="currentColor" strokeOpacity="0.12" />
        <line x1="34" y1="21" x2="96" y2="21" stroke="currentColor" strokeOpacity="0.15" />
        <circle cx="112" cy="21" r="2" fill="currentColor" fillOpacity="0.15" />

        {/* Row 2 — fading */}
        <rect x="10" y="39" width="120" height="26" rx="8" fill="currentColor" fillOpacity="0.05" />
        <line x1="34" y1="52" x2="88" y2="52" stroke="currentColor" strokeOpacity="0.1" />
        <circle cx="104" cy="52" r="2" fill="currentColor" fillOpacity="0.1" />

        {/* Row 3 — nearly gone */}
        <rect x="10" y="70" width="120" height="26" rx="8" fill="currentColor" fillOpacity="0.03" />
        <line x1="34" y1="83" x2="80" y2="83" stroke="currentColor" strokeOpacity="0.06" />
        <circle cx="96" cy="83" r="2" fill="currentColor" fillOpacity="0.06" />

        {/* The one quiet "empty" marker, centered over the stack */}
        <circle cx="70" cy="52" r="16" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
      </svg>

      <div className="grid gap-1 max-w-xs">
        <p className="text-sm font-semibold text-foreground/80">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function TeacherAttendanceScreen({
  teacherId,
  initialSchedules,
}: TeacherAttendanceScreenProps) {
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherScheduleInfoItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const now = new Date();

  // Normalize dates in items
  const items = useMemo(() => {
    return initialSchedules.map((item) => ({
      ...item,
      start: new Date(item.startTime),
      end: new Date(item.endTime),
    }));
  }, [initialSchedules]);

  // Compute status for each session
  const getSessionState = (start: Date, end: Date) => {
    if (now >= start && now <= end) return "IN_PROGRESS";
    if (now > end) return "PAST";
    return "UPCOMING";
  };

  // Filter items based on tab & search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Period filter
      if (period === "today" && !isToday(item.start)) return false;
      if (period === "upcoming" && (isBefore(item.start, now) && !isToday(item.start))) return false;
      if (period === "past" && isAfter(item.end, now)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const courseName = item.course?.name?.toLowerCase() ?? "";
        const className = item.class?.name?.toLowerCase() ?? "";
        const roomName = item.room?.name?.toLowerCase() ?? "";
        if (!courseName.includes(q) && !className.includes(q) && !roomName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [items, period, searchQuery, now]);

  // Stats summary
  const todayCount = useMemo(() => items.filter((i) => isToday(i.start)).length, [items]);
  const liveCount = useMemo(
    () => items.filter((i) => now >= i.start && now <= i.end).length,
    [items, now]
  );

  const handleOpenAttendance = (item: TeacherScheduleInfoItem) => {
    setSelectedSchedule(item);
    setIsSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Enseignant
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                {liveCount} cours en cours
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Présences</h1>
          <p className="text-sm text-muted-foreground">
            Suivez et validez les émargements des étudiants pour vos séances de cours.
          </p>
        </div>

        <div className="mt-2 sm:mt-0 text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60 w-fit">
          <CalendarDays className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">
            {format(now, "EEEE d MMMM yyyy", { locale: fr })}
          </span>
        </div>
      </div>

      {/* Barre de filtres & recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filtres par période */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 border border-border/60">
          <button
            onClick={() => setPeriod("today")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5",
              period === "today"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Aujourd'hui</span>
            {todayCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-semibold">
                {todayCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setPeriod("upcoming")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
              period === "upcoming"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            À venir
          </button>
          <button
            onClick={() => setPeriod("past")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
              period === "past"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Passées
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
              period === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Toutes
          </button>
        </div>

        {/* Input de recherche */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un cours, salle..."
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Liste des séances */}
      {filteredItems.length === 0 ? (
        <GhostEmptyState
          title="Aucune séance trouvée"
          description={
            searchQuery
              ? `Aucun résultat ne correspond à "${searchQuery}".`
              : period === "today"
              ? "Vous n'avez aucun cours programmé aujourd'hui."
              : "Aucune séance ne correspond aux critères sélectionnés."
          }
        />
      ) : (
        <div className="grid gap-3.5">
          {filteredItems.map((item) => {
            const state = getSessionState(item.start, item.end);
            const isLive = state === "IN_PROGRESS";
            const isFinished = state === "PAST";

            return (
              <div
                key={item.id}
                onClick={() => handleOpenAttendance(item)}
                className={cn(
                  "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer bg-card hover:border-foreground/20 hover:shadow-xs",
                  isLive && "border-emerald-500/30 bg-emerald-500/[0.02]"
                )}
              >
                {/* Information principale de la séance */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      isLive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : isFinished
                        ? "border-border bg-muted/40 text-muted-foreground"
                        : "border-primary/20 bg-primary/10 text-primary"
                    )}
                  >
                    <ClipboardCheck className="size-5.5" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.course?.name ?? "Cours sans nom"}
                      </h3>
                      {isLive && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-medium gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          </span>
                          En cours
                        </Badge>
                      )}
                      {isFinished && (
                        <Badge variant="secondary" className="text-[10px] text-muted-foreground font-medium">
                          Terminée
                        </Badge>
                      )}
                      {!isLive && !isFinished && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-medium">
                          À venir
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {item.class?.name && (
                        <span className="font-medium text-foreground/80">
                          {item.class.name}
                          {item.group?.name ? ` · ${item.group.name}` : ""}
                        </span>
                      )}
                      {item.room?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground/70" />
                          {item.room.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horaire & Bouton d'action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                  <div className="flex flex-col sm:items-end gap-0.5">
                    <span className="text-xs font-semibold tabular-nums text-foreground flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground sm:hidden" />
                      {format(item.start, "HH:mm")} - {format(item.end, "HH:mm")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {format(item.start, "EEEE d MMMM", { locale: fr })}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isLive ? "default" : "outline"}
                    className="h-8 gap-1.5 text-xs font-medium shadow-none shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAttendance(item);
                    }}
                  >
                    <span>Émargements</span>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet / Tiroir des émargements d'une séance */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0 border-l">
          {selectedSchedule && (
            <>
              <SheetHeader className="p-4 border-b border-border bg-muted/20">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider">
                      Émargements
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(selectedSchedule.startTime), "EEEE d MMM", { locale: fr })}
                    </span>
                  </div>
                  <SheetTitle className="text-lg font-bold text-foreground">
                    {selectedSchedule.course?.name ?? "Cours"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2">
                    {selectedSchedule.class?.name && <span>{selectedSchedule.class.name}</span>}
                    {selectedSchedule.room?.name && <span>• {selectedSchedule.room.name}</span>}
                    <span>
                      • {format(new Date(selectedSchedule.startTime), "HH:mm")} -{" "}
                      {format(new Date(selectedSchedule.endTime), "HH:mm")}
                    </span>
                  </SheetDescription>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4">
                <AttendanceList scheduleId={selectedSchedule.id} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
