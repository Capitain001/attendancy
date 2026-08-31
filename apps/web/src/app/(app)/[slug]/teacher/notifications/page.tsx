import { connection } from 'next/server'
import { TeacherNotificationsPage } from '@/components/teacher/pages/TeacherNotificationsPage'

export default async function Page() {
  await connection()

  return <TeacherNotificationsPage />
}
