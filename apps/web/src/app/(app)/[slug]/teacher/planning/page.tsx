// src/app/(app)/[slug]/teacher/planning/page.tsx
import { connection } from 'next/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { format } from 'date-fns/format'
import { startOfMonth } from 'date-fns/startOfMonth'

import { getQueryClient } from '@/lib/react-query'
import { getCurrentTeacherId } from '@/services/teacher'
import { scheduleDaysQuery } from '@/services/planning/queries'
import { TeacherPlanning } from '@/components/teacher/planning/TeacherPlanning'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  // Mois visible piloté par l'URL (`?month=yyyy-MM`) — défaut : mois courant.
  const { month } = await searchParams
  const monthKey = month ?? format(startOfMonth(new Date()), 'yyyy-MM')

  const queryClient = getQueryClient()

  // Préchargement du mois choisi uniquement. Le jour sélectionné est un état
  // client (`startOfDay(new Date())`) : sa clé dépend du fuseau du navigateur,
  // donc sa requête est dérivée côté client (pas de préchargement serveur).
  await queryClient.prefetchQuery(
    scheduleDaysQuery({ month: monthKey, filters: { teacherId } })
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeacherPlanning teacherId={teacherId} />
    </HydrationBoundary>
  )
}
