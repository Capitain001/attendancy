// components/UserIcon.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
// import { OnlineStatus } from "./OnlineStatus.client";

type UserIconProps = {
  userId: string;
  avatarUrl?: string;
  className?: string;
  avatarClassName?: string; // taille de l'avatar (ex: "size-14"), le défaut shadcn est size-8
  name?: string;
  showName?: boolean; // affiche le nom sous l'avatar
};

export function LiveUserIcon({
  userId,
  avatarUrl,
  className = "",
  avatarClassName,
  name,
  showName = false,
}: UserIconProps) {
  return (
    <div className={cn("relative", showName && "flex flex-col items-center gap-1.5", className)}>
      <div className="relative">
        <Avatar className={cn("rounded-full border", avatarClassName)}>
          <AvatarImage src={avatarUrl || "/avatar.png"} alt={name || "profile"} />
          <AvatarFallback>{name?.[0] || " "}</AvatarFallback>
        </Avatar>

        {/* Affichage du statut en temps réel */}
        {/* <OnlineStatus userId={userId} /> */}
      </div>

      {showName && name && (
        <span className="w-full truncate text-center text-[11px] text-muted-foreground">
          {name}
        </span>
      )}
    </div>
  );
}