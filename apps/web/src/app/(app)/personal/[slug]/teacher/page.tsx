import { connection } from 'next/server'
import { TeacherDailyOverviewScreen } from '@/components/teacher/personal/screen/TeacherDailyOverviewScreen'
import TeacherDailyScheduleListScreen from '@/components/teacher/personal/screen/TeacherDailyScheduleListScreen'
import TeacherDailyScreen from '@/components/teacher/personal/screen/TeacherDailyScreen'

export default async function TeacherDailyPage() {
  await connection()
  // return <TeacherDailyOverviewScreen />
  return <TeacherDailyScreen/>
}