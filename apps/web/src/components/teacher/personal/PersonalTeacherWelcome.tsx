// components/teacher/personal/PersonalTeacherWelcome.tsx
// Écran de démarrage, volontairement abstrait : un accueil, un bouton.
// Composant serveur ; `action` est fournie par la page (elle porte la navigation).
import { ArrowRight } from 'lucide-react'

type Props = {
  action: () => Promise<void>
  blockedMessage?: string // démarrage impossible : remplace le bouton
  errorMessage?: string   // échec du dernier essai : le bouton reste affiché
}

export function PersonalTeacherWelcome({ action, blockedMessage, errorMessage }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Bienvenue</h1>

        {blockedMessage ? (
          <p role="alert" className="text-sm text-destructive">{blockedMessage}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Pour démarrer, appuyez sur le bouton.</p>
            {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
            <form action={action}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Démarrer
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}