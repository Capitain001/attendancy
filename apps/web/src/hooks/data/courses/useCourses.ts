// src/hooks/data/courses/useCourses.ts

"use client";

import { useCrudEntity } from "@/hooks/entity/useCrudEntity";
import { toFetchFn, toCreateFn, toUpdateFn, toDeleteFn } from "@/hooks/entity/actionHelpers";
import {
  createCourseAction,
  updateCourseAction,
  removeCourseAction,
  getCoursesAction
} from "@/services/course/actions";
import type { CreateCourseInput, UpdateCourseDataInput } from "@/services/course/validation";
import type { GetCoursesItem } from "@/services/course/types";

// Types pour les inputs du hook
export type { CreateCourseInput };
export type UpdateCourseInput = UpdateCourseDataInput;

export interface UseCoursesOptions {
  classId?: string;
  staleTime?: number;
  enabled?: boolean;
}

/**
 * Hook pour gérer les cours avec CRUD complet
 * 
 * @example
 * ```tsx
 * // Utilisation de base
 * const { 
 *   data,           // { items: CourseDTO[], byId: Record<string, CourseDTO> }
 *   loading,        
 *   create,         // (data: CreateCourseInput) => Promise<CourseDTO>
 *   update,         // ({ id: string, data: UpdateCourseInput }) => Promise<CourseDTO>
 *   delete: deleteCourse, // (id: string) => Promise<void>
 *   isCreating,    
 *   isUpdating,     
 *   isDeleting      
 * 
 * // Accéder aux cours
 * const courses = data.items; // ou data.byId[id]
 * 
 * // Filtrer par classe
 * const { data } = useCourses({ classId: "class-123" });
 * 
 * // Créer un cours
 * await create({ 
 *   name: "Mathématiques", 
 *   classId: "class-123",
 *   code: "MAT-101",
 *   description: "Cours de mathématiques",
 *   duration: 60
 * });
 * 
 * // Mettre à jour un cours
 * await update({ 
 *   id: "course-123", 
 *   data: { name: "Mathématiques Avancées" } 
 * });
 * 
 * // Supprimer un cours
 * deleteCourse("course-123");
 * ```
 */
export function useCourses(options: UseCoursesOptions = {}) {
  const { classId, staleTime, enabled } = options;

  // ✅ Utilisation des helpers réutilisables
  const fetchFn = toFetchFn(getCoursesAction, { classId });
  const create = toCreateFn(createCourseAction);
  const update = toUpdateFn(updateCourseAction, "courseId");
  const deleteCourse = toDeleteFn(removeCourseAction);

  return useCrudEntity<GetCoursesItem, CreateCourseInput, UpdateCourseInput>({
    entityName: "courses",
    fetchFn,
    staleTime,
    enabled,
    crud: {
      create,
      update,
      delete: deleteCourse,
      messages: {
        create: "Cours créé avec succès",
        update: "Cours modifié avec succès",
        delete: "Cours supprimé avec succès",
        error: "Une erreur est survenue"
      }
    }
  });
}

