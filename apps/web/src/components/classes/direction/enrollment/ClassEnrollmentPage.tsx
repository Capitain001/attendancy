import { getStudentEnrollmentsAction } from "@/services/student-enrollment";
import type { GetClassDto } from "@/services/class/types";
import { EnrollmentWorkspace } from "./EnrollmentWorkspace";
import { CollapseSection } from "../section/ui";

type ClassEnrollmentPageProps = {
  classData: NonNullable<GetClassDto>;
  classId: string;
};

export async function ClassEnrollmentPage({ classData, classId }: ClassEnrollmentPageProps) {
  const enrollmentsRes = await getStudentEnrollmentsAction({ classId });
  const enrollmentRows = enrollmentsRes.data ?? [];
  const enrollmentError = enrollmentsRes.error ?? null;

  const academicYear = classData.academicYear;
  const classIsActive = academicYear.isActive;

  return (
    <div className="scroll-smooth flex flex-col gap-y-4 pb-10">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          Direction · Classes
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Inscription des étudiants</h1>
        <p className="text-sm text-muted-foreground">
          Inscrivez les étudiants existants dans {classData.name}.
        </p>
      </header>

      {enrollmentError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {enrollmentError}
        </p>
      )}

      <CollapseSection label="Enrolement" count={enrollmentRows.length} defaultOpen>
        <EnrollmentWorkspace
          classId={classId}
          className={classData.name}
          classIsActive={classIsActive}
          initialRows={enrollmentRows}
        />
      </CollapseSection>
    </div>
  );
}
