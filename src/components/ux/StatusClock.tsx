import { CircleCheckBig, Clock, ClockAlert } from "lucide-react";
import type { ScheduleStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

const STATUS: Partial<
  Record<ScheduleStatus, { icon: React.ComponentType<{ className?: string }>; label: string }>
> = {
  PENDING: { icon: Clock, label: "À venir" },
  MISSED: { icon: ClockAlert, label: "Manqué" },
  COMPLETED: { icon: CircleCheckBig, label: "Terminé" },
  CANCELED: { icon: ClockAlert, label: "Annulé" },
};

interface StatusIconProps {
  status: ScheduleStatus;
  className?: string;
}

export default function StatusClock({ status, className }: StatusIconProps) {
  const Icon = STATUS[status]?.icon || Clock;
  const label = STATUS[status]?.label || "À venir";

  return (
    <div className={cn("group relative flex flex-col items-center", className)}>
      <div className="absolute -top-8 scale-0 whitespace-nowrap rounded bg-accent/80 px-2 py-1 text-xs shadow-md transition-all group-hover:scale-100">
        {label}
      </div>
      <Icon className="h-5 w-5 text-blue-500" />
    </div>
  );
}
