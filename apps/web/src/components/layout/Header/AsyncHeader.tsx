// src/components/layout/Header/AsyncHeader.tsx
import { getUserInfo } from '@/modules/user';
import Header from "./Header";

export async function AsyncHeader() {
  const user = await getUserInfo();
  return <Header user={user ?? undefined} />;
}
