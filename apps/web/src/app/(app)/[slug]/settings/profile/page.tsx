// src/app/(app)/[slug]/settings/profile/page.tsx
import { redirect } from "next/navigation";
import { getUserInfo } from "@/modules/user";
import { ProfileTabContent } from "@/components/users/settings/ProfileTabContent";

export default async function SettingsProfilePage() {
  const user = await getUserInfo();
  if (!user) redirect("/login");
  return <ProfileTabContent user={user} />;
}
