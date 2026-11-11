// src/app/(app)/personal/[slug]/teacher/planning/page.tsx
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { startOfMonth } from "date-fns/startOfMonth";

import { getPersonalClassesAction } from "@/features/personal/services/class";
import { getQueryClient } from "@/lib/react-query";
import { personal } from "@/modules/personal/paths";
import { getCurrentTeacherId } from "@/services/teacher";
import { getPlanningResourcesAction } from "@/services/planning";
import { planningSchedulesQuery } from "@/services/planning/queries";
import { TeacherPersonalPlanning } from "@/components/teacher/planning/TeacherPersonalPlanning";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ classId?: string; month?: string }>;
}) {
  await connection();

  const [{ slug }, { classId: queryClassId, month }] = await Promise.all([
    params,
    searchParams,
  ]);

  const [classesRes, teacherId] = await Promise.all([
    getPersonalClassesAction(),
    getCurrentTeacherId(),
  ]);

  if ("error" in classesRes || !classesRes.data) {
    return (
      <div className="p-6 text-destructive">
        {"error" in classesRes ? classesRes.error : "Impossible de charger vos classes."}
      </div>
    );
  }

  const classes = classesRes.data;
  if (classes.length === 0) {
    redirect(personal.start(slug));
  }

  const activeClass = classes.find((c) => c.id === queryClassId) ?? classes[0];
  const monthKey = month ?? format(startOfMonth(new Date()), "yyyy-MM");

  const queryClient = getQueryClient();
  const [resourcesRes] = await Promise.all([
    getPlanningResourcesAction(activeClass.id),
    queryClient.prefetchQuery(
      planningSchedulesQuery({ date: `${monthKey}-01`, teacherId: teacherId ?? undefined })
    ),
  ]);

  if ("error" in resourcesRes || !resourcesRes.data) {
    return (
      <div className="p-6 text-destructive">
        {"error" in resourcesRes
          ? resourcesRes.error
          : "Impossible de charger les options du formulaire."}
      </div>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeacherPersonalPlanning
        classId={activeClass.id}
        teacherId={teacherId ?? undefined}
        resources={resourcesRes.data}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
      />
    </HydrationBoundary>
  );
}