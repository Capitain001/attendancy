"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { revokeDeviceAction } from "@/services/device";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

export function DeviceRevokeButton({ deviceId, isCurrentDevice }: { deviceId: string; isCurrentDevice: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    if (isCurrentDevice) return; // Normally shouldn't be possible to click via UI, but just in case
    startTransition(async () => {
      const res = await revokeDeviceAction({ deviceId });
      if (res.error) {
        toast.error("Erreur lors de la déconnexion de l'appareil", { description: res.error });
      } else {
        toast.success("Appareil déconnecté avec succès");
      }
    });
  };

  if (isCurrentDevice) {
    return (
      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
        Cet appareil
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={isPending}
      onClick={handleRevoke}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <LogOut className="size-4 mr-2" />
          Déconnecter
        </>
      )}
    </Button>
  );
}
