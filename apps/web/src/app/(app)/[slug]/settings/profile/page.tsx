// src/app/(app)/[slug]/settings/profile/page.tsx
import { getUserInfo } from "@/modules/user";
import { ProfileTabContent } from "@/components/users/settings/ProfileTabContent";

export default async function SettingsProfilePage() {
  const user = await getUserInfo();
  return <ProfileTabContent user={user ?? {}} />;
}
