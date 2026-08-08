"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, QrCode, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useGenerateToken } from "@/hooks/data/sessions/use-generate-token";
import { ShareAction, useSessionShare } from "@/hooks/data/sessions/use-session-share";
import { SessionShareButton } from "@/components/session/ui/SessionShareButton";

interface SessionQRDisplayProps {
  sessionId: string;
  className?: string;
}

function QRCanvas({
  url,
  canvasRef,
}: {
  url: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: "#1a1a18", light: "#fafaf9" },
    });
  }, [url, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-[11px]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function TimerBar({
  secondsLeft,
  progressPercent,
  isExpired,
}: {
  secondsLeft: number;
  progressPercent: number;
  isExpired: boolean;
}) {
  const urgent = secondsLeft < 60;
  const warning = secondsLeft < 180;
  const barColor = urgent ? "bg-red-500" : warning ? "bg-amber-400" : "bg-emerald-500";

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-[200px]">
      <div className="h-[3px] w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "linear" }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock size={10} />
          {isExpired ? "Expiré" : `Expire dans ${fmt(secondsLeft)}`}
        </span>
        {urgent && !isExpired && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
            <AlertTriangle size={10} />
            Bientôt expiré
          </span>
        )}
      </div>
    </div>
  );
}

export function SessionQRDisplay({ sessionId, className }: SessionQRDisplayProps) {
  const { tokenState, secondsLeft, progressPercent, isExpired, isGenerating, generate } =
    useGenerateToken({ sessionId });

  const { canvasRef, success, run } = useSessionShare({
    url: tokenState?.url ?? "",
    token: tokenState?.token ?? "",
  });

  const [selectedAction, setSelectedAction] = useState<ShareAction>("copy");

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-4 py-2", className)}>
      <div className="relative">
        <AnimatePresence mode="wait">
          {!tokenState ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="size-[180px] rounded-[14px] bg-muted border border-dashed border-border flex flex-col items-center justify-center gap-3"
            >
              <QrCode size={28} className="text-muted-foreground/40" strokeWidth={1.5} />
              <p className="text-[11px] text-muted-foreground text-center px-5 leading-relaxed">
                Génération du QR code…
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={tokenState.token}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: isExpired ? 0.2 : 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-[200px] h-[200px]"
            >
              <div className="rounded-[14px] overflow-hidden border border-border/40">
                <QRCanvas url={tokenState.url} canvasRef={canvasRef} />
              </div>
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[14px]">
                  <span className="text-[12px] font-medium text-foreground bg-card px-3 py-1.5 rounded-full border border-border/50">
                    Expiré
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {tokenState && (
        <TimerBar secondsLeft={secondsLeft} progressPercent={progressPercent} isExpired={isExpired} />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={generate}
          disabled={isGenerating}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-[10px]",
            "text-[12px] font-medium border transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            tokenState
              ? "bg-card text-foreground border-border/50 hover:bg-muted/50"
              : "bg-foreground text-background border-transparent hover:opacity-85"
          )}
        >
          <RefreshCw size={12} className={cn(isGenerating && "animate-spin")} />
          {tokenState ? "Regénérer" : "Générer le QR code"}
        </button>

        {tokenState && (
          <SessionShareButton
            selected={selectedAction}
            success={success}
            onSelect={setSelectedAction}
            onRun={run}
          />
        )}
      </div>
    </div>
  );
}
