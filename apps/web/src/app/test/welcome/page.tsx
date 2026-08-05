import Link from 'next/link'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

const templates = [
  { id: 1, name: 'Academic Split',  desc: 'Sidebar + formulaire, deux colonnes' },
  { id: 2, name: 'Elevated Card',   desc: 'Carte centrée sur fond muted' },
  { id: 3, name: 'Glass + Pattern', desc: 'Pattern dots, carte glassmorphisme' },
  { id: 4, name: 'Step Journey',    desc: 'Barre de progression, stepper' },
  { id: 5, name: 'Minimal Open',    desc: 'Typographique, aucune carte' },
]

export default function WelcomeGallery() {
  return (
    <div className="min-h-screen bg-muted p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">Welcome Page — Templates</h1>
          <p className={cn(typography.body, 'mt-1')}>5 directions visuelles — données mock</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map(t => (
            <Link
              key={t.id}
              href={`/test/welcome/${t.id}`}
              className={cn(card.interactive, 'flex items-start gap-4')}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-border flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {t.id}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t.name}
                </p>
                <p className={cn(typography.small, 'mt-0.5')}>{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
