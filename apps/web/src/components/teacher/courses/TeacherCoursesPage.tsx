'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from 'cn'
import { GetTeacherCoursesDto } from '@/services/course-teacher'
import Link from 'next/link'

type Course = GetTeacherCoursesDto[number]

interface TeacherCoursesProps {
    courses: GetTeacherCoursesDto
}

export function TeacherCourses({ courses }: TeacherCoursesProps) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

    const classes = useMemo(() => {
        const map = new Map<string, { id: string; name: string; courses: Course[] }>()
        for (const course of courses) {
            const entry = map.get(course.class.id)
            if (entry) entry.courses.push(course)
            else map.set(course.class.id, { id: course.class.id, name: course.class.name, courses: [course] })
        }
        return Array.from(map.values())
    }, [courses])

    const selectedClass = classes.find((k) => k.id === selectedClassId) ?? null

    if (selectedClass) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => setSelectedClassId(null)}
                        className="inline-flex w-fit items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
                    >
                        <ArrowLeft className="size-3" />
                        Mes classes
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight">{selectedClass.name}</h1>
                    <p className="text-sm text-foreground/40">{selectedClass.courses.length} cours.</p>
                </div>

                <div className=" rounded-xl border border-foreground/10">
                    <div className="p-1 overflow-hidden rounded-2xl">
                        {selectedClass.courses.map((course, index) => (
                            <div
                                key={course.id}
                                className={cn(
                                    'group/row flex h-14 items-center gap-3 px-3 text-sm transition-colors bg-foreground/[0.02] sm:h-10 sm:rounded-lg sm:bg-transparent sm:hover:bg-foreground/5',
                                    index !== selectedClass.courses.length - 1 && 'border-b border-foreground/[0.06] sm:border-b-0'
                                )}
                            >
                                <span className="w-4 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground/25">
                                    {String(index + 1).padStart(2, '0')}

                                </span>
                                <span className="h-px w-3 shrink-0 bg-foreground/10" />
                                <Link href={`./courses/${course.id}`} className="truncate text-foreground/70 hover:underline">
                                    {course.name}
                                </Link>
                                <span className="h-px flex-1 bg-foreground/10" />
                                {course.hours !== null && (
                                    <span className="shrink-0 font-mono text-xs tabular-nums text-foreground/30">
                                        {course.hours}h
                                    </span>
                                )}
                                <span
                                    className={`size-1.5 shrink-0 rounded-full ${course.isMain ? 'bg-foreground/60' : 'bg-transparent'
                                        }`}
                                    aria-label={course.isMain ? 'Cours principal' : undefined}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">

                <h1 className="text-2xl font-bold tracking-tight">Mes classes</h1>
                <p className="text-sm text-foreground/40">
                    {classes.length === 0
                        ? 'Aucune classe assignée.'
                        : `${classes.length} classe${classes.length > 1 ? 's' : ''} assignée${classes.length > 1 ? 's' : ''}.`}
                </p>
            </div>

            {classes.length === 0 ? (
                <EmptyClasses />
            ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {classes.map((klass) => (
                        <button
                            key={klass.id}
                            type="button"
                            onClick={() => setSelectedClassId(klass.id)}
                            className="group/card flex items-center gap-3 rounded-md bg-foreground/5 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.07]"
                        >
                            <p className="truncate text-sm font-medium text-foreground/70">{klass.name}</p>
                            <span className="h-px flex-1 bg-foreground/10" />
                            <span className="shrink-0 text-xs text-foreground/30">{klass.courses.length} cours</span>
                            <ChevronRight className="size-3.5 shrink-0 text-foreground/20 transition-transform group-hover/card:translate-x-0.5" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function EmptyClasses() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
            <svg width="140" height="104" viewBox="0 0 140 104" fill="none" className="text-foreground">
                <rect x="8" y="8" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.07" />
                <rect x="74" y="8" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.05" />
                <rect x="8" y="56" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.04" />
                <rect x="74" y="56" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.03" />
                <circle cx="70" cy="52" r="18" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
            </svg>
            <div className="grid gap-1">
                <p className="text-sm font-medium text-foreground/70">Aucune classe assignée</p>
                <p className="text-xs text-foreground/40">Les classes qui vous sont attribuées apparaîtront ici.</p>
            </div>
        </div>
    )
}