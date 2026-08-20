"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvatarUploader } from "@/hooks/user/useAvatarUploader";
import UserIcon from "./UserIcon";

interface AvatarUploaderProps {
  initialAvatarUrl?: string | null;
  name?: string;
  className?: string;
}

export default function AvatarUploader({
  initialAvatarUrl,
  name,
  className = "",
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const {
    avatarUrl,
    uploading,
    uploadError,
    uploadAvatar,
    lastUpdate,
  } = useAvatarUploader();

  const getAvatarUrlWithCacheBusting = (url: string | null) => {
    if (!url) return null;
    const urlObj = new URL(url);
    urlObj.searchParams.set("cache", lastUpdate.toString());
    return urlObj.toString();
  };

  const currentAvatarUrl = getAvatarUrlWithCacheBusting(
    avatarUrl ?? initialAvatarUrl ?? null,
  );

  // Précharge l'image pour détecter un échec de chargement avant affichage
  useEffect(() => {
    setImgFailed(false);

    if (!currentAvatarUrl) return;

    const img = new window.Image();
    img.src = currentAvatarUrl;
    img.onload = () => setImgFailed(false);
    img.onerror = () => setImgFailed(true);
  }, [currentAvatarUrl]);

  // Image affichée uniquement si elle a réellement chargé — sinon fallback (initiales/icône)
  const displayedAvatarUrl = imgFailed ? null : currentAvatarUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      uploadAvatar(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={cn("group relative inline-flex cursor-pointer", className)}
      onClick={handleClick}
    >
      <UserIcon
        key={lastUpdate}
        name={name}
        avatarUrl={displayedAvatarUrl}
        className="size-24 border-4 border-card text-xl shadow-sm"
      />

      {/* Overlay au hover */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition-all group-hover:bg-black/30 group-hover:text-white">
        <Pencil className="size-5" />
      </div>

      {/* Indicateur de chargement */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
          <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* Indicateur d'échec — upload raté ou image illisible */}
      {!uploading && (uploadError || imgFailed) && (
        <div
          className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-card bg-destructive text-destructive-foreground"
          title={uploadError ? "Échec du téléversement" : "Image introuvable"}
        >
          <AlertTriangle className="size-3.5" />
        </div>
      )}

      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}