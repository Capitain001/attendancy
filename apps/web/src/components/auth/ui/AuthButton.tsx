"use server"
import { UserInfo } from "@/types/user";
import { AuthButtonPopover } from "./AuthButtonPopover"; // ← client component
import AuthLinks from "./AuthLinks";

/**
 * Strips sensitive fields before crossing the server → client boundary.
 * Only the data actually rendered by AuthButtonPopover / AuthMenu is kept.
 */
function toClientUser(user: UserInfo): UserInfo {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    updated_at: user.updated_at,
    organization: user.organization
      ? { id: user.organization.id, slug: user.organization.slug, name: user.organization.name, logo: user.organization.logo, permissions: [] }
      : undefined,
  };
}

export default async function AuthButton({ className, user }: { className?: string; user?: UserInfo }) {
  return user ? (
    <AuthButtonPopover user={toClientUser(user)} className={className} />
  ) : (
    <AuthLinks />
  );
}

