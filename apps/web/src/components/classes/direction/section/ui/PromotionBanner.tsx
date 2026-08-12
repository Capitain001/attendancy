import { BackgroundPattern } from "@/components/design/BackgroundPattern";
import { GetClassDto } from "@/services/class/types";
import { Users, GraduationCap } from "lucide-react";

export function PromotionBanner({ class_, title, icon: Icon }: { class_?: GetClassDto, title?: string, icon?: React.ElementType }) {
  const isGeneric = !class_ && title;

  return (
    <div className="relative w-full h-24 md:h-36 overflow-hidden rounded-md border bg-card">
      <BackgroundPattern className="opacity-25 dark:opacity-10" />

      {/* Level badge — top-right */}
      {class_?.level && (
        <span className="absolute top-4 right-4 z-10 rounded-md border bg-background/70 backdrop-blur-sm px-3 py-0.5 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
          {class_.level}
        </span>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full px-5 py-4 md:px-7 md:py-5">
        {/* Class name header */}
        <div className="flex items-center gap-2 text-xs md:text-base uppercase tracking-widest">
          {isGeneric && Icon && <Icon className="size-4 md:size-5 text-muted-foreground" />}
          <span className="font-medium text-muted-foreground">
            {isGeneric ? "Gestion" : "Promotion"}
          </span>
          <h1 className="font-semibold text-foreground">
            {isGeneric ? title : (class_?.name ?? "—")}
          </h1>
        </div>

        {/* Bottom meta row */}
        {!isGeneric && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {class_?.programTrack?.name && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <GraduationCap className="size-3.5 shrink-0 opacity-60" />
                {class_.programTrack.name}
              </span>
            )}

            {class_?.academicYear?.name && (
              <>
                <span className="text-muted-foreground/30 text-sm">·</span>
                <span className="text-sm text-muted-foreground">
                  {class_.academicYear.name}
                </span>
              </>
            )}

            {typeof class_?._count?.studentEnrollments === "number" && (
              <>
                <span className="text-muted-foreground/30 text-sm">·</span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-3.5 shrink-0 opacity-60" />
                  {class_._count.studentEnrollments} étudiant
                  {class_._count.studentEnrollments !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}