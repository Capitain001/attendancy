import Link from 'next/link'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { getUserInfo } from '@/modules/user'
import { getInvitationsByUser } from '@/modules/invitation/supabase'
import { createClient } from '@/utils/supabase/server'
import { getOrgInvitationsAction } from '@/modules/invitation'
import { getStudentProfileAction } from '@/services/student/actions'

const templates = [
  { id: 1, name: 'Academic Split',  desc: 'Sidebar + formulaire, deux colonnes' },
  { id: 2, name: 'Elevated Card',   desc: 'Carte centrée sur fond muted' },
  { id: 3, name: 'Glass + Pattern', desc: 'Pattern dots, carte glassmorphisme' },
  { id: 4, name: 'Step Journey',    desc: 'Barre de progression, stepper' },
  { id: 5, name: 'Minimal Open',    desc: 'Typographique, aucune carte' },
]

export default async function WelcomeGallery() {
// connexion()
  const user = await getUserInfo({cache: false})

  const inviatations = await getOrgInvitationsAction()
  const supabase = await createClient();
//  const { data, error } = await supabase.from('Invitation').select('*').eq('userId', user?.id);
  //  const { data: { user: user2 }, error } = await supabase.auth.getUser()
   const { data: student, error } = await getStudentProfileAction()
   
 return (

    <div className="min-h-screen bg-muted p-10">
      <div className="max-w-3xl mx-auto">
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div>
        <h1>STUDENT PROFILE </h1>

        <pre>{JSON.stringify(student, null, 2)}</pre>
      </div>

      <div>
        <h1>USER INVITATION </h1>

        <pre>{JSON.stringify(inviatations, null, 2)}</pre>
          {/* <pre>{JSON.stringify(user2, null, 2)}</pre> */}
      </div>
    </div>
  )
}
