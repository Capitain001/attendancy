"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { UserInfo } from "@/types/user";
import { OrgLogoUploader } from "./OrgLogoUploader";
import { PersonalOrganizationNameRow } from "./PersonalOrganizationNameRow";
import { EditOrgEmailDialog } from "./EditOrgEmailDialog";

export function WorkspaceTabContent({ user }: { user: Partial<UserInfo> }) {
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);

  const org = user.organization;
  const orgName = org?.name?.trim() || "Mon espace";
  const orgEmail = user.email || "";
  const orgSlug = org?.slug || "";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Top Header: Logo + Name + Slug */}
      <div className="flex items-center gap-4">
        <OrgLogoUploader
          organizationId={org?.id}
          initialLogoUrl={org?.logo ?? null}
          name={orgName}
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground leading-tight truncate">
            {orgName}
          </h2>
          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
            /{orgSlug}
          </p>
        </div>
      </div>

      {/* Section: Identity */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Identité de l&apos;espace</h3>

        {/* Name Row */}
        <PersonalOrganizationNameRow initialName={orgName} />

        {/* Email Row */}
        <div
          onClick={() => setIsEditEmailOpen(true)}
          className="group flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/40 transition border-b border-border/40"
        >
          <span className="text-sm font-medium text-foreground">Email</span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
            <span className="truncate">{orgEmail || "Non défini"}</span>
            <ChevronRight className="size-4" />
          </span>
        </div>

        {/* Slug Card (Read-only) */}
        {/* <div className="my-3 rounded-xl bg-muted/40 p-4 flex items-center justify-between border border-transparent">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Identifiant URL</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              L&apos;identifiant qui structure les URLs de votre espace. Il est immuable.
            </p>
          </div>
          <span className="text-sm font-mono text-muted-foreground shrink-0 ml-4">
            /{orgSlug || "identifiant"}
          </span>
        </div> */}
      </div>

      {/* Dialogs for Editing Workspace Fields */}
      <EditOrgEmailDialog
        open={isEditEmailOpen}
        onOpenChange={setIsEditEmailOpen}
        currentEmail={orgEmail}
        organizationId={org?.id}
      />
    </div>
  );
}
