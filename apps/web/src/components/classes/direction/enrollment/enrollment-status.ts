import type { SearchStudentsForEnrollmentDto } from "@/services/student-enrollment";

export type EnrollmentState = "available" | "reactivable" | "enrolled";

// endedAt (pas deletedAt) : une inscription "reactivable" est une inscription
// clôturée dans CETTE classe — la réactiver rouvre endedAt sans toucher
// classId (cf. reopenStudentEnrollmentRaw côté service).
export function getEnrollmentState(student: SearchStudentsForEnrollmentDto[number]): EnrollmentState {
  const enrollment = student.studentEnrollments[0];
  if (!enrollment) return "available";
  return enrollment.endedAt ? "reactivable" : "enrolled";
}

export function getFullName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}
