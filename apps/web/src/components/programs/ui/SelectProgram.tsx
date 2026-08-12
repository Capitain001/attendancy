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
    isControlled ? onChange?.(val) : setInternalValue(val);
  };

  const selected = programs.find((p) => p.id === selectedValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
        >
          {selected ? selected.name : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Rechercher un programme..." />
          <CommandList>
            <CommandEmpty>Aucun programme trouvé.</CommandEmpty>
            <CommandGroup heading="Programmes">
              {programs.map((program) => (
                <CommandItem
                  key={program.id}
                  value={program.id}
                  onSelect={() => {
                    setValue(program.id);
                    setOpen(false);
                  }}
                  className="flex flex-col px-3 py-2"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium truncate">
                      {program.name} 
                    </span>
                    {selectedValue === program.id && (
                      <CheckIcon size={16} className="text-primary" />
                    )}
                  </div>

                  {program.programTrack && (
                    <span className="text-xs text-muted-foreground mt-1 truncate">
                      Parcours : {program.programTrack.name} 
                    </span>
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
