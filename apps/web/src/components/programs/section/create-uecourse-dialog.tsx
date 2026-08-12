'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type CreateUECourseInput } from '@/services/ue/validation';
import { UECourseForm } from './UECourseForm';
import { Plus } from 'lucide-react';
import { createUECourseSchema } from '@/services/ue-course/validation';

interface CreateUECourseDialogProps {
  ueId: string;
  ueName: string;
  onCreateCourse: (data: CreateUECourseInput) => Promise<{ success: boolean; error?: string }>;
}

export function CreateUECourseDialog({ ueId, ueName, onCreateCourse }: CreateUECourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues = { code: '', name: '', credits: 3, duration: 36, ueId };

  const form = useForm<CreateUECourseInput>({
    resolver: valibotResolver(createUECourseSchema),
    defaultValues,
  });

  async function onSubmit(data: CreateUECourseInput) {
    try {
      setSubmitting(true);
      const result = await onCreateCourse(data);

      if (!result.success) {
        form.setError('root', { message: result.error || 'Une erreur est survenue' });
        return;
      }

      form.reset(defaultValues);
      setOpen(false);
    } catch {
      form.setError('root', { message: 'Une erreur est survenue' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" title='Ajouter Cours' size="sm" className="text-xs">
           <span className="hidden md:block">Ajouter Cours</span>
           <span className="block text-xs md:hidden"> <Plus className="size-4 ml-2" /> Cours</span>
           
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle >Ajouter une Course</DialogTitle>
          <DialogDescription>
            Créez une nouvelle course pour l'UE : {ueName}
          </DialogDescription>
        </DialogHeader>

        <UECourseForm
          form={form}
          submitting={submitting}
          onSubmit={form.handleSubmit(onSubmit)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}