import { connection } from "next/server";

import { AttendanceView } from "@/components/student/attendance/AttendanceView";
import type { AttendanceStatus } from "@/generated/prisma/client";

// ───────── MOCK ─────────
// À supprimer et remplacer par getStudentAttendancesAction() une fois le design validé.
const COURSES = [
  { id: "c1", name: "Algorithmique avancée" },
  { id: "c2", name: "Base de données relationnelles" },
  { id: "c3", name: "Développement web" },
  { id: "c4", name: "Réseaux et sécurité" },
  { id: "c5", name: "Anglais technique" },
  { id: "c6", name: "Gestion de projet" },
];

const STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "PRESENT",
  "LATE",
  "PRESENT",
  "ABSENT",
  "PRESENT",
  "EXCUSED",
  "PRESENT",
  "LATE",
  "PRESENT",
  "PENDING",
  "PENDING",
];

function buildMock() {
  const now = new Date();
  return STATUSES.map((status, i) => {
    const start = new Date(now);
    start.setDate(now.getDate() - i);
    start.setHours(8 + (i % 4) * 2, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    return {
      id: `att-${i + 1}`,
      status,
      recordedAt: new Date(start.getTime() + 5 * 60 * 1000),
      schedule: {
        id: `sch-${i + 1}`,
        startTime: start,
        endTime: end,
        course: COURSES[i % COURSES.length],
      },
    };
  });
}
// ────────────────────────

export default async function StudentAttendancePage() {
  await connection();

  const res = { data: buildMock() };

  return (
    <div className="flex flex-col gap-8 pb-16">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
           présences
        </h1>
      </header>
      <AttendanceView attendances={res.data} />
    </div>
  );
}