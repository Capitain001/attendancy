import { connection } from 'next/server'
import { TeacherDailyOverviewScreen } from '@/components/teacher/personal/screen/TeacherDailyOverviewScreen'

export default async function TeacherDailyPage() {
  await connection()
  return <TeacherDailyOverviewScreen />
}