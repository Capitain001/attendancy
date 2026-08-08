import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[54px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
