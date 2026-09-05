import Link from "next/link";
import { headers } from "next/headers";
import { LogIn } from "@/components/animate-ui/icons/log-in";
import { UserPlus, Users } from "lucide-react";

interface AuthLinksProps {
  className?: string;
}
//               className="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-fill-faint hover:text-text-primary flex items-center gap-2 px-3 py-2"
const LINK_CLASS =
 "rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-fill-faint hover:text-text-primary flex items-center gap-2 px-3 py-2"
  // "bg-foreground/10 hover:bg-btn-background-hover flex items-center gap-2 rounded-md rounded-r-2xl border border-foreground/30 px-3 py-2 no-underline hover:border-foreground/70";

export default async function AuthLinks({
  className = "",
}: AuthLinksProps) {
  const pathname = (await headers()).get("x-pathname");

  const config =
    pathname === "/login"
      ? {
          href: "/auth/signup",
          label: "Sign Up",
          Icon: Users ,
        }
      : {
          href: "/login",
          label: "Login",
          Icon: LogIn,
        };

  return (
    <Link
      href={config.href}
      className={`${LINK_CLASS} ${className}`}
    >
      <config.Icon size={18} />
      {config.label}
    </Link>
  );
}
