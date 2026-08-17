'use client'
import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { card, typography } from "@/styles"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, LibraryBig } from "lucide-react"
import { UECourseCreateButton, UECourseEditAction } from "./UECourseForm"
import { UECourseFilter } from "./UECourseFilter"
import { useUECourse } from "@/hooks/data/ue-course/useUECourse"
import type { GetUEByIdDto } from "@/services/ue"

type UE = NonNullable<GetUEByIdDto>
type UECourse = UE['ueCourses'][number]

export function UECoursesList({ ueId, courses }: { ueId: string, courses: UECourse[] }) {
  const { delete: removeCourse, isDeleting } = useUECourse({ ueId })
  const [query, setQuery] = useState("")

  const filteredCourses = useMemo(() => {
    if (!query) return courses
    const lowerQuery = query.toLowerCase()
    return courses.filter((c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.code && c.code.toLowerCase().includes(lowerQuery))
    )
  }, [courses, query])

  if (courses.length === 0) {
    return (
      <div className={cn(card.soft, "py-12 text-center flex flex-col items-center justify-center")}>
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 mb-4">
          <LibraryBig className="size-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Aucun cours rattaché</h3>
        <p className={cn(typography.body, "text-muted-foreground max-w-sm mb-6")}>
          Cette Unité d'Enseignement ne contient pas encore d'Éléments Constitutifs (EC).
        </p>
        <UECourseCreateButton ueId={ueId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <UECourseFilter query={query} setQuery={setQuery} />
        <UECourseCreateButton ueId={ueId} />
      </div>
      <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Intitulé du cours (EC)</TableHead>
            <TableHead className="text-right">Crédits</TableHead>
            <TableHead className="text-right">Volume Horaire</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCourses.length > 0 ? filteredCourses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {course.code ?? "—"}
              </TableCell>
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell className="text-right">{course.credits}</TableCell>
              <TableCell className="text-right">{course.duration ? `${course.duration}h` : "—"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Ouvrir le menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <UECourseEditAction 
                      ueId={ueId} 
                      course={course} 
                      onSelect={(e) => e.preventDefault()}
                    />
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
                          removeCourse?.(course.id)
                        }
                      }}
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer l'EC
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Aucun résultat pour "{query}"
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  )
}
