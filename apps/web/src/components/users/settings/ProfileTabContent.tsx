"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { UserInfo } from "@/types/user";
import { Switch } from "@/components/ui/switch";
import AvatarUploader from "../AvatarUploader";
import { EditNameDialog } from "./EditNameDialog";
import { EditPasswordDialog } from "./EditPasswordDialog";
import { EditEmailDialog } from "./EditEmailDialog";
import { toast } from "sonner";

export function ProfileTabContent({ user }: { user: Partial<UserInfo> }) {
  const [supportAccess, setSupportAccess] = useState(true);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState(false);

  const fullName = user.name?.trim() || "ByeWind";
  const userEmail = user.email || "byewind@twitter.com";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Top Header: Avatar + Name + Email */}
      <div className="flex items-center gap-4">
        <AvatarUploader
          initialAvatarUrl={user.avatar_url ?? null}
          name={fullName}
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground leading-tight truncate">
            {fullName}
          </h2>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {userEmail}
          </p>
        </div>
      </div>

      {/* Name Row */}
      <div
        onClick={() => setIsEditNameOpen(true)}
        className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/40 transition"
      >
        <span className="text-sm font-medium text-foreground">Name</span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
          {fullName}
          <ChevronRight className="size-4" />
        </span>
      </div>

      {/* Section: Account security */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">
          Account security
        </h3>

        {/* Email Row */}
        <div
          onClick={() => setIsEditEmailOpen(true)}
          className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/40 transition border-b border-border/40"
        >
          <span className="text-sm font-medium text-foreground">Email</span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
            {userEmail}
            <ChevronRight className="size-4" />
          </span>
        </div>

        {/* Password Card (Highlighted rounded item) */}
        <div
          onClick={() => setIsEditPasswordOpen(true)}
          className="my-3 rounded-xl bg-muted/40 p-4 flex items-center justify-between cursor-pointer hover:bg-muted/70 transition border border-transparent hover:border-border/60"
        >
          <div>
            <h4 className="text-sm font-semibold text-foreground">Password</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set a permanent password to login to your account.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </div>

        {/* 2-step verification Row */}
        <div
          onClick={() => toast.info("Authentification à deux facteurs bientôt disponible")}
          className="group flex items-center justify-between py-3 border-b border-border/40 cursor-pointer"
        >
          <div>
            <h4 className="text-sm font-medium text-foreground">
              2-step verification
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add an additional layer of security to your account during sign in.
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-4">
            Off
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>

      {/* Section: Support */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">
          Support
        </h3>

        {/* Support Access Row with Blue Toggle Switch */}
        <div className="flex items-start justify-between gap-4 py-3 border-b border-border/40">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">
              Support access
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Grant SnowUI support temporary access to your account so we can troubleshoot problems or recover content on your behalf. You can revoke access at any time.
            </p>
          </div>
          <Switch
            checked={supportAccess}
            onCheckedChange={setSupportAccess}
            className="data-[state=checked]:bg-blue-600 mt-1 shrink-0"
          />
        </div>

        {/* Log out of all devices Row */}
        <div
          onClick={() => toast.success("Toutes les autres sessions ont été déconnectées")}
          className="group flex items-center justify-between py-3 border-b border-border/40 cursor-pointer hover:bg-muted/30 px-2 -mx-2 rounded-md transition"
        >
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Log out of all devices
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Log out of all other active sessions on other devices besides this one.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-4" />
        </div>

        {/* Delete my account Row */}
        <div
          onClick={() => toast.error("Action irréversible. Contactez un administrateur.")}
          className="group flex items-center justify-between py-3 cursor-pointer hover:bg-destructive/5 px-2 -mx-2 rounded-md transition"
        >
          <div>
            <h4 className="text-sm font-medium text-destructive">
              Delete my account
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete the account and remove access from all devices.
            </p>
          </div>
          <ChevronRight className="size-4 text-destructive/80 shrink-0 ml-4" />
        </div>
      </div>

      {/* Dialogs for Editing Profile Fields */}
      <EditNameDialog
        open={isEditNameOpen}
        onOpenChange={setIsEditNameOpen}
        user={user}
      />
      <EditEmailDialog
        open={isEditEmailOpen}
        onOpenChange={setIsEditEmailOpen}
        currentEmail={userEmail}
      />
      <EditPasswordDialog
        open={isEditPasswordOpen}
        onOpenChange={setIsEditPasswordOpen}
      />
    </div>
  );
}
