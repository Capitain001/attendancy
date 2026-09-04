"use client";

import { useState } from "react";
import { Mail, Bell, SunMedium } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function NotificationsSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">Préférences de notifications</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Gérez les canaux et la fréquence des alertes reçues.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-semibold">Notifications par email</h4>
              <p className="text-xs text-muted-foreground">Recevez les récapitulatifs d'assiduité et alertes par email</p>
            </div>
          </div>
          <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-semibold">Alertes Push navigateur</h4>
              <p className="text-xs text-muted-foreground">Notifications en temps réel sur les activités et émargements</p>
            </div>
          </div>
          <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <SunMedium className="size-5 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-semibold">Rapport hebdomadaire</h4>
              <p className="text-xs text-muted-foreground">Synthèse automatique de la semaine envoyée chaque lundi</p>
            </div>
          </div>
          <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
        </div>
      </div>
    </div>
  );
}
