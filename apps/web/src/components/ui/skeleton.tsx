import { cn } from "@/lib/utils"
import type { AcademicYear } from "@/generated/prisma/client"

function Loader1({ className }: { className?: string }) {
  return <div className={cn("rounded-full border-2 border-current border-t-transparent animate-spin", className)} />
}
import { Calendar } from "lucide-react"
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReactNode } from "react";


function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }


export function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="p-px border rounded-md">
      <div
        data-slot="skeleton"
        className={cn("bg-accent flex justify-center items-center rounded-md", className)}
        {...props}
      >
            <Loader1 className="size-20 animate-pulse opacity-30" />
      </div>
    </div>
  )
}




type RessourceCardProps = React.ComponentProps<"div"> & {
  children?: ReactNode;
  containerClassName?: string;
};

export function RessourceCard({
  className,
  containerClassName,
  children,
  ...props
}: RessourceCardProps) {
  return (
    <div
      className={cn(
        "p-px border w-full  rounded-md overflow-hidden",
        containerClassName
      )}
    >
      <div
        data-slot="skeleton"
        className={cn(
          "bg-accent h-full w-full flex flex-col rounded-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}




export function YearCard({
  className,
  year,
  ...props
}: React.ComponentProps<"div"> & {
  year: AcademicYear;
}) {
  return (
    <RessourceCard
      containerClassName="h-48 md:max-w-[340px]"
      className={className}
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col h-full justify-center items-center gap-4 w-full bg-accent">
        <Calendar className="h-5 w-5" />
        {year?.name}
      </div>

      <span className="flex items-center justify-center border-t h-[60px]">
        <h1 className="text-center w-full font-medium">
          {format(new Date(year.startDate), "dd MMM yyyy", { locale: fr })} -{" "}
          {format(new Date(year.endDate), "dd MMM yyyy", { locale: fr })}
        </h1>
      </span>
    </RessourceCard>
  );
}
