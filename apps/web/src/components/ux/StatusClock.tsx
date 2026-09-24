import { CircleCheckBig, Clock, ClockAlert, Hourglass } from "lucide-react";
import {
  SCHEDULE_UI_STATUS_LABEL,
  type ScheduleUiStatus,
} from "@/services/schedule/policy";
import { cn } from "@/lib/utils";

// Record complet (pas Partial) : un nouveau statut dans la policy
// provoque une erreur TypeScript ici tant que son icône n'est pas définie.
const STATUS_ICON: Record<ScheduleUiStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  ONGOING: Hourglass,
  COMPLETED: CircleCheckBig,
  CANCELED: ClockAlert,
  MISSED: ClockAlert,
};

interface StatusIconProps {
  status: ScheduleUiStatus;
  className?: string;
}

export default function StatusClock({ status, className }: StatusIconProps) {
  const Icon = STATUS_ICON[status];
  const label = SCHEDULE_UI_STATUS_LABEL[status];

  return (
    <div className={cn("group relative flex flex-col items-center", className)}>
      <div className="absolute -top-8 scale-0 whitespace-nowrap rounded bg-accent/80 px-2 py-1 text-xs shadow-md transition-all group-hover:scale-100">
        {label}
      </div>
      <Icon className="h-5 w-5 text-blue-500" />
    </div>
  );
}