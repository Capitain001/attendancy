// packages/ui/src/components/chat/lan/JoinLan.tsx
'use client'

import { useCallback, useState, type ComponentType, type FormEvent } from 'react'
import type { Pairing } from '@attendancy/chat'
import { cn } from '../../../lib/utils'
import { button, typography } from '../../../styles/ui'
import { chat } from '../../../styles/ui/chat'
import { parsePairingInput } from './lan-status'

const INVALID = "Ce lien n'est pas celui d'une séance locale. Collez le lien affiché par l'hôte."

// Lecteur de code optionnel, fourni par l'app native (brique 7). Il appelle onResult avec le texte
// lu ; true = accepté. Le navigateur n'en fournit pas : la saisie du lien suffit.
export type PairingScannerProps = { onResult: (text: string) => boolean; onCancel: () => void }

export function JoinLan({
  onJoin,
  Scanner,
}: {
  onJoin: (pairing: Pairing) => void
  Scanner?: ComponentType<PairingScannerProps>
}) {
  const [scanning, setScanning] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // true = lien accepté (le lecteur s'arrête), false = la lecture continue
  const accept = useCallback(
    (raw: string) => {
      const pairing = parsePairingInput(raw)
      if (!pairing) {
        setError(INVALID)
        return false
      }
      setError(null)
      setScanning(false)
      setText('')
      onJoin(pairing)
      return true
    },
    [onJoin],
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    accept(text)
  }

  return (
    <div className="flex flex-col gap-4">
      {Scanner &&
        (scanning ? (
          <Scanner onResult={accept} onCancel={() => setScanning(false)} />
        ) : (
          <button type="button" className={cn(button.primary, 'self-start')} onClick={() => setScanning(true)}>
            Scanner le code
          </button>
        ))}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="lan-link" className={cn(typography.small, 'font-medium')}>
          {Scanner ? 'Ou collez le lien de la séance' : 'Lien de la séance'}
        </label>
        <div className="flex gap-2">
          <input
            id="lan-link"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={text}
            placeholder="attendancy://chat?…"
            aria-describedby={error ? 'lan-link-error' : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError(null)
            }}
            className={cn(typography.small, chat.field)}
          />
          <button type="submit" disabled={!text.trim()} className={Scanner ? button.secondary : button.primary}>
            Rejoindre
          </button>
        </div>
        {error && (
          <p id="lan-link-error" role="alert" className={cn(typography.small, 'text-destructive')}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
