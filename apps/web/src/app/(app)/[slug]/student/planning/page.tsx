// src/app/(app)/[slug]/student/planning/page.tsx
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";

import { getQueryClient } from "@/lib/react-query";
import { StudentPlanning } from "@/components/student/planning/StudentPlanning";
import { BackpackIllustration, StudentEmpty } from "@/components/student/ui/illustrations";
import { getStudentProfileAction } from "@/services/student";
import { studentMonthSchedulesQuery } from "@/services/planning/queries";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function StudentPlanningPage({ searchParams }: Props) {
  await connection();
  const { date: dateParam } = await searchParams;

  const profileRes = await getStudentProfileAction();
  if ("error" in profileRes) {
    return (
      <div className="flex h-full items-center justify-center">
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

  // Date validée : un ?date=abc ne doit pas faire planter getPlanningRange.
  const parsed = dateParam ? parseISO(dateParam) : new Date();
  const activeDate = format(isValid(parsed) ? parsed : new Date(), "yyyy-MM-dd");

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    studentMonthSchedulesQuery({ classId, groupIds, date: activeDate }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentPlanning classId={classId} groupIds={groupIds} initialDate={activeDate} />
    </HydrationBoundary>
  );
}