// src/app/(app)/personal/[slug]/teacher/page.tsx
import { connection } from 'next/server'
import TeacherDailyScreen from '@/components/personal/teacher/screen/TeacherDailyScreen'
import { Skiper37 } from '@/components/ui/skiper-ui/skiper37'

//pnpm dlx shadcn add @skiper-ui/skiper37 
/* 
permetra d aficher un decompte a la place du gros compteur de cours pas de circle pas de fantainsy design propre
*/
export default async function TeacherDailyPage()

{
  await connection()
  return <TeacherDailyScreen/>
}

// {
//   await connection()
//   return <> <Skiper37/> </>
// }

/* 
https://skiper-ui.com/v1/skiper80
afficiher program schedule etudiant , au clik sur un cours afficher le detail du cours 

*/

/* 
perfect for landing page 
https://skiper-ui.com/v1/skiper29

bunx shadcn add @skiper-ui/skiper41
*/