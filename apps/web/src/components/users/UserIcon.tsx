import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BadgeCheckIcon } from "lucide-react";

type UserInfo = {
  name?: string | undefined;
  id?: string; 
  avatarUrl?: string | null | undefined;
  className?: string;
  style?: React.CSSProperties; 
  fill?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  
};

export default function UserIcon({ 
   id,  
  name, 
  avatarUrl, 
  className, 
  style,
  fill,

  showOnline 
}: UserInfo) {

  const fallback = name?.charAt(0) || "U";

  return (
    <div
      className={cn(
        "relative group cursor-pointer aspect-square rounded-full border-2 overflow-hidden",
        !fill && "size-10",   
        fill && "w-full h-full",
        className,       
      )}
      style={style}
    >
      <Avatar className="w-full h-full">
        <AvatarImage
          src={avatarUrl || "/avatar.png"}
          alt={name || "User"}
          className="object-cover w-full h-full filter-[inherit]  "
        />
        <AvatarFallback className="text-xs font-medium">
          {fallback}
        </AvatarFallback>
      </Avatar>

      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      </div>


      {showOnline && 
        <span className="absolute bottom-0 end-0 size-3 rounded-full border-2 border-background bg-emerald-500 z-10" />
      }
    </div>
  );
}



/* 

              <span className="absolute top-0 end-0  rounded-full  z-10 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/95" >
                        <BadgeCheckIcon />
                    </span> 
*/