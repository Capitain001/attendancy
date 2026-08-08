import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { CACHE_KEYS } from "@/config/client_cache";
import { getCurrentTeacherId } from "@/services/teacher";
import { getTeacherNextScheduleAction } from "@/services/schedule";
import TeacherSessionPage from "@/components/session/TeacherSessionPage";

export default async function Page() {
  await connection();

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return <div />;

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: CACHE_KEYS.SCHEDULES.NEXT(teacherId),
    queryFn: () => getTeacherNextScheduleAction({ teacherId }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeacherSessionPage teacherId={teacherId} />
    </HydrationBoundary>
  );
}
