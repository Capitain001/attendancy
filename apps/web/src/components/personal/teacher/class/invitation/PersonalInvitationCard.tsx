import Link from "next/link";
import { ChevronRight, UserPlus } from "lucide-react";

export function PersonalInvitationCard({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-4 rounded-md border border-foreground/15 bg-foreground/2 p-4 transition-colors hover:border-foreground/30 hover:bg-foreground/5"
    >
      <div className="space-y-3">
        <div className="inline-flex size-9 items-center justify-center rounded-md border border-foreground/10 bg-foreground/4 text-foreground/70 transition-colors group-hover:text-foreground">
          <UserPlus aria-hidden="true" className="size-4" />
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-semibold tracking-tight text-foreground/90">Invitations</p>
          <p className="text-xs text-foreground/45">
            Inviter des étudiants par lien ou QR code.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs font-medium text-foreground/50 transition-colors group-hover:text-foreground">
        <span>Gérer les invitations</span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}