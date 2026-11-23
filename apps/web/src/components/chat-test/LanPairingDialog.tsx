'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { QrCode, Wifi, Copy, Check, Smartphone, Key } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LanPairingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelId?: string
  defaultUrl?: string
  defaultToken?: string
  onConnect?: (pairing: { url: string; token: string }) => void
}

export function LanPairingDialog({
  open,
  onOpenChange,
  channelId = 'classe-terminale',
  defaultUrl = 'ws://192.168.1.50:4040',
  defaultToken = 'tok-seance-8941',
  onConnect,
}: LanPairingDialogProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [manualUrl, setManualUrl] = useState(defaultUrl)
  const [manualToken, setManualToken] = useState(defaultToken)

  const payloadString = JSON.stringify({
    url: defaultUrl,
    token: defaultToken,
    channelId,
  })

  // Génération du QR Code
  useEffect(() => {
    if (open) {
      QRCode.toDataURL(payloadString, { width: 220, margin: 1 })
        .then(setQrDataUrl)
        .catch((err) => console.error('Erreur QR Code:', err))
    }
  }, [open, payloadString])

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualUrl && manualToken) {
      onConnect?.({ url: manualUrl, token: manualToken })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="size-5 text-primary" />
            Chat de classe local (Sans Internet)
          </DialogTitle>
          <DialogDescription>
            Échangez directement sur le réseau local de la salle même si Internet est coupé.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="host" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="host">Partager (Enseignant)</TabsTrigger>
            <TabsTrigger value="join">Rejoindre (Élève)</TabsTrigger>
          </TabsList>

          {/* Onglet Hôte : Afficher le QR Code */}
          <TabsContent value="host" className="mt-4 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-white p-3 shadow-xs">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code d'accès à la séance locale"
                  className="size-48 rounded-lg select-none"
                />
              ) : (
                <div className="flex size-48 items-center justify-center">
                  <QrCode className="size-10 animate-pulse text-muted-foreground" />
                </div>
              )}
            </div>

            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Demandez aux étudiants de scanner ce QR Code avec leur application pour rejoindre le canal local.
            </p>

            <div className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
              <span className="truncate font-mono text-muted-foreground">
                {defaultUrl}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                {copied ? 'Copié' : 'Copier'}
              </Button>
            </div>
          </TabsContent>

          {/* Onglet Rejoindre : Saisie manuelle ou scan */}
          <TabsContent value="join" className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
              <Smartphone className="size-8 text-primary shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Scannez le QR Code affiché</p>
                <p className="text-muted-foreground">
                  Pointez votre appareil vers l'écran de l'enseignant pour vous connecter automatiquement.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lan-url" className="text-xs">
                  Adresse du relais local
                </Label>
                <Input
                  id="lan-url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="ws://192.168.1.50:4040"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lan-token" className="text-xs">
                  Jeton de séance
                </Label>
                <div className="relative">
                  <Input
                    id="lan-token"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="tok-seance-8941"
                    className="h-8 text-xs font-mono pl-8"
                  />
                  <Key className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                </div>
              </div>

              <Button type="submit" size="sm" className="mt-2 w-full">
                Rejoindre le chat local
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
