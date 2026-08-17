import { ProgramSemesterDTO } from "@/services/ue";
import { ProgramPageData } from "./types";

export const mockSemesters: ProgramSemesterDTO[] = [
  {
    semester: 1, totalDuration: 138, totalCredits: 30,
    ues: [
      { programUEId: 'pue1', semester: 1, order: 1, ueTotalCredits: 7, ueTotalDuration: 60, ue: { id: 'ue1', name: 'Algorithmique & Structures', code: 'INF1100', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc1', order: 1, name: 'Algorithmique de base',  code: '1INF1101', credits: 4, duration: 36, settings: null }, { id: 'uc2', order: 2, name: 'Structures de données', code: '1INF1102', credits: 3, duration: 24, settings: null }] } },
      { programUEId: 'pue2', semester: 1, order: 2, ueTotalCredits: 7, ueTotalDuration: 42, ue: { id: 'ue2', name: 'Développement Web', code: 'INF2200', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc3', order: 1, name: 'HTML/CSS fondamentaux', code: '1INF2201', credits: 2, duration: 18, settings: null }, { id: 'uc4', order: 2, name: 'JavaScript & DOM', code: '1INF2202', credits: 3, duration: 24, settings: null }, { id: 'uc5', order: 3, name: 'Frameworks modernes', code: '1INF2203', credits: 2, duration: 0, settings: null }] } },
      { programUEId: 'pue3', semester: 1, order: 3, ueTotalCredits: 4, ueTotalDuration: 36, ue: { id: 'ue3', name: 'Algèbre', code: 'MTH1100', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc6', order: 1, name: 'Algèbre linéaire', code: '1MTH1101', credits: 4, duration: 36, settings: null }] } },
      { programUEId: 'pue4', semester: 1, order: 4, ueTotalCredits: 6, ueTotalDuration: 0, ue: { id: 'ue4', name: 'Analyse', code: 'MTH2100', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc7', order: 1, name: 'Analyse réelle', code: '1MTH2101', credits: 4, duration: 0, settings: null }, { id: 'uc8', order: 2, name: 'Suites et séries', code: '1MTH2102', credits: 2, duration: 0, settings: null }] } },
    ],
  },
  {
    semester: 2, totalDuration: 120, totalCredits: 30,
    ues: [
      { programUEId: 'pue5', semester: 2, order: 1, ueTotalCredits: 7, ueTotalDuration: 60, ue: { id: 'ue5', name: 'Bases de données', code: 'INF3100', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc9', order: 1, name: 'SQL & Relationnel', code: '1INF3101', credits: 4, duration: 36, settings: null }, { id: 'uc10', order: 2, name: 'NoSQL & Big Data', code: '1INF3102', credits: 3, duration: 24, settings: null }] } },
      { programUEId: 'pue6', semester: 2, order: 2, ueTotalCredits: 7, ueTotalDuration: 60, ue: { id: 'ue6', name: 'Mécanique', code: 'PHY1100', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc11', order: 1, name: 'Mécanique classique', code: '1PHY1101', credits: 4, duration: 36, settings: null }, { id: 'uc12', order: 2, name: 'Dynamique des fluides', code: '1PHY1102', credits: 3, duration: 24, settings: null }] } },
      { programUEId: 'pue7', semester: 2, order: 3, ueTotalCredits: 8, ueTotalDuration: 0, ue: { id: 'ue7', name: 'Probabilités', code: 'MTH3100', description: null, imageUrl: null, departmentId: null, department: null, type: 'FONDAMENTALE',
          ueCourses: [{ id: 'uc13', order: 1, name: 'Probabilités & Stats', code: '1MTH3101', credits: 4, duration: 0, settings: null }, { id: 'uc14', order: 2, name: 'Statistiques appliquées', code: '1MTH3102', credits: 4, duration: 0, settings: null }] } },
    ],
  },
];

export const mockProgram: ProgramPageData = {
  class: {
    name: 'L1-INFO-A', level: 'L1',
    programTrack: 'Génie Logiciel', program: 'Informatique Fondamentale', academicYear: '2024-2025',
  },
  semesters: mockSemesters,
};
