// src/app/(app)/[slug]/settings/workspace/page.tsx
import { redirect } from "next/navigation";
import { getUserInfo } from "@/modules/user";
import { WorkspaceTabContent } from "@/components/users/settings/WorkspaceTabContent";

export default async function SettingsWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUserInfo();

  if (user?.organization?.type !== "PERSONAL") {
    redirect(`/${slug}/settings`);
  }

  return <WorkspaceTabContent user={user ?? {}} />;
}
