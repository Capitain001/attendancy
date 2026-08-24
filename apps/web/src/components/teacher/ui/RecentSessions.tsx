"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentSession {
  id: string;
  status: string;
  checkIn: Date | string | null;
  checkOut: Date | string | null;
  isLate: boolean;
  durationMinutes: number | null;
  createdAt: Date | string;
  schedule: {
    id: string;
    startTime: Date | string;
    endTime: Date | string;
    course: {
      id: string;
      name: string;
    };
    room: {
      id: string;
      name: string;
    };
  };
}

interface RecentSessionsProps {
  sessions: RecentSession[];
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "En cours", icon: Clock, variant: "default" },
  COMPLETED: { label: "Terminée", icon: CheckCircle2, variant: "default" },
  SUSPENDED: { label: "Suspendue", icon: AlertCircle, variant: "secondary" },
  CANCELED: { label: "Annulée", icon: XCircle, variant: "destructive" },
};

export function RecentSessions({ sessions, loading }: RecentSessionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions récentes</CardTitle>
          <CardDescription>Dernières sessions de cours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions récentes</CardTitle>
          <CardDescription>Dernières sessions de cours</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <Clock className="h-12 w-12 text-muted-foreground" />
              <EmptyTitle>Aucune session</EmptyTitle>
              <EmptyDescription>
                Aucune session enregistrée pour le moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions récentes</CardTitle>
        <CardDescription>{sessions.length} dernière{sessions.length > 1 ? "s" : ""} session{sessions.length > 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => {
            const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.COMPLETED;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={session.id}
                className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{session.schedule.course.name}</h4>
                      {session.isLate && (
                        <Badge variant="destructive" className="text-xs">
                          En retard
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>{session.schedule.room.name}</span>
                      {session.checkIn && (
                        <span>
                          Entrée: {format(new Date(session.checkIn), "HH:mm", { locale: fr })}
                        </span>
                      )}
                      {session.checkOut && (
                        <span>
                          Sortie: {format(new Date(session.checkOut), "HH:mm", { locale: fr })}
                        </span>
                      )}
                      {session.durationMinutes && (
                        <span>Durée: {session.durationMinutes} min</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(session.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </div>
                  <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

