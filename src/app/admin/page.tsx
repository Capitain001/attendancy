import { PrismaErrorPanel } from "@/components/server/PrismaErrorPanel";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold tracking-tight">Admin système</h1>
      <PrismaErrorPanel />
    </main>
  );
}
