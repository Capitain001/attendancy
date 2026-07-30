import { getUserInfo } from "@/services/user/userInfo";
import Header from "./Header";

export async function AsyncHeader() {
  const user = await getUserInfo();
  return <Header user={user ?? undefined} />;
}
