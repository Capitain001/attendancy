// src/app/(student)/attend/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { attendAction } from "@/services/session";
import { CheckCircle2, XCircle, Loader2, QrCode } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | "loading"    // vérification en cours
  | "success"    // présence enregistrée
  | "pending"    // déjà enregistré, en attente de confirmation
  | "expired"    // token expiré
  | "error"      // autre erreur
  | "no-token";  // pas de token dans l'URL

// ─── GPS helper ───────────────────────────────────────────────────────────────

async function tryGetCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => resolve(null),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 0 },
    );
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token");

  const [state, setState]     = useState<PageState>(token ? "loading" : "no-token");
  const [message, setMessage] = useState("");

  const submit = useCallback(async () => {
    if (!token) { setState("no-token"); return; }

    setState("loading");

    const coords = await tryGetCoords();
    const result = await attendAction(token, coords ?? undefined);

    if (result.error) {
      if (result.error.includes("expiré")) {
        setState("expired");
      } else {
        setState("error");
        setMessage(result.error);
      }
      return;
    }

    if (result.data?.status ==="PENDING") {
      setState("pending");
    } else {
      setState("success");
    }
  }, [token]);

  useEffect(() => {
    submit();
  }, [submit]);

  // ── Render ────────────────────────────────────────────────────────────────

  const CONFIG = {
    loading: {
      icon:    <Loader2 size={40} className="animate-spin text-muted-foreground" strokeWidth={1.5} />,
      title:   "Vérification…",
      sub:     "Enregistrement de votre présence en cours.",
      color:   "text-foreground",
    },
    success: {
      icon:    <CheckCircle2 size={40} className="text-green-500" strokeWidth={1.5} />,
      title:   "Présence enregistrée",
      sub:     "Votre scan a bien été reçu. Le professeur va confirmer votre présence.",
      color:   "text-green-600",
    },
    pending: {
      icon:    <CheckCircle2 size={40} className="text-amber-500" strokeWidth={1.5} />,
      title:   "Déjà enregistré",
      sub:     "Votre présence est en attente de confirmation par le professeur.",
      color:   "text-amber-600",
    },
    expired: {
      icon:    <XCircle size={40} className="text-red-400" strokeWidth={1.5} />,
      title:   "QR code expiré",
      sub:     "Ce QR code n'est plus valide. Demandez au professeur d'en générer un nouveau.",
      color:   "text-red-500",
    },
    error: {
      icon:    <XCircle size={40} className="text-red-400" strokeWidth={1.5} />,
      title:   "Erreur",
      sub:     message || "Une erreur est survenue. Réessayez.",
      color:   "text-red-500",
    },
    "no-token": {
      icon:    <QrCode size={40} className="text-muted-foreground" strokeWidth={1.5} />,
      title:   "Lien invalide",
      sub:     "Ce lien ne contient pas de code valide. Scannez le QR code du professeur.",
      color:   "text-muted-foreground",
    },
  };

  const current = CONFIG[state];

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-5 text-center max-w-70"
        >
          {/* Icône */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {current.icon}
          </motion.div>

          {/* Texte */}
          <div className="flex flex-col gap-1.5">
            <h1 className={`text-lg font-semibold ${current.color}`}>
              {current.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.sub}
            </p>
          </div>

          {/* Actions */}
          {state === "error" && (
            <button
              onClick={submit}
              className="text-sm font-medium underline underline-offset-2 text-foreground hover:opacity-70 transition-opacity"
            >
              Réessayer
            </button>
          )}

          {(state === "success" || state === "pending") && (
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Retour à l'accueil
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}