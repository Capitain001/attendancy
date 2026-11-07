import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { rippleButtonClasses } from "@/components/ui/ripple-button";
import { personal } from "@/modules/personal/paths";

type Props = {
  slug: string;
};

export function PersonalTeacherWelcome({ slug }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground/90">
          Bienvenue dans votre espace
        </h1>
        <p className="text-sm text-foreground/50">
          Pour démarrer, nous allons configurer votre première classe et organiser votre espace de travail.
        </p>
        <Link
          href={personal.home(slug)}
          className={cn(
            rippleButtonClasses,
            "inline-flex w-full items-center justify-center gap-2 py-2.5 pl-5 pr-4 sm:w-auto"
          )}
        >
          Commencer la configuration
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </main>
  );
}