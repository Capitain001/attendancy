
// import { OrganizationProvider } from "@/providers/OrganizationProvider";
import { UserProvider } from "@/contexts/UserContext";
import { getUserInfo } from '@/modules/user';
import { redirect } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: LayoutProps) {
  const [{ slug }, user] = await Promise.all([params, getUserInfo()]);

  if (!user?.id) {
    redirect("/login");
  }

  // if (userInfo.slug !== slug) {
  //   redirect(`/${userInfo.slug}`);
  // }

  return (
    <div className="scrollbar-hidden h-full overflow-hidden">
       <UserProvider initialUser={user}>
          {children}
        </UserProvider>
    </div>
  );
}
