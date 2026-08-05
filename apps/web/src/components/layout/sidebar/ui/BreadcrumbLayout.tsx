
"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Type sérialisable pour les routes (sans icônes ni composants React)
export type SerializableRoute = {
  title: string
  link: string
  subs?: SerializableRoute[]
}

interface BreadcrumbLayoutProps {
  routes: SerializableRoute[]
  homeLabel?: string
  homeHref?: string
}

// Libellé du dashboard racine par rôle (le home du fil d'Ariane).
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  direction: "Direction",
  teacher: "Enseignant",
  student: "Étudiant",
  parent: "Parent",
}

export function BreadcrumbLayout({
  routes,
  homeLabel,
  homeHref,
}: BreadcrumbLayoutProps) {
  const pathname = usePathname()

  // Home dérivé du pathname `/${slug}/${role}/...` quand l'appelant ne le fournit
  // pas — sinon tous les layouts héritaient à tort de « Admin » / /admin/dashboard.
  const [slug, role] = pathname.split("/").filter(Boolean)
  const resolvedHomeHref = homeHref ?? (slug && role ? `/${slug}/${role}` : "/")
  const resolvedHomeLabel =
    homeLabel ??
    (role ? ROLE_LABEL[role] ?? role.charAt(0).toUpperCase() + role.slice(1) : "Accueil")

  // Fonction pour trouver la route active et ses parents
  const getBreadcrumbItems = () => {
    const items: Array<{ title: string; href: string; isCurrent: boolean }> = []

    // Ajouter l'élément home
    items.push({
      title: resolvedHomeLabel,
      href: resolvedHomeHref,
      isCurrent: false
    })
    
    // Fonction récursive pour trouver la route active et construire le chemin
    const findRoutePath = (
      routeList: SerializableRoute[],
      path: string
    ): SerializableRoute[] | null => {
      for (const route of routeList) {
        // Vérifier si le pathname correspond exactement à la route
        if (path === route.link) {
          return [route]
        }
        
        // Vérifier si le pathname commence par cette route (route parente)
        if (path.startsWith(route.link + '/')) {
          // Chercher dans les sous-routes
          if (route.subs) {
            const subPath = findRoutePath(route.subs, path)
            if (subPath) {
              return [route, ...subPath]
            }
          }
          
          // Si aucune sous-route ne correspond mais qu'on est dans cette route
          // On retourne quand même la route parente
          return [route]
        }
      }
      return null
    }
    
    // Trouver le chemin de la route active
    const routePath = findRoutePath(routes, pathname)
    
    if (routePath && routePath.length > 0) {
      // Ajouter toutes les routes du chemin au breadcrumb
      routePath.forEach((route, index) => {
        items.push({
          title: route.title,
          href: route.link,
          isCurrent: index === routePath.length - 1
        })
      })
    } else {
      // Si aucune route ne correspond, utiliser le dernier segment du pathname
      const segments = pathname.split('/').filter(segment => segment)
      if (segments.length > 1) {
        const lastSegment = segments[segments.length - 1]
        items.push({
          title: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1),
          href: pathname,
          isCurrent: true
        })
      }
    }
    
    return items
  }
  
  const breadcrumbItems = getBreadcrumbItems()
  
  if (breadcrumbItems.length === 0) {
    return null
  }
  
  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          
          return (
            <div key={index} className="flex items-center">
              <BreadcrumbItem className={index > 0 ? "hidden md:block" : ""}>
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && (
                <BreadcrumbSeparator className={index > 0 ? "hidden md:block" : "ml-2"} />
              )}
            </div>
          )
        })}
      </BreadcrumbList>
      
    </Breadcrumb>
  )
}