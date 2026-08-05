import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomInfoProps {
  roomName: string;
  showName?: boolean;
  className?: string;
}

export function RoomInfo({ roomName, showName = false, className }: RoomInfoProps) {
  return (
    <div className={cn("group relative flex items-center gap-1", className)}>
      <MapPin className="h-4 w-4" />
      <span className={`text-xs font-bold ${showName ? "block" : "hidden md:block"}`}>
        {roomName}
      </span>
      {!showName && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 md:hidden">
          {roomName}
        </div>
      )}
    </div>
  );
}
