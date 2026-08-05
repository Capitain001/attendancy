// src/hooks/practical/use-session-share.ts
"use client";

import { useRef, useState } from "react";

export type ShareAction = "copy" | "share" | "download";

interface UseSessionShareOptions {
  url: string;
  token: string;
}

export function useSessionShare({ url, token }: UseSessionShareOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [success, setSuccess] = useState<ShareAction | null>(null);

  const triggerSuccess = (action: ShareAction) => {
    setSuccess(action);
    setTimeout(() => setSuccess(null), 2000);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    triggerSuccess("copy");
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Session QR", url });
        triggerSuccess("share");
        return;
      }
      await navigator.clipboard.writeText(url);
      triggerSuccess("copy");
    } catch {
      // Annulé par l'utilisateur
    }
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `session-qr-${token}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    triggerSuccess("download");
  };

  const run = (action: ShareAction) => {
    if (action === "copy") return copy();
    if (action === "share") return share();
    if (action === "download") return download();
  };

  return { canvasRef, success, run };
}