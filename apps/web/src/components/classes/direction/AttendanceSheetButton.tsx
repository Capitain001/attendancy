'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExportButton } from '@/components/ui/ExportButton'
import type { ExportColumn } from '@/lib/export'

type Roster = { fullName: string; groupName?: string | null }
type Row = { n: number; name: string; group: string }

const COLUMNS: ExportColumn<Row>[] = [
  { header: 'N°',           value: (r) => String(r.n), width: 5 },
  { header: 'Nom et prénom', value: (r) => r.name },
  { header: 'Groupe',        value: (r) => r.group },
  { header: 'Présent',       value: () => '', width: 12 },
  { header: 'Signature',     value: () => '', width: 24 },
]

export function AttendanceSheetButton({
  className,
  students,
}: {
  className: string
  students: Roster[]
}) {
  return (
    <ExportButton
      disabled={students.length === 0}
      variant="outline"
      formats={['print', 'xlsx', 'csv']}
      defaultFormat="print"
      getConfig={() => ({
        columns: COLUMNS,
        rows: students.map((s, i) => ({
          n: i + 1,
          name: s.fullName,
          group: s.groupName ?? '',
        })),
        filename: `feuille-appel-${className}-${format(new Date(), 'yyyy-MM-dd')}`,
        title: `Feuille d'appel — ${className}`,
        subtitle: format(new Date(), 'eeee d MMMM yyyy', { locale: fr }),
        sheetName: 'Appel',
      })}
    />
  )
}
