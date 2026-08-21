import { Calendar } from "lucide-react";
import type { ScheduleStatus } from "@/generated/prisma/browser";
import StatusClock from "@/components/ux/StatusClock";
import { RoomInfo } from "@/components/ux/RoomInfo";
import UserIcon from "@/components/users/UserIcon";
import { UserInfoPopover } from "@/components/users/UserInfoPopover";

type Teacher = {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export type CoursePCardProps = {
  date: string;
  courseName: string;
  startTime: string;
  endTime: string;
  roomName: string;
  teacher?: Teacher | null;
  status: ScheduleStatus;
};

export function CoursePCard({
  date,
  courseName,
  startTime,
  endTime,
  roomName,
  teacher,
  status,
}: CoursePCardProps) {
  return (
    <div className="relative flex flex-col h-45 min-w-75 w-full justify-between rounded-sm border bg-card p-4 gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={15} aria-hidden />
          <span>{date}</span>
        </div>
        <StatusClock status={status} />
      </div>

      <div className="flex flex-col items-center justify-center gap-y-2">
        <div className="inline-flex items-center rounded-xl bg-secondary px-4 py-1 text-sm font-semibold">
          {courseName}
        </div>
        <div className="px-4 font-medium text-muted-foreground text-sm">
          {startTime} – {endTime}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <RoomInfo showName roomName={roomName} />
        {teacher ? (
          <UserInfoPopover
            name={teacher.name ?? undefined}
            avatarUrl={teacher?.avatarUrl ?? undefined}
            className="size-8"
          />
        ) : (
          <UserIcon className="size-8 opacity-40" />
        )}
      </div>
    </div>
  );
}
