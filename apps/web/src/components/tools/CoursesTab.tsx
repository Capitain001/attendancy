// src/components/tools/CoursesTab.tsx
'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs' // shadcn
import { cn } from '@/lib/utils'
import { Folder, FolderOpen } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

type CourseTab = {
    label: string
    value: string
    count?: number
    content: React.ReactNode
    // Libellé affiché quand l'onglet est INACTIF en mode compact (ex. "S1").
    // Déduit automatiquement de `label` si absent (premier nombre trouvé).
    shortLabel?: string
}

type CoursesTabProps = {
    tabs: CourseTab[]
    defaultValue?: string
    className?: string
    listClassName?: string
    triggerClassName?: string
    contentClassName?: string
    // Nombre d'onglets à partir duquel les inactifs se replient en mode
    // compact (icône + numéro seulement). En dessous, comportement normal.
    compactThreshold?: number
}

function deriveShortLabel(tab: CourseTab) {
    if (tab.shortLabel) return tab.shortLabel
    const digits = tab.label.match(/\d+/)?.[0]
    return digits ? `S${digits}` : tab.label.slice(0, 2).toUpperCase()
}

export function CoursesTab({
    tabs,
    defaultValue,
    className,
    listClassName,
    triggerClassName,
    contentClassName,
    compactThreshold = 6,
}: CoursesTabProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [fade, setFade] = useState({ left: false, right: false })
    const isCompactMode = tabs.length > compactThreshold

    // Filet de sécurité : même en mode compact, au-delà d'un certain nombre
    // de semestres la rangée peut déborder → scroll + fondus.
    const updateFade = () => {
        const el = scrollRef.current
        if (!el) return
        setFade({
            left: el.scrollLeft > 4,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
        })
    }

    useEffect(() => {
        updateFade()
        const el = scrollRef.current
        if (!el) return
        const observer = new ResizeObserver(updateFade)
        observer.observe(el)
        return () => observer.disconnect()
    }, [tabs.length])

    return (
        <Tabs
            defaultValue={defaultValue ?? tabs[0]?.value}
            className={cn('w-full flex flex-col gap-0', className)}
        >
            <div className="relative w-full">
                <div
                    ref={scrollRef}
                    onScroll={updateFade}
                    className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    <TabsList
                        className={cn(
                            'h-auto w-max justify-start gap-1 rounded-none border-0 bg-transparent p-0',
                            listClassName,
                        )}
                    >
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className={cn(
                                    'group relative z-10 -mb-px flex shrink-0 translate-y-0.5 items-center gap-1.5 rounded-tl-md rounded-tr-xl rounded-b-none border border-dashed border-transparent bg-foreground/[0.04] px-3.5 py-2 text-muted-foreground shadow-none transition-colors',
                                    'hover:bg-foreground/[0.07] hover:text-foreground',
                                    'data-[state=active]:translate-y-0 data-[state=active]:border-foreground/20 data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:hover:bg-card',
                                    // Mode compact : les INACTIFS se resserrent (padding réduit).
                                    // L'actif garde toujours px-3.5 (aucun override en dessous).
                                    isCompactMode && 'data-[state=inactive]:px-2',
                                    triggerClassName,
                                )}
                            >
                                <Folder
                                    className="size-3.5 shrink-0 group-data-[state=active]:hidden"
                                    strokeWidth={1.75}
                                />
                                <FolderOpen
                                    className="hidden size-3.5 shrink-0 group-data-[state=active]:block"
                                    strokeWidth={1.75}
                                />

                                {isCompactMode ? (
                                    <>
                                        {/* Replié (inactif) : numéro de semestre seul */}
                                        <span className="font-mono text-[10px] uppercase tracking-wide group-data-[state=active]:hidden">
                                            {deriveShortLabel(tab)}
                                        </span>

                                        {/* Déplié (actif) : libellé complet + compteur */}
                                        <span className="hidden font-mono text-[10px] uppercase tracking-wide group-data-[state=active]:inline">
                                            {tab.label}
                                        </span>
                                        {typeof tab.count === 'number' && (
                                            <span className="hidden font-mono text-[10px] opacity-60 group-data-[state=active]:inline">
                                                ({tab.count})
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    // Peu de semestres : comportement d'origine, pas de repli.
                                    <>
                                        <span className="font-mono text-[10px] uppercase tracking-wide">
                                            {tab.label}
                                        </span>
                                        {typeof tab.count === 'number' && (
                                            <span className="font-mono text-[10px] opacity-60">({tab.count})</span>
                                        )}
                                    </>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent transition-opacity',
                        fade.left ? 'opacity-100' : 'opacity-0',
                    )}
                />
                <div
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent transition-opacity',
                        fade.right ? 'opacity-100' : 'opacity-0',
                    )}
                />
            </div>

            {tabs.map((tab) => (
                <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                        'm-0 rounded-b-xl  rounded-t-none rounded-tr-lg border border-dashed border-foreground/20 bg-card p-4 dark:border-border',
                        contentClassName,
                    )}
                >
                    {tab.content}
                </TabsContent>
            ))}

        </Tabs>
    )
}