// src/components/session/widget/NextSessionWidgetServer.tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTeacherNextScheduleAction } from "@/services/schedule";
import { getQueryClient } from "@/lib/react-query";
import { CACHE_KEYS } from "@/config/client_cache";
import { NextSessionWidgetPopover } from "./NextSessionWidgetPopover";
import { getCurrentTeacherId } from "@/services/teacher";

export async function NextSessionWidgetServer() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: CACHE_KEYS.SCHEDULES.NEXT(teacherId),
    queryFn: () => getTeacherNextScheduleAction({ teacherId }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NextSessionWidgetPopover teacherId={teacherId} />
    </HydrationBoundary>
  );
}