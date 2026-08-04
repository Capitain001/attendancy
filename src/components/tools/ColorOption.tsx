"use client"

import Link from "next/link"
import { BookDashed, Palette, Plus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type CourseLink = {
  id: string
  name: string
  href: string
}

interface QuickTickerOptionsProps {
  ticker: string
  courses: CourseLink[]
}

export function QuickTickerOptions({ ticker, courses }: QuickTickerOptionsProps) {
  return (
    <div className="flex gap-2 justify-center items-center text-foreground border bg-background rounded-xl px-2 py-1.5">
      {/* Couleur / étiquette */}
      <div className="relative group">
        <Link
          href={`/${ticker}/edit-label`} // future modal route
          className="p-1 hover:bg-muted-foreground/10 rounded-full flex items-center justify-center"
        >
          <Palette className="h-4 w-4 text-primary" />
        </Link>
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-90 transition-opacity text-xs bg-popover border rounded-md px-2 py-0.5 pointer-events-none">
          {ticker}
        </div>
      </div>

      {/* Cours liés */}
      {courses.map((course) => (
        <div key={course.id} className="relative group">
          <Link
            href={course.href}
            className="p-1 hover:bg-muted-foreground/10 rounded-full flex items-center justify-center"
          >
            <BookDashed className="h-4 w-4" />
          </Link>
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-90 transition-opacity text-xs bg-popover border rounded-md px-2 py-0.5 pointer-events-none">
            {course.name}
          </div>
        </div>
      ))}

      {/* Ajout d’un cours */}
      <div className="relative group">
        <Link
          href={`/${ticker}/add-course`}
          className="p-1 hover:bg-muted-foreground/10 rounded-full border border-dashed flex items-center justify-center"
        >
          <Plus className="h-4 w-4 opacity-40" />
        </Link>
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-90 transition-opacity text-xs bg-popover border rounded-md px-2 py-0.5 pointer-events-none">
          add 
        </div>
      </div>
    </div>
  )
}

export function ColorOption({
  children,
  ticker = "etiquette",
  courses = [],
}: {
  children: React.ReactNode
  ticker?: string
  courses?: CourseLink[]
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={2}
          align="center"
          showArrow={true}
          className="p-0 bg-popover rounded-xl"
        >
          <QuickTickerOptions ticker={ticker} courses={courses} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
