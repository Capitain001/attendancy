// Historique de présence étudiant — visuel porté de la V1.
import { connection } from "next/server";

import { getStudentAttendancesAction } from "@/services/attendance";
import { AttendanceView } from "@/components/student/attendance";

export default async function StudentAttendancePage() {
  await connection();

  const res = await getStudentAttendancesAction();

  if ("error" in res) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">{res.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Assiduité
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold tracking-tight">
          Mes présences
        </h1>
      </header>
      <AttendanceView attendances={res.data} />
    </div>
  );
}
