import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import UserIcon from "../UserIcon"
import { UserInfo } from "@/types/user" 
import LogOutForm from "@/components/auth/ui/LogOutForm"

// ── Icons
const BadgeCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
)
const CommunityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
const CreditCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
)
const ToggleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="8" cy="12" r="2"/></svg>
)


// ── MenuItem
interface MenuItemProps {
  icon: React.ReactNode
  label: string
  href: string
  badge?: React.ReactNode
  active?: boolean
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, href, badge, active }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200",
      "text-muted-foreground hover:text-foreground hover:bg-foreground/4",
      active && "bg-foreground/5 text-foreground font-medium"
    )}
  >
    <span className="shrink-0 opacity-70 group-hover:opacity-100">{icon}</span>
    <span className="flex-1 text-[13px] tracking-tight">{label}</span>
    {badge && <span className="shrink-0">{badge}</span>}
  </Link>
)

// ── Main AuthMenu Component
export interface AuthMenuProps {
  user?: UserInfo
  className?: string
}

export const AuthMenu: React.FC<AuthMenuProps> = ({ user, className }) => {
  const slug = user?.organization?.slug || "app";

  // ── Data menu
  const menuItems = [
    {
      icon: <BadgeCheckIcon />,
      label: "Profile",
      href: `/${slug}/settings/profile`,
      active: true,
    },
    {
      icon: <CommunityIcon />,
      label: "Community",
      href: "#",
    },
    {
      icon: <CreditCardIcon />,
      label: "Subscription",
      href: `/${slug}/settings/payment`,
      badge: (
        <span className="text-[9px] font-bold bg-foreground/10 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
          Pro
        </span>
      ),
    },
    {
      icon: <ToggleIcon />,
      label: "Settings",
      href: `/${slug}/settings`,
    },
  ]

  return (
    <div className={cn("w-full rounded-lg border border-border/30 bg-card shadow-[var(--shadow-card)]", className)}>
      
      {/* Header */}
      <div className="flex items-center gap-3 py-1 px-3 bg-foreground/[0.01] border-b border-border/50">
      
        <UserIcon avatarUrl={user?.avatar_url ?? null} updatedAt={user?.updated_at}   />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-foreground truncate leading-tight">
            {user?.name || "Invité"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {user?.email || "Non connecté"}
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="p-1.5 space-y-0.5">
        {menuItems.map((item, idx) => (
          <MenuItem
            key={idx}
            icon={item.icon}
            label={item.label}
            href={item.href}
            badge={item.badge}
            active={item.active}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/40 mx-2" />

      {/* Footer Section */}
      <div className="p-1.5">
        <LogOutForm userId={user?.id} />
      </div>
    </div>
  )
}