import OrgLink from "@/components/auth/ui/OrgLink";
import { getUserInfo } from "@/modules/user";
import { Github } from "@mynaui/icons-react";
import Link from "next/link";
\
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

        <span>
          <a href={"https://github.com/Capitain001/attendancy"} target="_blank" className="p-2 border rounded-lg bg-muted/80 ">
            <Github size={24} />
          </a>
        </span>

      </div>
    </main>
  )
}
