// src/components/ui/CountdownCircle.tsx
import type { CountdownWindow } from '@/lib/countdown'

type Props = CountdownWindow & {
  /** Libellé accessible, fourni par le parent (ex. « Début dans »). */
  label: string
}

/**
 * Cercle de décompte `mm:ss` + anneau de progression, 100 % CSS (voir globals.css).
 * Composant serveur : aucun état, aucun timer. Il reçoit des durées en ms et ne
 * sait pas ce que le décompte mesure.
 */
export function CountdownCircle({ remaining, total, label }: Props) {
  // Le CSS travaille en secondes entières (un pas d'animation = une seconde)
  const totalSeconds = Math.ceil(total / 1000)
  if (totalSeconds <= 0) return null

  // Bornée à [0, total] : protège l'animation-delay contre une valeur hors fenêtre
  const left = Math.min(Math.max(Math.ceil(remaining / 1000), 0), totalSeconds)

  return (
    <div
      role="timer"
      aria-label={label}
      className="relative flex size-40 items-center justify-center rounded-full bg-muted"
      // --total : durée de l'animation / départ des chiffres. --left : rattrapage du temps déjà écoulé.
      style={{ ['--total' as string]: totalSeconds, ['--left' as string]: left }}
    >
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
        {/* Piste de l'anneau */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5"
          className="text-muted-foreground/20" />
        {/* Progression : pathLength=1 normalise le tracé, le CSS anime dashoffset de 0 à 1 */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" pathLength={1} strokeDasharray={1}
          className="countdown-ring text-primary" />
      </svg>
      {/* Chiffres générés par le CSS (counter) : masqués aux lecteurs d'écran, `role=timer` + label suffisent */}
      <p aria-hidden className="countdown-digits text-4xl font-light tabular-nums text-foreground" />
    </div>
  )
}