import { getExpectedAttendees } from "@/services/attendance/server";

export async function resolveScheduleStudentAttendees(scheduleId: string) {
  try {
    const attendees = await getExpectedAttendees(scheduleId);
    return {
      attendees,
      studentIds: attendees.map((a) => a.studentId),
      userIds: attendees.map((a) => a.userId).filter((id): id is string => Boolean(id)),
    };
  } catch (error) {
    console.error("[resolveScheduleStudentAttendees] Résolution des élèves échouée:", error);
    return { attendees: [], studentIds: [], userIds: [] };
  }
}

