"use client";

import { Team, TeamSwitcher } from "@/components/team-switcher";

interface UserSidebarFooterProps {
  teams: Team[]; 
}

export function UserSidebarFooter({ teams }: UserSidebarFooterProps) {
  return (
    <div className="px-2">
      <TeamSwitcher teams={teams} />
    </div>
  );
}




