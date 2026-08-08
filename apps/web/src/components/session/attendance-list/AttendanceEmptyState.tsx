import { Clock } from "lucide-react";

export function AttendanceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-2xl">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Clock className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">Aucun scan détecté</p>
      <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
        Les étudiants apparaîtront ici dès qu&apos;ils auront scanné le QR Code.
      </p>
    </div>
  );
}
