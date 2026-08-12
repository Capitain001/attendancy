// components/EmptyProgram.tsx
import { FileText } from "lucide-react";
import { ButtonX } from "@/components/design/ButtonX";
import { cn } from "@/lib/utils";

interface EmptyProgramProps {
  href?: string;
  className?: string;
}

export function EmptyProgram({ href, className }: EmptyProgramProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6 rounded-xl border bg-card p-12 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Aucun programme disponible</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Cette classe n'a pas encore de programme associé. Vous pouvez en ajouter un en cliquant sur le bouton ci-dessous.
        </p>
      </div>
      
      <ButtonX href={href}>
        Ajouter un programme
      </ButtonX>
    </div>
  );
}