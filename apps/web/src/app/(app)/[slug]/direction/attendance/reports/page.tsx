import { Suspense } from 'react'
import { connection } from 'next/server'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { getAttendanceReportAction } from '@/services/attendance'
import { getClassesAction } from '@/services/class'
import { AttendanceReportPage } from '@/components/direction/attendance/AttendanceReportPage'
import { Loader } from '@/components/loaders/AppLoaders'

interface Props {
  searchParams?: Promise<{ period?: string; classId?: string }>
}

function periodToDates(period: string): { startDate?: Date; endDate?: Date } {
  const now = new Date()
  switch (period) {
    case 'today': return { startDate: startOfDay(now),    endDate: endOfDay(now)    }
    case 'week':  return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'month': return { startDate: startOfMonth(now),  endDate: endOfMonth(now)  }
    default:      return {}
  }
}

async function ReportContent({ searchParams }: Props) {
  const params  = searchParams ? await searchParams : {}
  const period  = params?.period ?? 'all'
  const classId = params?.classId

  const { startDate, endDate } = periodToDates(period)

  const [reportResult, classesResult] = await Promise.all([
    getAttendanceReportAction({ classId, startDate, endDate }),
    getClassesAction(),
  ])

  const rows    = 'error' in reportResult  ? [] : reportResult.data
  const classes = 'error' in classesResult ? [] : classesResult.data

  return (
    <AttendanceReportPage
      rows={rows}
      classes={classes}
      currentPeriod={period}
      currentClassId={classId}
    />
  )
}

export default async function AttendanceReportsPage(props: Props) {
  await connection()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-semibold text-text-primary">Rapports d'assiduité</h1>
      <Suspense fallback={<Loader />}>
        <ReportContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
