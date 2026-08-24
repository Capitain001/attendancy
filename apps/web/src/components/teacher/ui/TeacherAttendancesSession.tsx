import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ClipboardCheck, CheckCircle2, XCircle, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Attendance = {
  id: string;
  status: string;
  recordedAt: Date | string;
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
  student: {
    id: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
};

interface Props {
  attendancesPromise: Promise<Attendance[]>;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  PRESENT: { icon: <CheckCircle2 className="h-4 w-4" />, variant: "default" },
  ABSENT: { icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
  LATE: { icon: <Clock className="h-4 w-4" />, variant: "secondary" },
  EXCUSED: { icon: <CheckCircle2 className="h-4 w-4" />, variant: "outline" },
};

const TeacherAttendancesSession = ({ attendancesPromise }: Props) => {
  const attendances = use(attendancesPromise);

  if (attendances.length === 0) {
    return (
      <Card  className="border-dashed border/15 shadow-none"> 
        <CardHeader>
          <CardTitle>Présences</CardTitle>
          <CardDescription>Gestion des présences de vos étudiants</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
              <EmptyTitle>Aucune présence</EmptyTitle>
              <EmptyDescription>
                Aucune présence enregistrée pour le moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {attendances.map((attendance) => {
        const recordedAt = typeof attendance.recordedAt === "string" 
          ? new Date(attendance.recordedAt) 
          : attendance.recordedAt;
        const startTime = typeof attendance.schedule.startTime === "string" 
          ? new Date(attendance.schedule.startTime) 
          : attendance.schedule.startTime;
        const config = STATUS_CONFIG[attendance.status] || STATUS_CONFIG.PRESENT;
        const studentName = `${attendance.student.user.firstName || ""} ${attendance.student.user.lastName || ""}`.trim() || attendance.student.user.email;
        const initials = `${attendance.student.user.firstName?.[0] || ""}${attendance.student.user.lastName?.[0] || ""}`.toUpperCase();

        return (
          <Card key={attendance.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarFallback>{initials || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{studentName}</CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-4 w-4" />
                          {attendance.schedule.course.name}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          {format(startTime, "dd MMM yyyy à HH:mm", { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4" />
                          {attendance.schedule.room.name}
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={config.variant} className="flex items-center gap-1">
                  {config.icon}
                  {attendance.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enregistré le {format(recordedAt, "dd MMMM yyyy à HH:mm", { locale: fr })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export { TeacherAttendancesSession };

