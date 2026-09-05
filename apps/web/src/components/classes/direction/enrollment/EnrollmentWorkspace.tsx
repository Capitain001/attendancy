"use client";


import { useEnrollmentWorkspace } from "./useEnrollmentWorkspace";
import { EnrollmentSearchPanel } from "./EnrollmentSearchPanel";
import { EnrolledStudentsList } from "./EnrolledStudentsList";
import { EnrollmentSelectionCart } from "./EnrollmentSelectionCart";
import { EnrollmentConfirmDialog } from "./EnrollmentConfirmDialog";
import { GetStudentsEnrollmentsDto } from "@/services/student-enrollment";

type EnrollmentWorkspaceProps = {
  classId: string;
  className: string;
  classIsActive: boolean;
  initialRows: GetStudentsEnrollmentsDto;
};

// Orchestrateur : toute la logique vit dans useEnrollmentWorkspace, ce
// composant ne fait que brancher l'état du hook sur les 4 sous-composants
// visuels (recherche, liste des inscrits, panier, confirmation).
export function EnrollmentWorkspace({
  classId,
  className,
  classIsActive,
  initialRows,
}: EnrollmentWorkspaceProps) {
  const workspace = useEnrollmentWorkspace(classId, initialRows);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-4">
        <EnrollmentSearchPanel
          query={workspace.query}
          onQueryChange={workspace.setQuery}
          onSearch={workspace.runSearch}
          results={workspace.results}
          selectedIds={workspace.selectedIds}
          onToggleStudent={workspace.toggleStudent}
          classIsActive={classIsActive}
          isPending={workspace.isPending}
        />

        <EnrolledStudentsList
          rows={workspace.activeRows}
          classIsActive={classIsActive}
          isPending={workspace.isPending}
          onRemove={workspace.removeEnrollment}
        />
      </div>

      <EnrollmentSelectionCart
        selected={workspace.selected}
        onClear={workspace.clearSelection}
        onRemove={workspace.removeFromSelection}
        onOpenConfirm={() => workspace.setConfirmOpen(true)}
        classIsActive={classIsActive}
        isPending={workspace.isPending}
      />

      <EnrollmentConfirmDialog
        open={workspace.confirmOpen}
        onOpenChange={workspace.setConfirmOpen}
        selected={workspace.selected}
        className={className}
        isPending={workspace.isPending}
        onConfirm={workspace.submitEnrollment}
      />
    </div>
  );
}
