// components/teacher/personal/PersonalTeacherWelcome.tsx
import { AlertCircle, ArrowRight, Ban } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button';
import { ResourceIllustration } from '@/components/illustrations/Resourceillustration';

type Props = {
  action: () => Promise<void>
  blockedMessage?: string
  errorMessage?: string
}

// ==========================================
// 1. PARENT / COMPOSATEUR (PersonalTeacherWelcome)
// ==========================================
export function PersonalTeacherWelcome({ action, blockedMessage, errorMessage }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      {blockedMessage ? (
        <PersonalTeacherBlockedUI message={blockedMessage} />
      ) : (
        <PersonalTeacherWelcomeUI action={action} errorMessage={errorMessage} />
      )}
    </main>
  )
}

// ==========================================
// 2. UI PURE : Contenu Accueil + Formulaire
// ==========================================
type WelcomeUIProps = {
  action: () => Promise<void>
  errorMessage?: string
}

export function PersonalTeacherWelcomeUI({ action, errorMessage }: WelcomeUIProps) {
  return (
    <div className="w-full max-w-sm space-y-8  text-center">
      {errorMessage && <PersonalTeacherErrorUI message={errorMessage} />}

      <p className="text-3xl font-semibold tracking-tight">Bienvenue , dans votre espace personel</p>
      <p className="text-sm text-muted-foreground">Pour démarrer, appuyez sur le bouton.</p>
      <form action={action}>
        <div className="relative inline-block mt-1">
          {/* <ResourceIllustration
            name="curved-arrow-1"
            aria-hidden="true"
            className="pointer-events-none absolute right-full bottom-1/2 mr-1 size-12 -translate-y-0.5 dark:invert opacity-60"
          /> */}
          <RippleButton
            type="submit"
            className="inline-flex items-center justify-center pl-5 pr-4 py-2.5 gap-2"
          >
            Démarrer
            <ArrowRight aria-hidden="true" className="size-4" />
          </RippleButton>
        </div>
      </form>
    </div>
  )
}

// ==========================================
// 3. UI PURE : Alerte d'erreur
// ==========================================
export function PersonalTeacherErrorUI({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive"
    >
      <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ==========================================
// 4. UI PURE : État Bloqué / Restreint
// ==========================================
export function PersonalTeacherBlockedUI({ message }: { message: string }) {
  return (
    <div className="w-full max-w-sm space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-destructive">Accès Bloqué</h1>
      <p role="alert" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}