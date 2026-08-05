import { redirect } from "next/navigation";

import { getUserInfo } from "@/modules/user";
import NewUserPage from "@/components/auth/signup/flow/invited/NewUserPage";



export default async function WelcomePage() {
  // Vérifier l'utilisateur et l'invitation
  const user = await getUserInfo();

  if (!user) {
    return redirect("/login");
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
         <NewUserPage user={user} />
    </div>
  );
}
