"use client"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import React from "react"
import clsx from "clsx"

export type TimeOption = {
  label: string
  value: string
}

interface TimeSelectProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  options: TimeOption[]
  placeholder?: string
  className?: string 
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select time",
  className,
}) => {
  return (
    <div className="flex flex-col gap-1">
      {/* {label && <Label className="text-center"  htmlFor={id}>{label}</Label>} */}
      <Select  value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={clsx("w-auto h-fit", className)}>
          <SelectValue  placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent >
          {options.map((option) => (
            <SelectItem  key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
