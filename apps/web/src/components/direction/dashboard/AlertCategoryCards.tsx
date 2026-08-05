import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";

interface AlertCategory {
  key: string;
  label: string;
  count: number;
  Icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  missed: number;
  notStarted: number;
  incomplete: number;
}

export function AlertCategoryCards({ missed, notStarted, incomplete }: Props) {
  const categories: AlertCategory[] = [
    { key: "missed", label: "Non effectuées", count: missed, Icon: AlertTriangle },
    { key: "not-started", label: "Non démarrées", count: notStarted, Icon: Clock },
    { key: "incomplete", label: "Incomplètes", count: incomplete, Icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {categories.map(({ key, label, count, Icon }) => (
        <div
          key={key}
          className="flex flex-col items-center gap-2 rounded-xl bg-muted/40 p-3 text-center transition-colors hover:bg-muted/60"
        >
          <div className="flex items-center gap-4">
            <Icon className="size-5 text-foreground" />
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {count}
            </span>
          </div>
          <span className="text-[11px] leading-tight text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
