import { connection } from "next/server";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { getClassSchedulesAction } from "@/services/schedule";
import { ClassPlanning } from "@/components/planning";
import { getPlanningResourcesAction } from "@/services/planning";

export default async function ClassPlanningPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  await connection();

  const { slug, classId } = await params;
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 1));
  const rangeEnd = endOfMonth(addMonths(now, 1));

  const [schedulesRes, optRes] = await Promise.all([
    getClassSchedulesAction(classId, rangeStart, rangeEnd),
    getPlanningResourcesAction(classId),
  ]);

  if ("error" in schedulesRes) {
    return (
      <div className="p-6 text-destructive">
        {schedulesRes.error ?? "Impossible de charger le planning de la classe."}
      </div>
    );
  }

  if ("error" in optRes || !optRes.data) {
    return (
      <div className="p-6 text-destructive">
        {"error" in optRes ? optRes.error : "Impossible de charger les options du formulaire."}
      </div>
    );
  }

  return (
    <ClassPlanning
      slug={slug}
      classId={classId}
      resources={optRes.data}
      schedules={schedulesRes.data}
    />
  );
}
