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
import React from 'react'

type CourseTab = {
    label: string
    value: string
    count?: number
    content: React.ReactNode
}

type CoursesTabProps = {
    tabs: CourseTab[]
    defaultValue?: string
    className?: string
    listClassName?: string
    triggerClassName?: string
    contentClassName?: string
}

export function CoursesTab({
    tabs,
    defaultValue,
    className,
    listClassName,
    triggerClassName,
    contentClassName,
}: CoursesTabProps) {
    return (
        <Tabs
            defaultValue={defaultValue ?? tabs[0]?.value}
            className={cn('w-full flex flex-col gap-0', className)}
        >
            {/* Rangée d'onglets — actif détaché (rounded-top, se fond dans le panneau),
          inactifs reculés (translate-y, fond discret) → effet intercalaires */}
            <TabsList
                className={cn(
                    'h-auto w-52 justify-start gap-1 rounded-none border-0 bg-transparent p-0',
                    listClassName,
                )}
            >
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                            'group relative z-10 -mb-px flex translate-y-0.5 items-center gap-1.5 rounded-t-xl rounded-b-none border border-dashed border-transparent bg-foreground/[0.04] px-3.5 py-2 text-muted-foreground shadow-none transition-all',
                            'hover:bg-foreground/[0.07] hover:text-foreground',
                            'data-[state=active]:translate-y-0 data-[state=active]:border-foreground/20 data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:hover:bg-card',
                            triggerClassName,
                        )}
                    >
                        <Folder
                            className="size-3.5 group-data-[state=active]:hidden"
                            strokeWidth={1.75}
                        />
                        <FolderOpen
                            className="hidden size-3.5 group-data-[state=active]:block"
                            strokeWidth={1.75}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-wide">
                            {tab.label}
                        </span>
                        {typeof tab.count === 'number' && (
                            <span className="font-mono text-[10px] opacity-60">({tab.count})</span>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* Panneau — bordure pointillée cohérente avec les cards, coin
          haut-gauche "coupé" là où l'onglet actif vient se souder */}
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