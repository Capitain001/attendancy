import { connection } from 'next/server'
import TeacherDailyScreen from '@/components/teacher/personal/screen/TeacherDailyScreen'

export default async function TeacherDailyPage() {
  await connection()
  return <TeacherDailyScreen/>
}