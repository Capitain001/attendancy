//src/components/programs/program/DirectionProgramPage.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import type { ProgramSemesterDTO, ProgramUECourses, UeCourseDTO, GetUEsDto } from '@/services/ue/types';
import { useProgramData } from '@/hooks/data/programs/useProgramData';
import { useProgramActions } from '@/hooks/data/programs/useProgramActions';
import { useProgramReorder } from '@/hooks/data/programs/useProgramReorder';
import { useProgramTable } from '@/hooks/data/programs/useProgramTable';

import { GridDeco, CollapseSection, ConfirmDialog, Modal, ActionButton } from './ui';
import { ProgramEditBar } from './sections/ProgramEditBar';
import { ProgramHero } from './sections/ProgramHero';
import { ProgramSemesterList } from './sections/ProgramSemesterList';
import { ProgramModals } from './sections/ProgramModals';
import { ProgramExportButton } from './ui/Programexportbutton';
import type { ProgramOrganizationData, ProgramPageData } from './types';
import { toggleProgramLockAction, toggleProgramActiveAction, duplicateProgramAction } from '@/services/program/actions';
import { BackgroundPattern } from '@/components/design/BackgroundPattern';
import { CACHE_KEYS } from '@/config/client_cache';
import { GetProgramByIdDto } from '@/services/program';

export type DirectionProgramPageProps = {
  programId: string;
  classId?: string;
  allUes: GetUEsDto;
  organization?: ProgramOrganizationData;
  programDetails?: {
    isActive?: boolean;
    isLocked?: boolean;
    programTrackId?: string;
  };
  classInfo?: {
    name: string;
    level: string;
    programTrack: string;
    program: string;
    academicYear: string;
  };
  programClasses?: NonNullable<GetProgramByIdDto>['classes'];
};

export function DirectionProgramPage({
  programId,
  classId,
  allUes,
  classInfo,
  organization,
  programDetails,
  programClasses,
}: DirectionProgramPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(programDetails?.isLocked ?? false);
  const [isActive, setIsActive] = useState(programDetails?.isActive ?? true);
  const [showType, setShowType] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

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
    | { type: 'duplicate-program' }
    | null;

  const [modal, setModal] = useState<ModalState>(null);
  const closeModal = () => setModal(null);

  // --- Handlers ---

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
          onDuplicate={() => setModal({ type: 'duplicate-program' })}
        />
          <ProgramExportButton data={exportData} showType={showType} />
        </div>

        {/* {programClasses && programClasses.length > 0 && (
          <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Classes associées ({programClasses.length})</h3>
            <div className="flex flex-wrap gap-2">
              {programClasses.map(c => (
                <div key={c.id} className="flex flex-col border border-border bg-card px-3 py-2 ">
                  <span className="text-xs font-medium text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.academicYear?.name || 'Année non définie'} • Niveau {c.level || '?'}</span>
                </div>
              ))}
            </div>
          </div>
        )} */}
        <div className="flex justify-between items-center px-1">
          <span className='border border-dashed w-24 flex items-center h-8 rounded-xs'>
              <p className='mx-auto text-sm text-muted-foreground'>Classes {programClasses?.length?? "0"} </p>
          </span>

          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
            <input 
              type="checkbox" 
              checked={showType} 
              onChange={e => setShowType(e.target.checked)} 
              className="accent-foreground size-3"
            />
            Afficher le type
          </label>
        </div>

        <ProgramSemesterList
          semesters={data}
          isEditing={isEditing}
          showType={showType}
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
          onEditUE={(ue) => setModal({ type: "edit-ue", ue })}
          onEditCourse={(course, ueId) => setModal({ type: "edit-course", course, ueId })}
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

      <ProgramModals
        programId={programId}
        modal={modal}
        closeModal={closeModal}
        availableUes={availableUes}
        program={data}
        classInfo={classInfo}
        programDetails={programDetails}
        linkUE={linkUE}
        unlinkUE={unlinkUE}
        createCourse={createCourse}
        updateUE={updateUE}
        updateCourse={updateCourse}
      />

    </section>
  );
}
