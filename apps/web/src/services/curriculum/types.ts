import type { getCurriculums, getCurriculum } from "./database";

export type GetCurriculumsDto = Awaited<ReturnType<typeof getCurriculums>>;
export type GetCurriculumDto = Awaited<ReturnType<typeof getCurriculum>>;
