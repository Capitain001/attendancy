import { cookies } from "next/headers";
import { getUserInfo } from "@/modules/user";
import { getUserDevices } from "@/services/device/database";
import { DeviceRevokeButton } from "./DeviceRevokeButton";
import { Monitor, Smartphone, Tablet, MonitorSmartphone } from "lucide-react";
import { card, typography } from "@/styles";
import { cn } from "@/lib/utils";

function DeviceIcon({ type }: { type: string }) {
  switch (type) {
    case "MOBILE":
      return <Smartphone className="size-5 text-muted-foreground" />;
    case "TABLET":
      return <Tablet className="size-5 text-muted-foreground" />;
    case "DESKTOP":
      return <Monitor className="size-5 text-muted-foreground" />;
    default:
      return <MonitorSmartphone className="size-5 text-muted-foreground" />;
  }
}

export default async function DevicesPage() {
  const user = await getUserInfo();
  if (!user || !user.id) return null;

  const cookieStore = await cookies();
  const currentDeviceId = cookieStore.get("device_id")?.value;

  const devices = await getUserDevices(user.id);
  // Filter out revoked devices
  const activeDevices = devices.filter((d) => !d.revokedAt);

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appareils</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les appareils connectés à votre compte. Vous pouvez déconnecter tout appareil suspect ou que vous n'utilisez plus.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {activeDevices.map((device) => {
          const isCurrentDevice = currentDeviceId === device.deviceId;
          const browserName = device.browser ? `${device.browser} ${device.browserVersion || ""}` : "Navigateur inconnu";
          const osName = device.os ? `${device.os} ${device.osVersion || ""}` : "OS inconnu";
          const location = device.lastIpAddress || "IP inconnue";

          return (
            <div
              key={device.id}
              className={cn(card.base, "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5")}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="p-3 bg-muted rounded-full shrink-0">
                  <DeviceIcon type={device.deviceType} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    {device.label || browserName}
                    {isCurrentDevice && (
                      <span className="sm:hidden text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Cet appareil
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span>{osName}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{location}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Dernière activité :{" "}
                      {new Date(device.lastSeenAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end sm:shrink-0">
                <DeviceRevokeButton deviceId={device.id} isCurrentDevice={isCurrentDevice} />
              </div>
            </div>
          );
        })}

        {activeDevices.length === 0 && (
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <MonitorSmartphone className="size-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun appareil actif trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
