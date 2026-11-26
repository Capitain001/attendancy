'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import { typography } from '../../../styles/ui'

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (options: { formats: string[] }) => Detector

const SCAN_INTERVAL_MS = 200

// BarcodeDetector n'existe pas partout (Chrome et Edge sur Android surtout). Sans lui, le collage
// du lien reste disponible : ne jamais en faire le seul chemin d'appairage.
export const canScanQr = () =>
  typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia

interface QrScannerProps {
  // Reçoit le texte lu ; retourne true s'il est accepté. Sinon la lecture continue.
  onResult: (text: string) => boolean
  onCancel: () => void
}

export function QrScanner({ onResult, onCancel }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  const resultRef = useRef(onResult)
  useEffect(() => {
    resultRef.current = onResult
  })

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let stream: MediaStream | undefined

    async function run() {
      try {
        const Detector = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector
        const detector = new Detector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) return stream.getTracks().forEach((t) => t.stop())

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const tick = async () => {
          if (stopped) return
          try {
            const [code] = await detector.detect(video)
            if (code?.rawValue && resultRef.current(code.rawValue)) return // accepté : le parent ferme le scanner
          } catch {
            // image non décodable : on réessaie à la suivante
          }
          timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS)
        }
        void tick()
      } catch (e) {
        setError(
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? "L'accès à la caméra est refusé. Autorisez-le dans les réglages, ou collez le lien."
            : "Impossible d'ouvrir la caméra. Collez le lien de la séance à la place.",
        )
      }
    }
    void run()

    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className={cn(typography.small, 'text-destructive')}>
          {error}
        </p>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Aperçu de la caméra pour lire le code"
          className="aspect-square w-full max-w-sm rounded-[var(--radius)] border border-border bg-card object-cover"
        />
      )}
      <button
        type="button"
        onClick={onCancel}
        className={cn(typography.small, 'self-start rounded-md px-2 py-1 text-foreground/70 hover:bg-secondary')}
      >
        Annuler
      </button>
    </div>
  )
}

