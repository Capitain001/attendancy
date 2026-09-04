import { getUserInfo } from "@/modules/user";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/users/settings/SettingsSidebar";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const user = await getUserInfo();

  if (!user || !user.id) {
    redirect("/login");
  }

  const { slug } = await params;

  return (
    <div className="mx-auto w-full h-full min-h-0 flex flex-col p-2 sm:p-4 md:p-6">
      <div className="flex flex-1 flex-col md:flex-row min-h-0 rounded-xl md:rounded-2xl border border-border/70 bg-card shadow-xl overflow-hidden transition-all">
        <SettingsSidebar user={user} slug={slug} />
        <main className="flex-1 min-h-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
