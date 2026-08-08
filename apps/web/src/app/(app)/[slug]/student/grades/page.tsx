// Notes étudiant — placeholder (porté à l'identique de la V1 ; suivi des notes à venir).
import {
  NotebookIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";

export default function StudentGradesPage() {
  return (
    <StudentEmpty
      illustration={<NotebookIllustration />}
      title="Le suivi des notes arrive bientôt"
      hint="Tes évaluations par cours seront consultables ici."
      className="h-full"
    />
  );
}
