"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTeacherUnavailabilities } from "@/hooks/data/teacher-unavailability/useTeacherUnavailabilities";
import type { TeacherUnavailabilityItem } from "@/services/teacher-unavailability/types";
import { TeacherUnavailabilitiesList } from "./TeacherUnavailabilitiesList";
import { TeacherUnavailabilityForm } from "./TeacherUnavailabilityForm";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function TeacherUnavailabilitiesScreen({
  teacherId,
  initialData,
}: {
  teacherId: string;
  initialData: TeacherUnavailabilityItem[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherUnavailabilityItem | null>(null);

  const {
    data: items,
    create,
    update,
    delete: deleteItem,
  } = useTeacherUnavailabilities({
    teacherId,
  });

  const displayItems = items?.items ?? initialData;

  const handleEdit = (item: TeacherUnavailabilityItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Indisponibilités</h1>
          <p className="text-muted-foreground">
            Gérez vos indisponibilités récurrentes ou ponctuelles.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <TeacherUnavailabilitiesList 
        items={displayItems} 
        onEdit={handleEdit} 
        onDelete={deleteItem!} 
      />

      <Sheet open={isFormOpen} onOpenChange={(open) => {
        if (!open) handleClose();
      }}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingItem ? "Modifier l'indisponibilité" : "Ajouter une indisponibilité"}</SheetTitle>
            <SheetDescription>
              {editingItem 
                ? "Modifiez les détails de votre indisponibilité." 
                : "Déclarez une nouvelle indisponibilité (hebdomadaire ou ponctuelle)."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TeacherUnavailabilityForm
              initialData={editingItem}
              onSubmit={async (data: any) => {
                if (editingItem) {
                  await update!({ id: editingItem.id, data });
                } else {
                  await create!(data);
                }
                handleClose();
              }}
              onCancel={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
