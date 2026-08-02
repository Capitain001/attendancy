"use client";

import { X } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface FilterShellProps {
  label: string;
  hasValue: boolean;
  onReset: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function FilterShell({
  label,
  hasValue,
  onReset,
  children,
  icon,
}: FilterShellProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground"
            onClick={onReset}
            aria-label={`Réinitialiser ${label}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </SidebarGroupLabel>
      <SidebarGroupContent>{children}</SidebarGroupContent>
    </SidebarGroup>
  );
}
