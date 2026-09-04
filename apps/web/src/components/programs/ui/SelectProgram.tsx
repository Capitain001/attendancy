"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { GetProgramsDto } from "@/services/program/types";

interface SelectProgramProps {
  programs: GetProgramsDto;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SelectProgram({
  programs,
  value,
  onChange,
  placeholder = "Sélectionner un programme",
  className,
}: SelectProgramProps) {
  const [open, setOpen] = React.useState(false);

  const isControlled = value !== undefined && onChange !== undefined;
  const [internalValue, setInternalValue] = React.useState("");
  const selectedValue = isControlled ? value : internalValue;

  const setValue = (val: string) => {
    if (isControlled) {
      onChange?.(val);
    } else {
      setInternalValue(val);
    }
  };

  const selected = programs.find((p) => p.id === selectedValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full min-w-[300px] p-0 bg-card" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un programme..." />
          <CommandList>
            <CommandEmpty>Aucun programme trouvé.</CommandEmpty>
            <CommandGroup heading="Programmes disponibles">
              {programs.map((program) => (
                <CommandItem
                  key={program.id}
                  value={program.id}
                  keywords={[program.name, program.description || ""]}
                  onSelect={() => {
                    setValue(program.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {program.name}
                    </span>
                    {program.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {program.description}
                      </span>
                    )}
                  </div>
                  {selectedValue === program.id && (
                    <CheckIcon size={16} className="text-primary shrink-0 ml-2" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
