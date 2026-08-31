"use client"
import { PromotionCoursesSection, type PromotionCourse } from './PromotionCoursesSection'

// ─────────────────────────────────────────────────────────────────────────────
// Mock — 2 semestres, enseignants avec/sans co-enseignement, un cours sans
// enseignant assigné et un cours sans progression pour couvrir les fallbacks.
// ─────────────────────────────────────────────────────────────────────────────

const mockCourses: PromotionCourse[] = [
  {
    id: 'course-1',
    name: 'Algèbre linéaire',
    credits: 3,
    ueCode: '1MTH1110',
    durationDone: 24,
    durationTotal: 36,
    semester: { id: 'term-s1', name: 'Semestre 1' },
    teachers: [
      { id: 'teacher-1', firstName: 'Awa', lastName: 'Kponou', isMain: true },
    ],
  },
  {
    id: 'course-2',
    name: 'Algorithmique',
    credits: 3,
    ueCode: '1INF1110',
    durationDone: 36,
    durationTotal: 36,
    semester: { id: 'term-s1', name: 'Semestre 1' },
    teachers: [
      { id: 'teacher-2', firstName: 'Kossi', lastName: 'Adjovi', isMain: true },
      { id: 'teacher-3', firstName: 'Fatou', lastName: 'Diallo', isMain: false },
    ],
  },
  {
    id: 'course-3',
    name: 'Fonctions & trigonométrie',
    credits: 3,
    ueCode: '2MTH1110',
    durationDone: 0,
    durationTotal: 36,
    semester: { id: 'term-s1', name: 'Semestre 1' },
    teachers: [],
  },
  {
    id: 'course-4',
    name: 'Algèbre de base',
    credits: 3,
    ueCode: '1MTH1210',
    durationDone: 10,
    durationTotal: 36,
    semester: { id: 'term-s2', name: 'Semestre 2' },
    teachers: [
      { id: 'teacher-1', firstName: 'Awa', lastName: 'Kponou', isMain: true },
    ],
  },
  {
    id: 'course-5',
    name: 'Structures de données',
    credits: 3,
    ueCode: '2INF1210',
    durationDone: 0,
    durationTotal: 0, // pas encore planifié — pct doit rester à 0, pas de division par zéro
    semester: { id: 'term-s2', name: 'Semestre 2' },
    teachers: [
      { id: 'teacher-2', firstName: 'Kossi', lastName: 'Adjovi', isMain: true },
    ],
  },
  {
    id: 'course-6',
    name: 'Module de rattrapage',
    credits: 2,
    ueCode: null,
    durationDone: 0,
    durationTotal: 12,
    semester: null, // cours hors maquette (termId nullable) → onglet "Sans semestre"
    teachers: [
      { id: 'teacher-3', firstName: 'Fatou', lastName: 'Diallo', isMain: true },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Exemple d'usage
// ─────────────────────────────────────────────────────────────────────────────

export default function PromotionCoursesSectionExample() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-sm font-semibold mb-4">Cours — Licence 1 Informatique</h2>
      <PromotionCoursesSection courses={mockCourses} />

      
    </div>
  )
}