'use client'

import { useEffect, useState } from 'react'
import { getOrgIdentityAction } from '@/services/organization'
import { getDepartmentsAction } from '@/services/department'
import { getClassesAction } from '@/services/class'
import { TeacherSeedCard } from './cards/TeacherSeedCard'
import { StudentSeedCard } from './cards/StudentSeedCard'
import { ParentSeedCard } from './cards/ParentSeedCard'
import { CourseTeacherSeedCard } from './cards/CourseTeacherSeedCard'
import { PurgeSeedCard } from './cards/PurgeSeedCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { Sprout, Building2, RefreshCw } from 'lucide-react'

interface SeedPanelProps {
  initialOrgId?: string
}

type DepartmentItem = { id: string; name: string }
type ClassItem = { id: string; name: string; level?: string }

export function SeedPanel({ initialOrgId = '' }: SeedPanelProps) {
  const [orgId, setOrgId] = useState<string>(initialOrgId)
  const [orgName, setOrgName] = useState<string>('')
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingData, setLoadingData] = useState<boolean>(true)

  const loadOrgData = async () => {
    setLoadingData(true)
    try {
      // 1. Fetch current org identity
      const orgRes = await getOrgIdentityAction()
      if (orgRes.data?.id) {
        setOrgId(orgRes.data.id)
        setOrgName(orgRes.data.name)
      }

      // 2. Fetch departments
      const deptRes = await getDepartmentsAction()
      if (deptRes.data) {
        setDepartments(deptRes.data.map((d) => ({ id: d.id, name: d.name })))
      }

      // 3. Fetch classes
      const classRes = await getClassesAction({})
      if (classRes.data) {
        setClasses(classRes.data.map((c) => ({ id: c.id, name: c.name, level: c.level })))
      }
    } catch (err) {
      console.error('Error loading seed panel select data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadOrgData()
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sprout className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Panneau de Seed & Génération de Données</h1>
              <p className={cn(typography.small, 'text-muted-foreground')}>
                Outil d'administration pour peupler et nettoyer les jeux de données de démonstration
              </p>
            </div>
          </div>
          <button
            onClick={loadOrgData}
            disabled={loadingData}
            title="Rafraîchir les options de l'organisation"
            className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <RefreshCw className={cn('size-4', loadingData && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Top Organization Selector Card */}
      <div className={cn(card.base, 'p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20')}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Building2 className="size-5 text-muted-foreground shrink-0" />
          <div className="space-y-1 w-full sm:w-[360px]">
            <div className="flex items-center justify-between">
              <Label htmlFor="seed-org-id" className="text-xs font-semibold">
                ID de l'Organisation Cible <span className="text-destructive">*</span>
              </Label>
              {orgName && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
                  {orgName}
                </span>
              )}
            </div>
            <Input
              id="seed-org-id"
              type="text"
              placeholder="Saisissez ou modifiez l'ID d'organisation..."
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground max-w-sm">
          💡 ID automatiquement détecté depuis la session courante ({departments.length} départements, {classes.length} classes détectées).
        </div>
      </div>

      {/* Grid of generator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeacherSeedCard orgId={orgId} departments={departments} />
        <StudentSeedCard orgId={orgId} classes={classes} />
        <ParentSeedCard orgId={orgId} />
        <CourseTeacherSeedCard orgId={orgId} classes={classes} />
      </div>

      {/* Purge card on its own row */}
      <div className="w-full">
        <PurgeSeedCard orgId={orgId} />
      </div>
    </div>
  )
}
