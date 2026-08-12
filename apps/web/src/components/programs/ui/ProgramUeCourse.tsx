import AccordionSection from "@/components/tools/AccordionSection";
import { UeCourseDTO } from "@/services/ue/types";

interface ProgramUeCourseProps {
  ueCourses?: UeCourseDTO[];
}

export default function ProgramUeCourse({ ueCourses = [] }: ProgramUeCourseProps) {
  if (!ueCourses.length) {
    return (
      <div className="text-sm italic text-muted-foreground px-2 py-1">
        Aucun cours dans cette UE
      </div>
    );
  }

  const gridCols = "grid-cols-[2fr_1fr_1fr]"; // nom / durée / crédits

  return (
    <AccordionSection
      className="ml-5 rounded"
      titleClassName="p-2 px-5"
      title={`Cours (${ueCourses.length})`}
    >
      {/* Header séparé */}
      <div className={`grid ${gridCols} bg-card px-2 py-1 rounded font-medium mb-2`}>
        <div>Nom</div>
        <div>Durée</div>
        <div>Crédits</div>
      </div>

      {/* Liste des cours */}
      <div className="flex flex-col gap-1">
        {ueCourses.map((course) => (
          <div
            key={course.id}
            title={course.name}
            className="grid border border-dashed rounded p-2 hover:bg-muted/50 transition-colors"
            style={{ gridTemplateColumns: "2fr 1fr 1fr" }}
          >
            <div>{course.name}</div>
            <div>{course.duration}h</div>
            <div>{course.credits}</div>
          </div>
        ))}
      </div>
    </AccordionSection>
  );
}