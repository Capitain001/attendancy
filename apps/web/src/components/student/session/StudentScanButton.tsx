"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Lecteur QR in-app (D9). Extrait le token du QR du prof et redirige vers
 * `/session/attendance?token=…` (D10) — aucune logique de présence dupliquée ici.
 */
export function StudentScanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleScan(codes: IDetectedBarcode[]) {
    const raw = codes[0]?.rawValue;
    if (!raw) return;

    let token: string | null = raw;
    try {
      if (raw.includes("token=")) {
        token = new URL(raw).searchParams.get("token");
      }
    } catch {
      token = raw;
    }

    if (token) {
      setOpen(false);
      router.push(`/session/attendance?token=${token}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <QrCode className="size-4" />
          Scanner le QR du prof
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scanner le QR</DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl">
          <Scanner onScan={handleScan} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Vise le QR affiché par ton enseignant.
        </p>
      </DialogContent>
    </Dialog>
  );
}
