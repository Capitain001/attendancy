//src/components/programs/program/DirectionProgramPage.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ProgramSemesterDTO, ProgramUECourses, UeCourseDTO, OrgUEDTO } from '@/services/ue/types';
import { useProgramData } from '@/hooks/data/programs/useProgramData';
import { useProgramActions } from '@/hooks/data/programs/useProgramActions';
import { useProgramReorder } from '@/hooks/data/programs/useProgramReorder';
import { useProgramTable } from '@/hooks/data/programs/useProgramTable';

import { GridDeco, CollapseSection, ConfirmDialog, Modal, ActionButton } from './ui';
import { ProgramEditBar } from './sections/ProgramEditBar';
import { ProgramHero } from './sections/ProgramHero';
import { ProgramSemesterList } from './sections/ProgramSemesterList';
import { ProgramExportButton } from './ui/Programexportbutton';
import type { ProgramOrganizationData, ProgramPageData } from './types';
import { toggleProgramLockAction, toggleProgramActiveAction } from '@/services/program/actions';
import { BackgroundPattern } from '@/components/design/BackgroundPattern';
import { CACHE_KEYS } from '@/config/client_cache';

export type DirectionProgramPageProps = {
  programId: string;
  classId?: string;
  allUes: OrgUEDTO;
  organization?: ProgramOrganizationData;
  programDetails?: {
    isActive?: boolean;
    isLocked?: boolean;
  };
  classInfo?: {
    name?: string;
    level?: string;
    programTrack?: string;
    program?: string;
    academicYear?: string;
  };
};

export function DirectionProgramPage({
  programId,
  classId,
  allUes,
  classInfo,
  organization,
  programDetails,
}: DirectionProgramPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(programDetails?.isLocked ?? false);
  const [isActive, setIsActive] = useState(programDetails?.isActive ?? true);
  const queryClient = useQueryClient();

  const onProgramChange = useCallback(
    (updater: (prev: ProgramSemesterDTO[]) => ProgramSemesterDTO[]) => {
      queryClient.setQueryData<ProgramSemesterDTO[]>(
        CACHE_KEYS.PROGRAMS.BY_ID(programId),
        (prev) => updater(prev ?? [])
      );
    },
    [queryClient, programId]
  );

  const { program: data, availableUes, isLoading, error } = useProgramTable(programId, allUes);

  // Computed data
  const { totalDuration, totalCredits, totalUEs, totalCourses } = useProgramData(data);

  // Actions
  const {
    updateUE,
    linkUE,
    unlinkUE,
    createCourse,
    updateCourse,
    requestRemoveCourse,
    confirmRemoveCourse,
    deleteDialogOpen,
    onDeleteDialogChange,
    canUndo,
    undoLabel,
    undoInProgress,
    undoLastAction,
  } = useProgramActions({ programId, classId });

  // Reordering
  const { isDirty, save: saveReorder, status: reorderStatus } = useProgramReorder({ programId, program: data });

  // Modals state
  type ModalState =
    | { type: 'add-ue', semester: number }
    | { type: 'add-course', ueId: string }
    | { type: 'unlink-ue', programUEId: string }
    | { type: 'edit-ue', ue: ProgramUECourses }
    | { type: 'edit-course', course: UeCourseDTO, ueId: string }
    | null;

  const [modal, setModal] = useState<ModalState>(null);
  const closeModal = () => setModal(null);

  // --- Handlers ---

  async function handleAddUE(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== 'add-ue') return;
    const formData = new FormData(e.currentTarget);
    const ueId = formData.get('ueId') as string;

    if (!ueId) {
      toast.error("Veuillez sélectionner une UE");
      return;
    }

    const targetSem = data.find(s => s.semester === modal.semester);
    const newOrder = targetSem ? targetSem.ues.length + 1 : 1;

    const { success, error } = await linkUE({ ueId, semester: modal.semester, order: newOrder , programId });
    if (success) {
      closeModal();
    } else {
      toast.error(error);
    }
  }

  async function handleAddCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== 'add-course') return;
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const credits = Number(formData.get('credits'));
    const cm = Number(formData.get('cm') || 0);
    const td = Number(formData.get('td') || 0);
    const tp = Number(formData.get('tp') || 0);
    const rawDuration = Number(formData.get('duration') || 0);
    const duration = (cm + td + tp) > 0 ? (cm + td + tp) : rawDuration;

    if (!name || isNaN(credits) || isNaN(duration) || duration <= 0) {
      toast.error('Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    const settings = (cm > 0 || td > 0 || tp > 0) ? { hours: { CM: cm, TD: td, TP: tp } } : undefined;

    const { success, error } = await createCourse({
      ueId: modal.ueId,
      name,
      code,
      credits,
      duration,
      settings,
    } as any);

    if (success) {
      closeModal();
    } else {
      toast.error(error);
    }
  }

  async function handleEditUE(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== 'edit-ue') return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (!name?.trim()) return toast.error('Le nom est requis.');

    const { success, error } = await updateUE(modal.ue.ue.id, { name: name.trim() });
    if (success) closeModal();
    else toast.error(error);
  }

  async function handleEditCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== 'edit-course') return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const credits = Number(formData.get('credits'));
    const cm = Number(formData.get('cm') || 0);
    const td = Number(formData.get('td') || 0);
    const tp = Number(formData.get('tp') || 0);
    const rawDuration = Number(formData.get('duration') || 0);
    const duration = (cm + td + tp) > 0 ? (cm + td + tp) : rawDuration;

    if (!name?.trim() || isNaN(credits) || isNaN(duration) || duration <= 0) {
      return toast.error('Veuillez remplir correctement les informations.');
    }

    const settings = (cm > 0 || td > 0 || tp > 0) ? { hours: { CM: cm, TD: td, TP: tp } } : undefined;

    const { success, error } = await updateCourse(modal.course.id, { name: name.trim(), credits, duration, settings } as any);
    if (success) closeModal();
    else toast.error(error);
  }

  async function handleToggleLock() {
    const nextState = !isLocked;
    const res = await toggleProgramLockAction({ programId, isLocked: nextState });
    if ('data' in res && res.data) {
      setIsLocked(nextState);
      if (nextState) setIsEditing(false);
      toast.success(nextState ? 'Programme verrouillé' : 'Programme déverrouillé');
    } else {
      toast.error(res.error || 'Erreur lors du verrouillage');
    }
  }

  async function handleToggleActive() {
    const nextState = !isActive;
    const res = await toggleProgramActiveAction({ programId, isActive: nextState });
    if ('data' in res && res.data) {
      setIsActive(nextState);
      toast.success(nextState ? 'Programme activé pour les nouvelles classes' : 'Programme désactivé');
    } else {
      toast.error(res.error || 'Erreur lors du changement de statut');
    }
  }

  const exportData: ProgramPageData = {
    class: {
      name: classInfo?.name ?? '—',
      level: classInfo?.level ?? '—',
      programTrack: classInfo?.programTrack ?? '—',
      program: classInfo?.program ?? '—',
      academicYear: classInfo?.academicYear ?? '—',
    },
    organization,
    semesters: data,
  };

  return (
    <section className="relative w-full  pb-16 md:px-4">

<BackgroundPattern
  pattern="pattern-noise"
  className="opacity-10"

/>
      <div className="relative mx-auto  space-y-5">

        {isLoading && <p className="text-sm text-muted-foreground">Chargement du programme...</p>}
        {error && !isLoading && (
          <p className="text-red-500 text-sm">
            Erreur lors du chargement du programme: {error.message}
          </p>
        )}

        <ProgramHero
          classInfo={classInfo}
          semesters={data}
          totalUEs={totalUEs}
          totalCourses={totalCourses}
          totalCredits={totalCredits}
          totalDuration={totalDuration}
        />


        <div className="flex justify-end gap-4 flex-wrap">
        <ProgramEditBar
          isEditing={isEditing}
          isDirty={isDirty}
          isLocked={isLocked}
          isActive={isActive}
          reorderStatus={reorderStatus}
          onSaveOrder={saveReorder}
          onToggleEdit={() => {
            if (isLocked) return;
            setIsEditing((v) => !v);
          }}
          onToggleLock={handleToggleLock}
          onToggleActive={handleToggleActive}
        />
          <ProgramExportButton data={exportData} />
        </div>

        <ProgramSemesterList
          semesters={data}
          isEditing={isEditing}
          onUEsChange={(semester, newUEs) => {
            if (!isEditing) return;
            onProgramChange((prev) => {
              const next = prev.map((block) => {
                if (block.semester !== semester) return block;
                return { ...block, ues: newUEs };
              });

              return next.map((block) => {
                let totalCredits = 0;
                let totalDuration = 0;
                block.ues.forEach((u: any) => {
                  totalCredits += (u as any).ueTotalCredits ?? 0;
                  totalDuration += (u as any).ueTotalDuration ?? 0;
                });
                return { ...block, totalCredits, totalDuration };
              });
            });
          }}
          onAddUE={(semester) => setModal({ type: "add-ue", semester })}
          onUnlinkUE={(programUEId) => setModal({ type: "unlink-ue", programUEId })}
          onAddCourse={(ueId) => setModal({ type: "add-course", ueId })}
          onDeleteCourse={requestRemoveCourse}
          onEditUE={(ue) => setModal({ type: "edit-ue", ue: ue as any })}
          onEditCourse={(course, ueId) => setModal({ type: "edit-course", course, ueId } as any)}
        />
      </div>

      {/* --- Dialogs --- */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => onDeleteDialogChange(false)}
        onConfirm={confirmRemoveCourse}
        title="Supprimer ce cours"
        description="Êtes-vous sûr de vouloir supprimer définitivement ce cours du programme ? Cette action est irréversible."
      />

      <ConfirmDialog
        open={modal?.type === 'unlink-ue'}
        onClose={closeModal}
        onConfirm={async () => {
          if (modal?.type !== 'unlink-ue') return;
          const { success, error } = await unlinkUE(modal.programUEId);
          if (success) closeModal();
          else toast.error(error);
        }}
        title="Délier cette UE"
        description="L'UE sera détachée de ce programme mais son contenu sera conservé globalement."
      />

      <div className='flex justify-end absolute right-5 bottom-5'>

        {canUndo && <ActionButton
          onClick={undoLastAction}
          loading={undoInProgress}
          loadingText="Annulation..."
        >
          Annuler la dernière action{undoLabel ? ` (${undoLabel})` : ""}
        </ActionButton>
        }

        {isDirty && (
          <ActionButton
            onClick={saveReorder}
            loading={reorderStatus === "saving"}
            loadingText="Enregistrement…"
          >
            Enregistrer la disposition
          </ActionButton>
        )}


      </div>

      <Modal open={modal?.type === 'add-ue'} onClose={closeModal} title={`Ajouter une UE (Semestre ${modal?.type === 'add-ue' ? modal.semester : ''})`}>
        <form onSubmit={handleAddUE} className="flex flex-col gap-3">
          <label className="text-xs font-medium text-foreground">
            Sélectionnez une UE existante
          </label>
          <select
            name="ueId"
            className="h-9 px-3 text-xs bg-background border border-dashed border-foreground/30 focus:border-foreground rounded-sm outline-none"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Choisir une UE…
            </option>
            {availableUes.map((ue) => (
              <option key={ue.id} value={ue.id}>
                {ue.code ? `${ue.code} — ` : ""}{ue.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={closeModal} className="h-8 px-4 text-xs hover:bg-foreground/[0.05] rounded-sm transition-colors">Annuler</button>
            <button type="submit" className="h-8 px-4 text-xs bg-foreground text-background font-medium rounded-sm">Lier l'UE</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.type === 'add-course'} onClose={closeModal} title="Ajouter un nouveau cours">
        <form onSubmit={handleAddCourse} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Intitulé *</label>
              <input name="name" type="text" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Code</label>
              <input name="code" type="text" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Crédits ECTS *</label>
            <input name="credits" type="number" min="1" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Ventilation Horaire (Heures)</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">CM</label>
                <input name="cm" type="number" min="0" placeholder="0" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">TD</label>
                <input name="td" type="number" min="0" placeholder="0" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">TP</label>
                <input name="tp" type="number" min="0" placeholder="0" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Ou Volume total brut (heures)</label>
            <input name="duration" type="number" min="0" placeholder="Si non ventilé CM/TD/TP" className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={closeModal} className="h-8 px-4 text-[12px] hover:bg-foreground/[0.05] rounded-sm border border-transparent transition-colors">Annuler</button>
            <button type="submit" className="h-8 px-4 text-[12px] bg-foreground text-background font-medium rounded-sm transition-opacity hover:opacity-90">Créer le cours</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.type === 'edit-ue'} onClose={closeModal} title="Modifier le nom de l'UE">
        <form onSubmit={handleEditUE} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Nom de l'UE *</label>
            <input
              name="name"
              type="text"
              defaultValue={modal?.type === 'edit-ue' ? modal.ue.ue.name : ''}
              className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={closeModal} className="h-8 px-4 text-[12px] hover:bg-foreground/[0.05] rounded-sm border border-transparent transition-colors">Annuler</button>
            <button type="submit" className="h-8 px-4 text-[12px] bg-foreground text-background font-medium rounded-sm transition-opacity hover:opacity-90">Enregistrer</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.type === 'edit-course'} onClose={closeModal} title="Modifier le cours">
        <form onSubmit={handleEditCourse} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Intitulé *</label>
            <input
              name="name"
              type="text"
              defaultValue={modal?.type === 'edit-course' ? modal.course.name : ''}
              className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Crédits ECTS *</label>
            <input
              name="credits"
              type="number"
              min="1"
              defaultValue={modal?.type === 'edit-course' ? modal.course.credits : ''}
              className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Ventilation Horaire (Heures)</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">CM</label>
                <input name="cm" type="number" min="0" defaultValue={modal?.type === 'edit-course' ? ((modal.course as any).settings?.hours?.CM ?? '') : ''} className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">TD</label>
                <input name="td" type="number" min="0" defaultValue={modal?.type === 'edit-course' ? ((modal.course as any).settings?.hours?.TD ?? '') : ''} className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">TP</label>
                <input name="tp" type="number" min="0" defaultValue={modal?.type === 'edit-course' ? ((modal.course as any).settings?.hours?.TP ?? '') : ''} className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Ou Volume total brut (heures)</label>
            <input
              name="duration"
              type="number"
              min="0"
              defaultValue={modal?.type === 'edit-course' ? modal.course.duration : ''}
              className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={closeModal} className="h-8 px-4 text-[12px] hover:bg-foreground/[0.05] rounded-sm border border-transparent transition-colors">Annuler</button>
            <button type="submit" className="h-8 px-4 text-[12px] bg-foreground text-background font-medium rounded-sm transition-opacity hover:opacity-90">Enregistrer</button>
          </div>
        </form>
      </Modal>

    </section>
  );
}
