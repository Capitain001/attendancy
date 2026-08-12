// src/app/(attendancy)/[slug]/direction/classes/[classId]/layout.tsx
import { notFound } from "next/navigation";
import { getClassAction } from "@/services/class";
import { ClassBanner } from "@/components/classes/direction/section/ui/ClassBanner";




interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ classId: string; slug: string }>; 
}

export default async function DirectionClassLayout({ children, params }: LayoutProps) {
  
  // Déstructuration de classId au lieu de id
  const { classId, slug } = await params; 
  
  // Récupération des données de la classe
  const { data: class_, error } = await getClassAction(classId);

  // if (error || !class_) {
  //   notFound();
  // }

  return (
    <div className="flex flex-col min-h-screen gap-4">
      {/* La bannière reste fixe pendant la navigation interne */}
      <div className="">
          <ClassBanner class_={class_} />
      </div>
      
      {/* Contenu dynamique des pages (Détails, Invitations, etc.) */}
      <div className="flex-1 ">
        {children}
      </div>
    </div>
  );
}