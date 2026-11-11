
import { useMemo, type ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";

import type { ScheduleEvent } from "@/components/event-calendar";
import { NO_GROUP } from "@/components/planning/coursePlanning";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PlanningResources } from "@/services/planning";
import { isScheduleEditable } from "@/services/planning/policy";
import {
  resolveScheduleUiStatus,
  SCHEDULE_UI_STATUS_LABEL,
  type ScheduleUiStatus,
} from "@/services/schedule/policy";
import { useTeacherPlanningAvailability, useTeacherPlanningForm, TIME_OPTIONS } from "@/hooks/data/planning/teacher";
import { formatDurationMinutes } from "../utils";

const STATUS_TEXT_CLASS: Record<ScheduleUiStatus, string> = {
  PENDING: "text-amber-600 dark:text-amber-400",
  ONGOING: "text-green-600 dark:text-green-400",
  COMPLETED: "text-emerald-600 dark:text-emerald-400",
  CANCELED: "text-red-600 dark:text-red-400",
  MISSED: "text-orange-600 dark:text-orange-400",
};

export interface TeacherPlanningEditProps {
  event: ScheduleEvent; // id vide = création
  classId: string;
  onClassChange?: (classId: string) => void;
  classes?: Array<{ id: string; name: string }>;
  teacherId?: string;
  resources: NonNullable<PlanningResources>;
  onBack: () => void; // retour à la liste du jour (appelé aussi après save/delete par le hook)
  onSave: (event: ScheduleEvent) => void | Promise<void>;
  onDelete: (eventId: string) => void | Promise<void>;
  className?: string;
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm">{children}</dd>
    </div>
  );
}

export function TeacherPlanningEdit({
  event,
  classId,
  onClassChange,
  classes = [],
  teacherId,
  resources,
  onBack,
  onSave,
  onDelete,
  className,
}: TeacherPlanningEditProps) {
  const isCreation = !event.id;
  const scheduleEditable =
    isCreation ||
    isScheduleEditable({
      status: (event.meta.status ?? "PENDING") as any,
      isLocked: Boolean(event.meta.isLocked),
      start: event.start,
      end: event.end,
    });

  const {
    form, setForm, error, saving, canceling, deleting, isBusy, durationMinutes,
    filteredEndTimeOptions, selectedCourseName, selectedRoomName, selectedGroupName,
    handleStartTimeChange, handleEndTimeChange, handleCourseChange,
    handleSubmit, handleCancelSchedule, handleRemove,
  } = useTeacherPlanningForm({
    event,
    isOpen: true,
    classId,
    teacherId,
    resources,
    onClose: onBack,
    onSave,
    onDelete,
  });

  const { hasConflict, isChecking, isRoomAvailable } = useTeacherPlanningAvailability({
    form,
    classId,
    resources,
    event,
    enabled: scheduleEditable,
  });

  const uiStatus = useMemo<ScheduleUiStatus>(
    () =>
      resolveScheduleUiStatus(
        {
          status: form.status ?? event.meta.status ?? "PENDING",
          startTime: event.start,
          endTime: event.end,
        },
        new Date()
      ),
    [event, form.status]
  );

  const hasCourses = resources.courses.length > 0;
  const hasRooms = resources.rooms.length > 0;

  const currentClassName = useMemo(() => {
    return classes.find((c) => c.id === classId)?.name ?? "Classe";
  }, [classes, classId]);

  const title = isCreation ? "Nouvelle séance" : scheduleEditable ? "Modifier la séance" : "Détails de la séance";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-medium">{title}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {format(form.startDate, "EEEE d MMMM", { locale: fr })}
              {durationMinutes > 0 && (
                <span className="normal-case tabular-nums"> · {formatDurationMinutes(durationMinutes)}</span>
              )}
              {!isCreation && (
                <span className={cn("normal-case", STATUS_TEXT_CLASS[uiStatus])}>
                  {" "}· {SCHEDULE_UI_STATUS_LABEL[uiStatus]}
                </span>
              )}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-mr-2 -mt-1 shrink-0 text-muted-foreground"
          >
            <ChevronLeft className="size-4" />
            Retour
          </Button>
        </div>

        <div className="mt-6 pb-6">
          {!hasCourses || !hasRooms ? (
            <div>
              <p className="text-base font-medium">
                {!hasCourses ? "Aucun cours dans cette classe" : "Aucune salle disponible"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {!hasCourses
                  ? "Créez d'abord un cours dans votre classe pour pouvoir planifier une séance."
                  : "Aucune salle n'est configurée pour cet espace."}
              </p>
            </div>
          ) : !scheduleEditable ? (
            <dl className="divide-y">
              {classes.length > 0 && <Row label="Classe">{currentClassName}</Row>}
              <Row label="Cours">{selectedCourseName}</Row>
              <Row label="Horaire">
                <span className="tabular-nums">{form.startTime} – {form.endTime}</span>
              </Row>
              {selectedRoomName && <Row label="Lieu">{selectedRoomName}</Row>}
              {selectedGroupName && <Row label="Groupe">{selectedGroupName}</Row>}
              {form.notes && (
                <div className="py-3.5">
                  <dt className="text-sm text-muted-foreground">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">{form.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="space-y-5">
              {/* Sélecteur de classe si plusieurs classes disponibles */}
              {classes.length > 1 && isCreation && onClassChange && (
                <Field label="Classe">
                  <Select value={classId} onValueChange={onClassChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label="Cours">
                <Select value={form.courseId} onValueChange={handleCourseChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Début">
                  <Select value={form.startTime} onValueChange={handleStartTimeChange}>
                    <SelectTrigger className="w-full tabular-nums">
                      <SelectValue placeholder="Début" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="tabular-nums">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fin">
                  <Select value={form.endTime} onValueChange={handleEndTimeChange}>
                    <SelectTrigger className="w-full tabular-nums">
                      <SelectValue placeholder="Fin" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEndTimeOptions.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="tabular-nums">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {resources.rooms.length > 1 && (
                <Field label="Salle">
                  <Select value={form.roomId} onValueChange={(v) => setForm((p) => ({ ...p, roomId: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir une salle" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {isRoomAvailable(room.id) ? room.name : `${room.name} (occupée)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {resources.groups.length > 0 && (
                <Field label="Groupe">
                  <Select value={form.groupId} onValueChange={(v) => setForm((p) => ({ ...p, groupId: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Toute la classe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GROUP}>Toute la classe</SelectItem>
                      {resources.groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label={<>Notes <span className="opacity-70">(optionnel)</span></>}>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Consigne, chapitre abordé, matériel..."
                  className="resize-none border-dashed border-border/80 bg-transparent text-sm shadow-none focus-visible:border-border/90"
                />
              </Field>

              {hasConflict && !isChecking && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Un conflit de disponibilité est détecté sur ce créneau.</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-md bg-destructive/15 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t px-5 py-3">
        {!hasCourses || !hasRooms || !scheduleEditable ? (
          <Button variant="outline" onClick={onBack} className="w-full">
            Fermer
          </Button>
        ) : isCreation ? (
          <Button onClick={handleSubmit} disabled={isBusy || !form.courseId} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Créer la séance
          </Button>
        ) : (
          <div className="space-y-2.5">
            <Button onClick={handleSubmit} disabled={isBusy || !form.courseId} className="w-full">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Enregistrer les modifications
            </Button>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelSchedule}
                disabled={isBusy}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {canceling ? <Loader2 className="size-3.5 animate-spin" /> : "Annuler la séance"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isBusy}
                className="text-xs text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
              >
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : "Supprimer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
