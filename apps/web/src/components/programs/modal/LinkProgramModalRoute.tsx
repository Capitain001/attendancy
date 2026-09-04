"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LinkProgramDialog } from "./LinkProgramDialog";
import type { GetProgramsDto } from "@/services/program/types";

interface LinkProgramModalRouteProps {
  classId: string;
  programs: GetProgramsDto;
}

export function LinkProgramModalRoute({
  classId,
  programs,
}: LinkProgramModalRouteProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("program_modal");
      const search = params.toString();
      router.replace(`${pathname}${search ? `?${search}` : ""}`);
    }
  };

  return (
    <LinkProgramDialog
      open={true}
      onOpenChange={handleOpenChange}
      classId={classId}
      programs={programs}
    />
  );
}
