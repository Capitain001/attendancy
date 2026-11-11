// src/components/personal/teacher/student/types.ts
import type { GetPersonalCoursesDto } from "@/features/personal/services/course";
import type { GetStudentsEnrollmentsDto } from "@/services/student-enrollment";

export type PersonalCourse = GetPersonalCoursesDto[number];
export type ClassEnrollment = GetStudentsEnrollmentsDto[number];
export type StudentUser = Pick<
  ClassEnrollment["student"]["user"],
  "avatar_url" | "email" | "firstName" | "lastName"
>;