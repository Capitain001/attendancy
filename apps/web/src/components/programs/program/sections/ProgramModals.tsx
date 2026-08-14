"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Modal, ConfirmDialog } from '../ui';
import type { ProgramSemesterDTO, ProgramUECourses, UeCourseDTO, OrgUEDTO } from '@/services/ue/types';
import { duplicateProgramAction } from '@/services/program/actions';

export type ModalState =
  | { type: 'add-ue', semester: number }
  | { type: 'add-course', ueId: string }
  | { type: 'unlink-ue', programUEId: string }
  | { type: 'edit-ue', ue: ProgramUECourses }
  | { type: 'edit-course', course: UeCourseDTO, ueId: string }
  | { type: 'duplicate-program' }
  | null;

export type ProgramModalsProps = {
  programId: string;
  modal: ModalState;
  closeModal: () => void;
  availableUes: OrgUEDTO;
  program: ProgramSemesterDTO[];
  classInfo?: { program?: string };
  programDetails?: { programTrackId?: string };
  linkUE: (args: any) => Promise<{ success: boolean; error?: string }>;
  unlinkUE: (id: string) => Promise<{ success: boolean; error?: string }>;
  createCourse: (args: any) => Promise<{ success: boolean; error?: string }>;
  updateUE: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  updateCourse: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
};

export function ProgramModals({
  programId,
  modal,
  closeModal,
  availableUes,
  program,
  classInfo,
  programDetails,
  linkUE,
  unlinkUE,
  createCourse,
  updateUE,
  updateCourse,
}: ProgramModalsProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function handleAddUE(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== 'add-ue') return;
    const formData = new FormData(e.currentTarget);
    const ueId = formData.get('ueId') as string;

    if (!ueId) {
      toast.error("Veuillez sélectionner une UE");
      return;
    }

    const targetSem = program.find(s => s.semester === modal.semester);
    const newOrder = targetSem ? targetSem.ues.length + 1 : 1;

    const { success, error } = await linkUE({ ueId, semester: modal.semester, order: newOrder , programId });
    if (success) {
      closeModal();
    } else {
      toast.error(error || "Erreur lors de la liaison");
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
    });

    if (success) {
      closeModal();
    } else {
      toast.error(error || "Erreur lors de la création");
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
    else toast.error(error || "Erreur lors de la mise à jour");
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

    const { success, error } = await updateCourse(modal.course.id, { name: name.trim(), credits, duration, settings });
    if (success) closeModal();
    else toast.error(error || "Erreur lors de la mise à jour");
  }

  async function handleDuplicate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== 'duplicate-program') return;
    const formData = new FormData(e.currentTarget);
    const newName = formData.get('name') as string;

    if (!newName?.trim()) return toast.error('Le nom est requis.');

    setIsDuplicating(true);
    const res = await duplicateProgramAction({
      programId,
      newName: newName.trim(),
      programTrackId: programDetails?.programTrackId || '',
    });

    setIsDuplicating(false);
    if ('data' in res && res.data) {
      toast.success('Programme dupliqué avec succès');
      closeModal();
      router.push(`../${res.data.id}`);
    } else {
      toast.error(res.error || 'Erreur lors de la duplication');
    }
  }

  return (
    <>
      <ConfirmDialog
        open={modal?.type === 'unlink-ue'}
        onClose={closeModal}
        onConfirm={async () => {
          if (modal?.type !== 'unlink-ue') return;
          const { success, error } = await unlinkUE(modal.programUEId);
          if (success) closeModal();
          else toast.error(error || "Erreur lors de la suppression du lien");
        }}
        title="Délier cette UE"
        description="L'UE sera détachée de ce programme mais son contenu sera conservé globalement."
      />

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

      <Modal open={modal?.type === 'duplicate-program'} onClose={closeModal} title="Dupliquer le programme">
        <form onSubmit={handleDuplicate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Nouveau Nom *</label>
            <input
              name="name"
              type="text"
              placeholder={`Copie de ${classInfo?.program || 'Programme'}`}
              defaultValue={`Copie de ${classInfo?.program || ''}`}
              className="h-8 px-2 text-[12px] bg-transparent border border-dashed border-foreground/25 focus:border-foreground/50 rounded-sm outline-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              La duplication copiera la maquette pédagogique complète (UEs et cours) dans une nouvelle instance de programme.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={closeModal} disabled={isDuplicating} className="h-8 px-4 text-[12px] hover:bg-foreground/[0.05] rounded-sm border border-transparent transition-colors disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={isDuplicating} className="h-8 px-4 text-[12px] bg-foreground text-background font-medium rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50">
              {isDuplicating ? 'Duplication...' : 'Dupliquer'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
