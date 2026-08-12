//src/components/programs/modal/ProgramModalRoute.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProgramDialog } from "@/components/programs/modal/ProgramDialog";

interface ProgramModalRouteProps {
  classId: string;
  programTrackId: string;
}

export function ProgramModalRoute({ classId, programTrackId }: ProgramModalRouteProps) {
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
    <ProgramDialog
      open={true}
      onOpenChange={handleOpenChange}
      classId={classId}
      programTrackId={programTrackId}
    />
  );
}
