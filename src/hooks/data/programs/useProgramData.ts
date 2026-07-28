import { useMemo } from 'react';
import type { ProgramSemesterDTO } from '@/services/ue/types';
import { getCourses } from '@/services/ue/utils';

export function useProgramData(semesters: ProgramSemesterDTO[]) {
  return useMemo(() => {
    let totalDuration = 0;
    let totalCredits = 0;
    let totalUEs = 0;
    let totalCourses = 0;

    for (const sem of semesters) {
      totalDuration += sem.totalDuration;
      totalCredits += sem.totalCredits;
      totalUEs += sem.ues.length;
      for (const ue of sem.ues) {
        totalCourses += getCourses(ue).length;
      }
    }

    return { totalDuration, totalCredits, totalUEs, totalCourses };
  }, [semesters]);
}
