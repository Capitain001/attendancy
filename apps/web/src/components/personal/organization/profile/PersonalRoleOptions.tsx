import type { RoleOptionConfig } from "./roles";
import { Presentation, GraduationCap, UsersRound, type LucideIcon } from "lucide-react";
import type { PersonalRole } from "@/modules/auth/constants";

const ROLE_ICONS: Record<PersonalRole, LucideIcon> = {
  TEACHER: Presentation,
  STUDENT: GraduationCap,
  PARENT: UsersRound,
};

type PersonalRoleOptionsProps = {
  options: RoleOptionConfig[];
  action: (formData: FormData) => void | Promise<void>;
};

export function PersonalRoleOptions({ options, action }: PersonalRoleOptionsProps) {
  return (
    <ul className="divide-y rounded-md border bg-card">
      {options.map(({ role, label, description }) => {
        const Icon = ROLE_ICONS[role] ?? Presentation;

        return (
          <li key={role}>
            <form action={action}>
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{label}</span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                </span>
                <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                  Choisir →
                </span>
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}