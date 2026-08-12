"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReactIcon } from "@/components/ux/Icons";

type YearDTO = {
  id: string;
  name: string;
  isCurrent: boolean;
};

interface SelectYearProps {
  years: YearDTO[];
  selectedYearId?: string;
  onChange: (yearId: string) => void;
}

export function SelectYear({
  years,
  selectedYearId,
  onChange,
}: SelectYearProps) {
  const defaultYear =
    years.find((y) => y.isCurrent)?.id ?? years[0]?.id;

  const value = selectedYearId ?? defaultYear;

  return (
    <div className="flex w-fit items-center gap-4">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="max-w-[220px] border border-dashed bg-muted/30">
          <SelectValue placeholder="Sélectionner une année" />
        </SelectTrigger>

        <SelectContent>
          {years.map((year) => (
            <SelectItem
              key={year.id}
              value={year.id}
              className="flex items-center gap-2"
            >
              <span className="flex items-center gap-2">
                {year.name}
                {year.isCurrent && (
                  <span className="ml-1 text-primary">
                    <ReactIcon name="currentYear" size={14} />
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
