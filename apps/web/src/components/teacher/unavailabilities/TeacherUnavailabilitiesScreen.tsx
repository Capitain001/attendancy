"use client";

import { useState, useMemo } from "react";
import { format, getDay, startOfDay, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useTeacherUnavailabilities } from "@/hooks/data/teacher-unavailability/useTeacherUnavailabilities";
import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { UnavailabilityType } from "@/generated/prisma/browser";
import {
  TeacherUnavailabilityForm,
  type TeacherUnavailabilityFormProps,
} from "./TeacherUnavailabilityForm";
import { UnavailabilityCalendar, type PendingRange } from "./UnavailabilityCalendar";

type FormInitialData = NonNullable<TeacherUnavailabilityFormProps["initialData"]>;

// État interne plus strict que FormInitialData : on sait qu'on remplit toujours
// startDate/endDate avec de vraies dates (pas null/undefined) quand on crée depuis
// une plage. Reste assignable à FormInitialData (Partial<...>) pour le prop du form.
type FormRangeSelection = {
  type: UnavailabilityType;
  startDate: Date;
  endDate: Date;
};

// Helper pour vérifier si un item s'applique à une date donnée
function isItemActiveOnDate(item: TeacherUnavailabilityItem, date: Date): boolean {
  const target = startOfDay(date);

  if (item.type === "WEEKLY" && item.dayOfWeek != null) {
    const jsDay = getDay(target);
    const isoDay = jsDay === 0 ? 7 : jsDay;
    return isoDay === item.dayOfWeek;
  }

  if (item.type === "DATE_RANGE" && item.startDate && item.endDate) {
    const start = startOfDay(new Date(item.startDate));
    const end = startOfDay(new Date(item.endDate));
    return target >= start && target <= end;
  }

  return false;
}

export function TeacherUnavailabilitiesScreen({
  teacherId,
  initialData,
}: {
  teacherId: string;
  initialData: TeacherUnavailabilityItem[];
}) {
  // Jour ouvert via un tap normal
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Plage en cours de sélection, démarrée par un appui long. Tant que `end` est null,
  // le prochain tap pose la date de fin ET ouvre directement le formulaire (comme un
  // date-range picker classique) — pas d'étape de confirmation intermédiaire.
  const [pendingRange, setPendingRange] = useState<PendingRange>({ start: null, end: null });

  // Plage figée passée au formulaire au moment de la création. `type` est fixé
  // explicitement à DATE_RANGE pour que le formulaire s'ouvre dans le bon mode
  // (le resolver serveur tranche WEEKLY/DATE_RANGE via dayOfWeek, mais le form,
  // lui, a besoin de le savoir tout de suite pour son affichage).
  const [formRange, setFormRange] = useState<FormRangeSelection | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherUnavailabilityItem | null>(null);

  const {
    data,
    create,
    update,
    delete: deleteItem,
  } = useTeacherUnavailabilities({ teacherId });

  const displayItems = data?.items ?? initialData;

  const dayItems = useMemo(() => {
    if (!selectedDate) return [];
    return displayItems.filter((item) => isItemActiveOnDate(item, selectedDate));
  }, [displayItems, selectedDate]);

  // Début posé, fin pas encore choisie -> on est en train de choisir la fin de la plage
  const isPickingRangeEnd = pendingRange.start !== null && pendingRange.end === null;

  const resetRangeSelection = () => {
    setPendingRange({ start: null, end: null });
    setFormRange(null);
  };

  // Appui long sur un jour — (re)démarre une sélection de plage à partir de ce jour
  const handleDayLongPress = (date: Date) => {
    setPendingRange({ start: date, end: null });
    setSelectedDate(null);
    setIsDrawerOpen(false);
  };

  // Tap normal sur un jour
  const handleDayClick = (date: Date) => {
    // Une plage est en cours -> ce tap pose la fin et ouvre directement le formulaire
    if (pendingRange.start && !pendingRange.end) {
      const start = date < pendingRange.start ? date : pendingRange.start;
      const end = date < pendingRange.start ? pendingRange.start : date;

      setPendingRange({ start, end });
      setFormRange({ type: UnavailabilityType.DATE_RANGE, startDate: start, endDate: end });
      setEditingItem(null);
      setIsFormVisible(true);
      setIsDrawerOpen(true);
      return;
    }

    // Le calendrier communique déjà via la couleur si le jour a des indisponibilités.
    // Jour "vide" -> on va droit au formulaire de création, pas besoin de montrer une liste vide.
    const itemsForDay = displayItems.filter((item) => isItemActiveOnDate(item, date));
    const hasData = itemsForDay.length > 0;

    setSelectedDate(date);
    setEditingItem(null);
    setIsFormVisible(!hasData);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedDate(null);
    setIsFormVisible(false);
    setEditingItem(null);
    setFormRange(null);
    resetRangeSelection();
  };

  const handleEdit = (item: TeacherUnavailabilityItem) => {
    setEditingItem(item);
    setIsFormVisible(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormVisible(true);
  };

  const formInitialData =
    editingItem ??
    formRange ??
    (selectedDate ? { startDate: selectedDate, endDate: selectedDate } : null);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Indisponibilités</h1>
        <p className="text-sm text-muted-foreground">
          {isPickingRangeEnd
            ? "Choisissez la date de fin de la plage."
            : "Tapez une date pour voir ou ajouter une indisponibilité. Restez appuyé pour définir une plage."}
        </p>
      </div>

      {/* Calendrier de consultation */}
      <div className="flex flex-col items-center gap-3">
        <UnavailabilityCalendar
          items={displayItems}
          selected={selectedDate}
          range={pendingRange}
          onDayClick={handleDayClick}
          onDayLongPress={handleDayLongPress}
        />

        {/* Pendant le choix de la date de fin : juste un moyen d'annuler la sélection */}
        {isPickingRangeEnd && pendingRange.start && (
          <div className="flex w-full max-w-sm items-center justify-between gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-2.5">
            <span className="text-sm font-medium">
              Début : {format(pendingRange.start, "d MMMM yyyy", { locale: fr })} — survolez /
              choisissez la fin
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              onClick={resetRangeSelection}
              aria-label="Annuler la sélection de plage"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Drawer Bottom pour les actions au clic sur une date / la validation d'une plage */}
      <Drawer open={isDrawerOpen} onOpenChange={(open) => !open && handleCloseDrawer()}>
        <DrawerContent className="mx-auto flex h-[80vh] max-w-lg flex-col bg-card text-foreground">
          <DrawerHeader className="border-b border-border pb-4 text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {formRange
                  ? isSameDay(formRange.startDate, formRange.endDate)
                    ? format(formRange.startDate, "EEEE d MMMM yyyy", { locale: fr })
                    : `${format(formRange.startDate, "d MMM", { locale: fr })} – ${format(
                        formRange.endDate,
                        "d MMM yyyy",
                        { locale: fr }
                      )}`
                  : selectedDate
                    ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                    : "Date sélectionnée"}
              </DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseDrawer}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DrawerDescription className="text-xs text-muted-foreground">
              {isFormVisible
                ? editingItem
                  ? "Modifier l'indisponibilité"
                  : "Créer un nouveau créneau d'indisponibilité"
                : `${dayItems.length} indisponibilité(s) enregistrée(s) pour ce jour.`}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {isFormVisible ? (
              /* FORMULAIRE (Mode Ajout/Édition) */
              <TeacherUnavailabilityForm
                initialData={formInitialData}
                onSubmit={async (formData) => {
                  if (editingItem) {
                    await update?.({ id: editingItem.id, data: formData });
                  } else {
                    await create?.(formData);
                  }
                  handleCloseDrawer();
                }}
                onCancel={handleCloseDrawer}
              />
            ) : (
              /* LISTE DES INDISPONIBILITÉS DU JOUR */
              <div className="flex flex-col gap-4">
                <Button onClick={handleCreateNew} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une indisponibilité
                </Button>

                {dayItems.length === 0 ? (
                  <div className="flex h-36 items-center justify-center rounded-2xl border-2 border-dashed border-border text-xs text-muted-foreground">
                    Aucune indisponibilité définie pour ce jour.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-muted/50 p-4 border border-border"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md w-max bg-primary/10 text-primary">
                            {item.type === "WEEKLY" ? "Récurrente (Hebdo)" : "Ponctuelle"}
                          </span>
                          <span className="text-sm font-medium">
                            {item.reason || "Sans motif précisé"}
                          </span>
                          {item.startTime && item.endTime && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.startTime), "HH:mm")} –{" "}
                              {format(new Date(item.endTime), "HH:mm")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteItem?.(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}