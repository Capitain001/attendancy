// src/components/teacher/planning/ui/TeacherPlanningDialog.tsx
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Ban, BookOpen, Calendar as CalendarIcon, Clock, Loader2, MapPin, Trash2, Users } from "lucide-react";
import type { ScheduleEvent } from "@/components/event-calendar";
import { NO_GROUP } from "@/components/planning/coursePlanning";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PlanningResources } from "@/services/planning";
import { isScheduleEditable, isSlotElapsed } from "@/services/planning/policy";
import { resolveScheduleUiStatus, SCHEDULE_UI_STATUS_LABEL, type ScheduleUiStatus } from "@/services/schedule/policy";
import { formatDurationMinutes } from "../utils";
import { useTeacherPlanningForm, useTeacherPlanningAvailability, TIME_OPTIONS } from "@/hooks/data/planning/teacher";

const STATUS_BADGE_STYLES: Record<ScheduleUiStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  ONGOING: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  CANCELED: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  MISSED: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
};

export interface TeacherPlanningDialogProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void | Promise<void>;
  onDelete: (eventId: string) => void | Promise<void>;
  classId: string;
  teacherId?: string;
  resources: NonNullable<PlanningResources>;
}

export function TeacherPlanningDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  classId,
  teacherId,
  resources,
}: TeacherPlanningDialogProps) {
  const isCreation = !event?.id;
  const isLocked = Boolean(event?.meta.isLocked);
  const isPast = event ? isSlotElapsed({ start: event.start, end: event.end }) : false;
  const scheduleEditable =
    isCreation ||
    (event
      ? isScheduleEditable({
          status: (event.meta.status ?? "PENDING") as any,
          isLocked,
          start: event.start,
          end: event.end,
        })
      : false);
  const blockedCreation = isCreation && isPast;

  const {
    form,
    setForm,
    error,
    saving,
    canceling,
    deleting,
    isBusy,
    durationMinutes,
    filteredEndTimeOptions,
    selectedCourseName,
    selectedRoomName,
    selectedGroupName,
    handleStartTimeChange,
    handleEndTimeChange,
    handleCourseChange,
    handleSubmit,
    handleCancelSchedule,
    handleRemove,
  } = useTeacherPlanningForm({
    event,
    isOpen,
    classId,
    teacherId,
    resources,
    onClose,
    onSave,
    onDelete,
  });

  const { hasConflict, isChecking: isCheckingAvailability, isRoomAvailable } = useTeacherPlanningAvailability({
    form,
    classId,
    resources,
    event,
    enabled: isOpen && scheduleEditable,
  });

  const uiStatus = useMemo<ScheduleUiStatus>(() => {
    if (!event) return "PENDING";
    return resolveScheduleUiStatus(
      {
        status: form.status ?? event.meta.status ?? "PENDING",
        startTime: event.start,
        endTime: event.end,
      },
      new Date()
    );
  }, [event, form.status]);

  const formattedDate = useMemo(
    () => format(form.startDate, "EEEE d MMMM yyyy", { locale: fr }),
    [form.startDate]
  );

  const hasCourses = resources.courses.length > 0;
  const hasRooms = resources.rooms.length > 0;
  const showRoomSelect = resources.rooms.length > 1;
  const showGroupSelect = resources.groups.length > 0;

  return (
    <Drawer open={isOpen && !blockedCreation} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="p-0">
        <div className="mx-auto flex w-full max-w-lg flex-col">
          <DrawerHeader className="border-b pb-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <DrawerTitle className="text-base font-semibold">
                {isCreation
                  ? "Nouvelle séance"
                  : scheduleEditable
                    ? "Modifier la séance"
                    : "Détails de la séance"}
              </DrawerTitle>
              {!isCreation && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                    STATUS_BADGE_STYLES[uiStatus]
                  )}
                >
                  {SCHEDULE_UI_STATUS_LABEL[uiStatus]}
                </span>
              )}
            </div>
            <DrawerDescription className="flex items-center gap-1.5 text-xs capitalize">
              <CalendarIcon className="size-3.5 shrink-0" />
              <span>{formattedDate}</span>
              {durationMinutes > 0 && (
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] normal-case text-foreground/80">
                  {formatDurationMinutes(durationMinutes)}
                </span>
              )}
            </DrawerDescription>
          </DrawerHeader>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4">
            {!hasCourses || !hasRooms ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                <BookOpen className="mb-2 size-8 stroke-1 opacity-50" />
                <p className="text-sm font-medium text-foreground">
                  {!hasCourses
                    ? "Aucun cours dans cette classe"
                    : "Aucune salle disponible"}
                </p>
                <p className="mt-1 text-xs">
                  {!hasCourses
                    ? "Créez d'abord un cours dans votre classe pour pouvoir planifier une séance."
                    : "Aucune salle n'est configurée pour cet espace."}
                </p>
              </div>
            ) : !scheduleEditable ? (
              /* Vue lecture seule (séance passée, terminée, annulée ou verrouillée) */
              <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cours</p>
                  <p className="font-medium text-foreground">{selectedCourseName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Horaire</p>
                    <p className="flex items-center gap-1.5 font-mono text-xs font-medium">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {form.startTime} – {form.endTime}
                    </p>
                  </div>
                  {selectedRoomName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu</p>
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span className="truncate">{selectedRoomName}</span>
                      </p>
                    </div>
                  )}
                </div>

                {selectedGroupName && (
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground">Groupe</p>
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      <Users className="size-3.5 text-muted-foreground" />
                      {selectedGroupName}
                    </p>
                  </div>
                )}

                {form.notes && (
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground">Notes de séance</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs text-foreground/90">
                      {form.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Formulaire d'édition / création mobile-first */
              <>
                {/* Sélection du cours */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Cours
                  </label>
                  <Select value={form.courseId} onValueChange={handleCourseChange}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Sélectionner un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plage horaire */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Début
                    </label>
                    <Select value={form.startTime} onValueChange={handleStartTimeChange}>
                      <SelectTrigger className="w-full bg-background font-mono text-xs">
                        <SelectValue placeholder="Début" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Fin
                    </label>
                    <Select value={form.endTime} onValueChange={handleEndTimeChange}>
                      <SelectTrigger className="w-full bg-background font-mono text-xs">
                        <SelectValue placeholder="Fin" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEndTimeOptions.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Salle (affichée uniquement si l'espace perso possède plusieurs salles) */}
                {showRoomSelect && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Salle
                    </label>
                    <Select
                      value={form.roomId}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, roomId: v }))}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Choisir une salle" />
                      </SelectTrigger>
                      <SelectContent>
                        {resources.rooms.map((room) => {
                          const available = isRoomAvailable(room.id);
                          return (
                            <SelectItem key={room.id} value={room.id}>
                              { available ? room.name : `${room.name} (occupée)` }
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Groupe (affiché uniquement si la classe possède des groupes) */}
                {showGroupSelect && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Groupe
                    </label>
                    <Select
                      value={form.groupId}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, groupId: v }))}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Toute la classe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_GROUP}>Toute la classe</SelectItem>
                        {resources.groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes de séance intégrées directement */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Notes de séance <span className="font-normal opacity-70">(optionnel)</span>
                  </label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Consigne, chapitre abordé, matériel..."
                    className="resize-none bg-background text-sm"
                  />
                </div>

                {/* Alerte de conflit de créneau en temps réel */}
                {hasConflict && !isCheckingAvailability && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Un conflit de disponibilité est détecté sur ce créneau.</span>
                  </div>
                )}
              </>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/15 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </div>
            )}
          </div>

          <DrawerFooter className="border-t pt-3">
            {!hasCourses || !hasRooms || !scheduleEditable ? (
              <Button variant="outline" onClick={onClose} className="w-full">
                Fermer
              </Button>
            ) : isCreation ? (
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button
                  onClick={handleSubmit}
                  disabled={isBusy || !form.courseId}
                  className="w-full sm:flex-1"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Créer la séance
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isBusy}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isBusy || !form.courseId}
                  className="w-full"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelSchedule}
                    disabled={isBusy}
                    className="w-full text-xs"
                  >
                    {canceling ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Ban className="size-3.5" />
                    )}
                    Annuler la séance
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isBusy}
                    className="w-full text-xs"
                  >
                    {deleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
