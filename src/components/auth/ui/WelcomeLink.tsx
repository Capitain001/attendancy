import { getUserInfo } from "@/services/user";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function WelcomeLink() {
  // Créer le client Supabase
  const user = await getUserInfo();

  // Vérifier si l'utilisateur existe
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p>Utilisateur non connecté.</p>
      </div>
    );
  }

  //
  const userRole = user?.role;
  const orgSlug = user?.organization?.slug;
  const orgName = user?.organization?.name;
  // const newTeacher = userMetadata?.status === "PENDING";

  // console.log("Meta" ,userMetadata)

  // Vérifier si l'utilisateur remplit les critères
  // const isEligible = userRole === "TEACHER" && newTeacher && orgSlug;
  const isEligible = userRole === "ADMIN" && orgSlug;
  // Générer le lien vers la page welcome avec orgSlug
  const welcomeUrl = `/${orgSlug}/admin`;

  return (
    <div className="flex items-center justify-center px-4">
      <Link
        href={welcomeUrl}
        className={`${
          isEligible
            ? "hover:bg-accent/80"
            : "cursor-not-allowed "
        } rounded-md px-6 py-2 transition-all`}
        aria-disabled={!isEligible}
      >
        {isEligible ? ` Commencez ` : "---"}
      </Link>
    </div>
  );
  0;
}
