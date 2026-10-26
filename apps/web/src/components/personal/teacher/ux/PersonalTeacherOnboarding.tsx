import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { rippleButtonClasses } from '@/components/ui/ripple-button'
import { SubmitButton } from '@/components/auth/ui/SubmitButton'
import { personal } from '@/modules/personal/paths'
import type { PersonalClassType } from '@/features/personal/services/class/form'
import { buildQueryUrl } from '@/lib/url'

const CLASS_TYPES: Record<PersonalClassType, { label: string; hint: string }> = {
    COHORT: { label: 'Cohorte', hint: 'Une classe d’établissement, ex. Terminale S1' },
    THEMATIC: { label: 'Groupe thématique', hint: 'Une matière ou un cours, ex. Masterclass React' },
}

const isClassType = (v?: string): v is PersonalClassType => !!v && v in CLASS_TYPES

type Props = {
    slug: string
    step?: string
    type?: string
    error?: string
    createClassAction: (type: PersonalClassType, formData: FormData) => void | Promise<void>
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground/90">{title}</h1>
                <p className="text-sm text-foreground/50">{subtitle}</p>
                {children}
            </div>
        </main>
    )
}

export function PersonalTeacherOnboarding({ slug, step, type, error, createClassAction }: Props) {
    const startUrl = personal.start(slug)

    // Étape 3 : nom de la classe (type valide requis)
    if (step === 'name' && isClassType(type)) {
        return (
            <Shell title="Nommez votre classe" subtitle={CLASS_TYPES[type].hint}>
                <form action={createClassAction.bind(null, type)} className="space-y-3">
                    <input
                        name="name"
                        required
                        maxLength={80}
                        autoFocus
                        autoComplete="off"
                        placeholder="Nom de la classe"
                        className="w-full rounded-md border bg-transparent px-4 py-2.5 text-sm"
                    />
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <SubmitButton label="Créer ma classe" />
                </form>
            </Shell>
        )
    }

    // Étape 2 : type de classe
    if (step === 'type' || step === 'name') {
        return (
            <Shell title="Quel type de classe ?" subtitle="Vous pourrez le modifier plus tard.">
                <div className="space-y-2">
                    {(Object.keys(CLASS_TYPES) as PersonalClassType[]).map((t) => (
                        <Link
                            key={t}
                            href={buildQueryUrl(startUrl, { step: 'name', type: t })}
                            className="block w-full rounded-md border px-4 py-3 text-left hover:bg-muted"
                        >
                            <span className="block text-sm font-medium">{CLASS_TYPES[t].label}</span>
                            <span className="block text-xs text-foreground/50">{CLASS_TYPES[t].hint}</span>
                        </Link>
                    ))}
                </div>
            </Shell>
        )
    }

    // Étape 1 : accueil
    return (
        <Shell
            title="Bienvenue dans votre espace"
            subtitle="Pour démarrer, nous allons configurer votre première classe et organiser votre espace de travail."
        >
            <Link
                href={buildQueryUrl(startUrl, { step: 'type' })}
                className={cn(
                    rippleButtonClasses,
                    'inline-flex w-full items-center justify-center gap-2 py-2.5 pl-5 pr-4 sm:w-auto',
                )}
            >
                Commencer la configuration
                <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
        </Shell>
    )
}