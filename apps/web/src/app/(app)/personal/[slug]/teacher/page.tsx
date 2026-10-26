import { connection } from 'next/server'
import TeacherDailyScreen from '@/components/personal/teacher/screen/TeacherDailyScreen'

export default async function TeacherDailyPage() {
  await connection()
  return <TeacherDailyScreen/>
}