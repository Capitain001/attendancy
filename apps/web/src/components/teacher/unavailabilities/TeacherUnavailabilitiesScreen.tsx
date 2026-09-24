"use client";

import { useState, useMemo } from "react";
import { format, getDay, startOfDay, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

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
import { TYPE_STYLES, UnavailabilityCalendar } from "./UnavailabilityCalendar";
import { cn } from "@/lib/utils";

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
  // Mode du calendrier : "single" = tap classique (ouvre le drawer tout de suite),
  // "range" = déclenché par un appui long, en attente d'une 2e date puis d'une confirmation.
  const [pickerMode, setPickerMode] = useState<"single" | "range">("single");

  // Jour sélectionné en mode "single".
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Plage en cours de construction en mode "range" (native react-day-picker).
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  // Plage complète (from + to) en attente de confirmation via la coche affichée sur le jour de fin.
  const [pendingConfirmRange, setPendingConfirmRange] = useState<DateRange | null>(null);

  // Plage figée passée au formulaire une fois la création confirmée. `type` est fixé
  // explicitement à DATE_RANGE pour que le formulaire s'ouvre dans le bon mode (le
  // resolver serveur tranche WEEKLY/DATE_RANGE via dayOfWeek, mais le form, lui, a
  // besoin de le savoir tout de suite pour son affichage).
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

  const resetRangeMode = () => {
    setPickerMode("single");
    setRange(undefined);
    setPendingConfirmRange(null);
  };

  // Tap normal sur un jour (mode "single") -> ouverture immédiate du drawer :
  // liste si le jour a déjà des données, formulaire de création sinon.
  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);
    setFormRange(null);

    const hasData = displayItems.some((item) => isItemActiveOnDate(item, date));
    setEditingItem(null);
    setIsFormVisible(!hasData);
    setIsDrawerOpen(true);
  };

  // Appui long sur un jour -> démarre (ou redémarre) une sélection de plage.
  const handleLongPressDay = (date: Date) => {
    setIsDrawerOpen(false);
    setIsFormVisible(false);
    setSelectedDate(null);
    setPickerMode("range");
    setRange({ from: date, to: undefined });
    setPendingConfirmRange(null);
  };

  // Callback du calendrier natif en mode "range" : appelé à chaque clic pendant la
  // sélection de la 2e date. react-day-picker recalcule la plage lui-même.
  const handleRangeChange = (next: DateRange | undefined) => {
    if (!next?.from) {
      resetRangeMode();
      return;
    }

    setRange(next);
    setPendingConfirmRange(next.to && !isSameDay(next.from, next.to) ? next : null);
  };

  // Coche cliquée sur le jour de fin -> on ouvre le drawer avec le formulaire de création.
  const handleConfirmRange = () => {
    if (!pendingConfirmRange?.from || !pendingConfirmRange.to) return;

    setFormRange({
      type: UnavailabilityType.DATE_RANGE,
      startDate: pendingConfirmRange.from,
      endDate: pendingConfirmRange.to,
    });
    setEditingItem(null);
    setIsFormVisible(true);
    setIsDrawerOpen(true);
    setPickerMode("single");
    setRange(undefined);
    setPendingConfirmRange(null);
  };

  // Croix cliquée sur le jour de fin -> on annule la plage et on repasse en mode "single".
  const handleCancelRange = () => {
    resetRangeMode();
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsFormVisible(false);
    setEditingItem(null);
    setSelectedDate(null);
    setFormRange(null);
    resetRangeMode();
  };

  const handleEdit = (item: TeacherUnavailabilityItem) => {
    setEditingItem(item);
    setIsFormVisible(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormVisible(true);
  };

  const formInitialData: FormInitialData | null =
    editingItem ??
    formRange ??
    (selectedDate ? { startDate: selectedDate, endDate: selectedDate } : null);


  const formattedDate = (() => {
    if (formRange) {
      const { startDate, endDate } = formRange;
      return isSameDay(startDate, endDate)
        ? format(startDate, "EEEE d MMMM yyyy", { locale: fr })
        : `${format(startDate, "d MMM", { locale: fr })} – ${format(endDate, "d MMM yyyy", { locale: fr })}`;
    }
    if (selectedDate) {
      return format(selectedDate, "EEEE d MMMM yyyy", { locale: fr });
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-6 p-6  mx-auto">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Indisponibilités</h1>
              {/* <span className="flex items-center  gap-4 ">
              {(Object.keys(TYPE_STYLES) as Array<keyof typeof TYPE_STYLES>).map((key) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("size-2.5 rounded-full", TYPE_STYLES[key].dot)} />
                    {TYPE_STYLES[key].label}
                  </div>
                ))}
              </span> */}
      </div>

      {/* Calendrier de consultation */}
      <div className="flex flex-col items-center">
        <UnavailabilityCalendar
          items={displayItems}
          pickerMode={pickerMode}
          selectedDate={selectedDate}
          range={range}
          pendingConfirmRange={pendingConfirmRange}
          onDaySelect={handleDaySelect}
          onRangeChange={handleRangeChange}
          onLongPressDay={handleLongPressDay}
          onConfirmRange={handleConfirmRange}
          onCancelRange={handleCancelRange}
        />
      </div>

      {/* Drawer Bottom pour les actions au clic sur une date / la confirmation d'une plage */}
      <Drawer open={isDrawerOpen} onOpenChange={(open) => !open && handleCloseDrawer()}>
        <DrawerContent className="mx-auto flex h-[80vh] max-w-lg flex-col bg-card text-foreground">
          <DrawerHeader className="border-b border-border pb-2 text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-sm font-semibold flex items-center justify-center gap-1.5 w-full">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {formattedDate || "Date sélectionnée"}
              </DrawerTitle>
            </div>
            <DrawerDescription className="text-xs text-muted-foreground">
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