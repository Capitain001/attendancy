// apps/web/scripts/test/generate-session-attendance-pdf.ts
import fs from "node:fs";
import path from "node:path";
import {
  buildSessionAttendancePDFDoc,
  type SessionAttendanceReportData,
} from "../../src/lib/export/session-attendance/pdf";

const mockStudents: Array<{
  firstName: string;
  lastName: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
  scanMinuteOffset: number;
  notes: string | null;
}> = [
  { firstName: "Komlan", lastName: "Abalo", status: "PRESENT", scanMinuteOffset: 3, notes: null },
  { firstName: "Afi", lastName: "Adjakly", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Koffi", lastName: "Agbeko", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Akouvi", lastName: "Agbodjan", status: "LATE", scanMinuteOffset: 22, notes: "Transport" },
  { firstName: "Yao", lastName: "Akakpo", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Ama", lastName: "Amegah", status: "ABSENT", scanMinuteOffset: 0, notes: null },
  { firstName: "Edem", lastName: "Amouzou", status: "PRESENT", scanMinuteOffset: 6, notes: null },
  { firstName: "Sena", lastName: "Atakora", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Kossi", lastName: "Attiogbe", status: "EXCUSED", scanMinuteOffset: 0, notes: "Certificat médical" },
  { firstName: "Dzifa", lastName: "Awesso", status: "PRESENT", scanMinuteOffset: 7, notes: null },
  { firstName: "Mawuli", lastName: "Ayite", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Essi", lastName: "Bagnah", status: "PRESENT", scanMinuteOffset: 8, notes: null },
  { firstName: "Kodjo", lastName: "Bakoma", status: "LATE", scanMinuteOffset: 18, notes: null },
  { firstName: "Nadia", lastName: "Bello", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Foli", lastName: "Boko", status: "ABSENT", scanMinuteOffset: 0, notes: null },
  { firstName: "Clarisse", lastName: "Dabla", status: "PRESENT", scanMinuteOffset: 6, notes: null },
  { firstName: "Sébastien", lastName: "Dogbe", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Kafui", lastName: "Dosseh", status: "PRESENT", scanMinuteOffset: 9, notes: null },
  { firstName: "Hervé", lastName: "Gbeassor", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Yawa", lastName: "Gnassingbe", status: "ABSENT", scanMinuteOffset: 0, notes: null },
  { firstName: "Kokou", lastName: "Johnson", status: "PRESENT", scanMinuteOffset: 3, notes: null },
  { firstName: "mireille", lastName: "Kombate", status: "PRESENT", scanMinuteOffset: 7, notes: null },
  { firstName: "Tété", lastName: "Kpakpo", status: "PRESENT", scanMinuteOffset: 6, notes: null },
  { firstName: "ariane", lastName: "Lawson", status: "LATE", scanMinuteOffset: 25, notes: "Retard signalé" },
  { firstName: "Mensah", lastName: "Loko", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Salomé", lastName: "Natchaba", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Rachid", lastName: "Ouro", status: "ABSENT", scanMinuteOffset: 0, notes: null },
  { firstName: "Estelle", lastName: "Quashie", status: "PRESENT", scanMinuteOffset: 8, notes: null },
  { firstName: "Fogan", lastName: "Sama", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Dédé", lastName: "Seddoh", status: "PRESENT", scanMinuteOffset: 6, notes: null },
  { firstName: "Anani", lastName: "Tchalla", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Bénédicte", lastName: "Teko", status: "PRESENT", scanMinuteOffset: 7, notes: null },
  { firstName: "Kangni", lastName: "Tossou", status: "PRESENT", scanMinuteOffset: 5, notes: null },
  { firstName: "Victoire", lastName: "Wilson", status: "PRESENT", scanMinuteOffset: 6, notes: null },
  { firstName: "Elom", lastName: "Yovo", status: "PRESENT", scanMinuteOffset: 4, notes: null },
  { firstName: "Laté", lastName: "Zinsou", status: "PRESENT", scanMinuteOffset: 5, notes: null },
];

const sessionStart = new Date("2026-11-08T08:00:00.000Z");
const sessionEnd = new Date("2026-11-08T10:00:00.000Z");

const presentCount = mockStudents.filter((s) => s.status === "PRESENT").length;
const lateCount = mockStudents.filter((s) => s.status === "LATE").length;
const absentCount = mockStudents.filter((s) => s.status === "ABSENT").length;
const excusedCount = mockStudents.filter((s) => s.status === "EXCUSED").length;
const attendedCount = presentCount + lateCount;
const totalCount = mockStudents.length;

const mockReport: SessionAttendanceReportData = {
  schedule: {
    id: "00000000-0000-4000-8000-000000000001",
    teacherId: "00000000-0000-4000-8000-000000000002",
    startTime: sessionStart,
    endTime: sessionEnd,
    scheduleType: "CM",
    status: "COMPLETED",
    notes: "Chapitre 4 : Transactions et isolation ACID",
    courseName: "Bases de données avancées",
    courseCode: "INF-301",
    roomName: "Amphi B",
    className: "L3 Génie Logiciel",
    classLevel: "L3",
    groupName: "Groupe A",
    teacher: {
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@ecole.tg",
    },
  },
  organization: {
    name: "École Polytechnique de Lomé",
    logo: null,
  },
  session: {
    id: "00000000-0000-4000-8000-000000000003",
    status: "COMPLETED",
    checkIn: new Date("2026-11-08T08:02:00.000Z"),
    checkOut: new Date("2026-11-08T09:58:00.000Z"),
    durationMinutes: 116,
    isLate: false,
  },
  summary: {
    total: totalCount,
    attended: attendedCount,
    rate: Math.round((attendedCount / totalCount) * 100),
    present: presentCount,
    late: lateCount,
    absent: absentCount,
    excused: excusedCount,
  },
  attendances: mockStudents.map((s, idx) => {
    const firstName = s.firstName.charAt(0).toUpperCase() + s.firstName.slice(1);
    const emailSlug = `${s.firstName}.${s.lastName}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return {
      id: `att-${idx + 1}`,
      status: s.status,
      recordedAt: new Date(sessionStart.getTime() + s.scanMinuteOffset * 60_000),
      notes: s.notes,
      student: {
        id: `stu-${idx + 1}`,
        firstName,
        lastName: s.lastName,
        email: `${emailSlug}@etudiant.ecole.tg`,
      },
    };
  }),
};

async function main() {
  const { doc, filename } = await buildSessionAttendancePDFDoc(mockReport);
  const outDir = path.resolve(process.cwd(), "tmp");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, filename);
  const arrayBuffer = doc.output("arraybuffer");
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outPath, buffer);

  console.log("✅ PDF généré avec succès :");
  console.log(`   Fichier : ${outPath}`);
  console.log(`   Taille  : ${buffer.byteLength} octets`);
  console.log(`   Pages   : ${doc.getNumberOfPages()}`);
  console.log(
    `   Stats   : ${mockReport.summary.attended}/${mockReport.summary.total} suivis (${mockReport.summary.rate}%) — Présents=${presentCount}, Retards=${lateCount}, Absents=${absentCount}, Excusés=${excusedCount}`,
  );
}

main().catch((err) => {
  console.error("❌ Erreur lors de la génération du PDF :", err);
  process.exit(1);
});

