// src/app/(attendancy)/[slug]/direction/classes/[classId]/layout.tsx
import { notFound } from "next/navigation";
import { getClassAction } from "@/services/class";
import { PromotionBanner } from "@/components/classes/direction/section/ui/PromotionBanner";

import { validateUUID } from "@/utils/server/validation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ classId: string; slug: string }>;
}

export default async function DirectionPromotionLayout({ children, params }: LayoutProps) {
  // Déstructuration de classId au lieu de id
  const { classId, slug } = await params;
  
  // Validation stricte de l'UUID (déclenche notFound() si invalide)
  const validClassId = validateUUID(classId);

  // Récupération des données de la promotion
  const { data: class_, error } = await getClassAction({classId: validClassId});

  // if (error || !class_) {
  //   notFound();
  // }

  return (
    <div className="flex flex-col min-h-screen gap-4">
      {/* La bannière reste fixe pendant la navigation interne */}
      <div className="">
        <PromotionBanner class_={class_} />
      </div>

      {/* Contenu dynamique des pages (Détails, Invitations, etc.) */}
      <div className="flex-1 ">
        {children}
      </div>
    </div>
  );
}