// src/components/ui/CountdownDisplay.tsx
import { Fragment } from 'react'
import type { CountdownWindow } from '@/lib/countdown'

// Seul `remaining` sert ici : sans anneau, la durée totale n'a plus d'usage.
type Props = Pick<CountdownWindow, 'remaining'> & {
  /** Légende au-dessus des chiffres, aussi utilisée comme libellé accessible. */
  label: string
}

// Un chiffre = une colonne qui défile.
// `step` : durée (s) pendant laquelle le chiffre reste fixe.
// `size` : nombre de valeurs avant de repasser à zéro (10 pour 0-9, 6 pour 0-5).
const DIGITS = [
  { step: 600, size: 6 },  // dizaines de minutes
  { step: 60, size: 10 },  // minutes
  { step: 10, size: 6 },   // dizaines de secondes
  { step: 1, size: 10 },   // secondes
] as const

// Position de la colonne à l'instant du rendu, exprimée comme un retard d'animation (s).
// Elle place la colonne sur le bon chiffre, et fait tomber le prochain changement
// exactement quand le décompte franchit un multiple de `step`.
function phase(left: number, step: number, size: number) {
  const digit = Math.floor(left / step) % size      // chiffre à afficher maintenant
  const index = size - 1 - digit                    // bande décroissante : 9 en haut, 0 en bas
  return index * step + (step - 1 - (left % step))  // + avance dans le pas en cours
}

/**
 * Décompte `mm:ss` à colonnes défilantes, 100 % CSS (voir globals.css).
 * Aucun état, aucun timer : il reçoit une durée et ne sait pas ce qu'elle mesure.
 * Limite : 59:59 (quatre colonnes).
 */
export function CountdownDisplay({ remaining, label }: Props) {
  // Secondes entières restantes, bornées à la capacité d'affichage
  const left = Math.min(Math.max(Math.ceil(remaining / 1000), 0), 3599)

  return (
    // min-h-40 : même hauteur que RemainingCircle, pour éviter un saut de mise en page au basculement
    <div role="timer" aria-label={label} className="flex min-h-40 flex-col items-center justify-center gap-4">
      {/* Légende visible : déjà portée par aria-label, donc masquée aux lecteurs d'écran */}
      <span aria-hidden className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>

      {/* --left : instant (en s) où les chiffres sont masqués */}
      <div
        aria-hidden
        className="countdown-display flex font-bebas-neue text-8xl leading-none tabular-nums text-foreground"
        style={{ ['--left' as string]: left }}
      >
        {DIGITS.map(({ step, size }, i) => (
          <Fragment key={step}>
            {/* Séparateur entre minutes et secondes */}
            {i === 2 && <span>:</span>}
            <span
              className="countdown-column"
              style={{
                ['--step' as string]: step,
                ['--size' as string]: size,
                ['--phase' as string]: phase(left, step, size),
              }}
            >
              <ol className="countdown-strip">
                {/* size-1 … 0 : ordre décroissant, la bande remonte au fil du temps */}
                {Array.from({ length: size }, (_, k) => size - 1 - k).map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ol>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}