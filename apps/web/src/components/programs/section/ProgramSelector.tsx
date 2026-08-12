import { GetProgramsDto } from "@/services/program/types";

interface ProgramSelectorProps {
  value: string;
  programs: GetProgramsDto;
  onChange: (programId: string) => void;
}

export default function ProgramSelector({
  value,
  programs,
  onChange,
}: ProgramSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        Programme
      </label> */}
      <select
        className="h-9 rounded-md border border-neutral-300 bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:border-neutral-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {programs
          .filter((program) => program.isActive !== false || program.id === value)
          .map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}{!program.isActive ? ' (Inactif)' : ''}
            </option>
          ))}
      </select>
    </div>
  );
}
