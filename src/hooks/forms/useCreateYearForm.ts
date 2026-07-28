'use client';
//@ts-nocheck
import { useState } from 'react';
import { parse, ValiError } from 'valibot';

import { createAcademicYearSchema as createYearSchema } from '@/services/academic-year';
import type { CreateAcademicYearInput as CreateYearFormData } from '@/services/academic-year';
import { useYears } from '@/hooks/data/years/useYears';

export const useCreateYearForm = () => {
  const { create, isCreating, createError, data } = useYears();

  const hasYears = data.items.length > 0;

  const [formData, setFormData] = useState<CreateYearFormData>({
    name: '',
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateYearFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      parse(createYearSchema, formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ValiError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          if (issue.path) {
            const field = issue.path[0].key as keyof CreateYearFormData;
            newErrors[field] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // @ts-ignore
      await create({
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      // Reset form on success (les toasts sont gérés par useCrudEntity)
      resetForm();

    } catch (error) {
      console.error('Erreur lors de la création:', error);
      // Les erreurs sont déjà gérées par useCrudEntity (toast automatique)
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isCreating || isSubmitting;
  const isFormValid = formData.name && formData.startDate && formData.endDate;

  return {
    // Form data
    formData,
    errors,

    // States
    isLoading,
    isFormValid,
    hasYears,
    createError,

    // Actions
    handleInputChange,
    handleSubmit,
    resetForm,
  };
};
