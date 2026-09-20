import type { getTeacherCourseHourss, getTeacherCourseHours } from "./database";

export type GetTeacherCourseHourssDto = Awaited<ReturnType<typeof getTeacherCourseHourss>>;
export type GetTeacherCourseHoursDto = Awaited<ReturnType<typeof getTeacherCourseHours>>;
