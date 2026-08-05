import Link from 'next/link'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { getUserInfo } from '@/modules/user'

const templates = [
  { id: 1, name: 'Academic Split',  desc: 'Sidebar + formulaire, deux colonnes' },
  { id: 2, name: 'Elevated Card',   desc: 'Carte centrée sur fond muted' },
  { id: 3, name: 'Glass + Pattern', desc: 'Pattern dots, carte glassmorphisme' },
  { id: 4, name: 'Step Journey',    desc: 'Barre de progression, stepper' },
  { id: 5, name: 'Minimal Open',    desc: 'Typographique, aucune carte' },
]

export default async function WelcomeGallery() {
// connexion()
  const user = await getUserInfo()
  return (
    <div className="min-h-screen bg-muted p-10">
      <div className="max-w-3xl mx-auto">
        
      </div>
    </div>
  )
}
