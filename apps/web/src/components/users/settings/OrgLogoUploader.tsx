"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgIdentity } from "@/hooks/data/organization/useOrgIdentity";

interface OrgLogoUploaderProps {
  organizationId?: string;
  initialLogoUrl?: string | null;
  name?: string;
  className?: string;
}

export function OrgLogoUploader({
  organizationId,
  initialLogoUrl,
  name,
  className,
}: OrgLogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const { isPending, uploadLogo } = useOrgIdentity(organizationId);

  const logoUrl = initialLogoUrl ?? null;

  useEffect(() => {
    setImgFailed(false);
    if (!logoUrl) return;

    const img = new window.Image();
    img.src = logoUrl;
    img.onload = () => setImgFailed(false);
    img.onerror = () => setImgFailed(true);
  }, [logoUrl]);

  const displayedLogoUrl = imgFailed ? null : logoUrl;
  const initials = (name ?? "?").charAt(0).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClick = () => {
    if (!isPending) fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative inline-flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-sm",
        className,
      )}
    >
      {displayedLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayedLogoUrl}
          alt={name ?? "Logo"}
          className="size-full object-cover"
        />
      ) : (
        <span className="text-2xl font-bold text-primary">{initials}</span>
      )}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-all group-hover:bg-black/30 group-hover:text-white">
        <Pencil className="size-5" />
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isPending}
      />
    </div>
  );
}
