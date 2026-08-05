"use server"
import Link from "next/link";
import { UserInfo } from "@/types/user";
import { AuthButtonPopover } from "./AuthButtonPopover"; // ← client component
import { LogIn } from "@/components/animate-ui/icons/log-in";
import AuthLinks from "./AuthLinks";

export default async function AuthButton({ className, user }: { className?: string; user?: UserInfo }) {
  return user ? (
    <AuthButtonPopover user={user} className={className} />
  ) : (
    <AuthLinks />
  );
}            