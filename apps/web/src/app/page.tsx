import OrgLink from "@/components/auth/ui/OrgLink";
import { getUserInfo } from "@/modules/user";
import { Link } from "lucide-react";

export default async function HomePage() {
  const user = await getUserInfo();
  return (
    <main className="flex min-h-screen items-center justify-center">

      <h1 className="text-2xl font-semibold">attendancy</h1>


      {/* NB:cette section sert temporairement a rendre accessible le lien de l ettablissement dispo dans le header pr ceux qui test la maquette */}
      {/* cette page est volontairement minimaliste */}
      <div className="flex flex-col items-center justify-center">
        {user ?
          <span>
            <OrgLink user={user} />
          </span>
          : <Link href={"/login"}>
            connecter vous
          </Link>
        }

      </div>
    </main>
  )
}
