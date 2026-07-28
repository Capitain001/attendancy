import type { ProgramUEsDTO, ProgramTable, ProgramUECourses, ProgramSemesterDTO } from './types'

export function getProgramUEsTable(programUEs: ProgramUEsDTO): ProgramTable {
  const semesterMap = new Map<number, ProgramSemesterDTO>()

  for (const pu of programUEs) {
    const semester = pu.semester ?? 1

    if (!semesterMap.has(semester)) {
      semesterMap.set(semester, { semester, totalCredits: 0, totalDuration: 0, ues: [] })
    }

    const semObj = semesterMap.get(semester)!
    const ueTotalCredits  = pu.ue.ueCourses.reduce((sum, c) => sum + c.credits, 0)
    const ueTotalDuration = pu.ue.ueCourses.reduce((sum, c) => sum + c.duration, 0)

    const programUE: ProgramUECourses = {
      programUEId: pu.id,
      semester:    pu.semester,
      order:       pu.order,
      ue:          pu.ue,
      ueTotalCredits,
      ueTotalDuration,
    }

    semObj.ues.push(programUE)
    semObj.totalCredits  += ueTotalCredits
    semObj.totalDuration += ueTotalDuration
  }

  return Array.from(semesterMap.values()).sort((a, b) => a.semester - b.semester)
}

export function getCourses(ue: ProgramUECourses) {
  return ue.ue.ueCourses
}
