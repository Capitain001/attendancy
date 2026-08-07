// Planning global étudiant — visuel porté de la V1.
import { connection } from "next/server";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { StudentPlanningCalendar } from "@/components/student/planning";
import { mapScheduleToEvent } from "@/components/planning/utils";
import {
  BackpackIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";
import {
  getStudentProfileAction,
  getStudentScheduleAction,
} from "@/services/student";

export default async function StudentPlanningPage() {
  await connection();

  const profileRes = await getStudentProfileAction();
  if ("error" in profileRes) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">{profileRes.error}</p>
      </div>
    );
  }

  const { classId, groupIds } = profileRes.data;
  if (!classId) {
    return (
      <StudentEmpty
        illustration={<BackpackIllustration />}
        title="Aucune classe associée"
        hint="Contacte ta direction pour être inscrit dans une classe — ton planning apparaîtra ici."
        className="h-full"
      />
    );
  }

  const now = new Date();
  const res = await getStudentScheduleAction({
    classId,
    groupIds,
    rangeStart: startOfMonth(subMonths(now, 1)),
    rangeEnd: endOfMonth(addMonths(now, 1)),
  });

  if ("error" in res) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">{res.error}</p>
      </div>
    );
  }

  const events = res.data.map((s) => mapScheduleToEvent(s));

  return <StudentPlanningCalendar events={events} />;
}
