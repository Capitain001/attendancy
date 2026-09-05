import { SidebarData } from "./types";
import { 
  Search, 
  Home, 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  Mail,
  Calendar,
  Star,
  Building,
  Code,
  Database,
  Cloud
} from "lucide-react";

export const mockSidebarData: SidebarData = {
  user: {
    name: "Alexandre Martin",
    email: "alex.martin@example.com",
    avatar: "/avatars/alexandre.jpg"
  },
  navMain: [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: Home,
      url: "/dashboard",
      isActive: true
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart3,
      url: "/analytics"
    },
    {
      id: "team",
      title: "Team",
      icon: Users,
      url: "/team"
    },
    {
      id: "projects",
      title: "Projects",
      icon: FileText,
      url: "/projects"
    },
    {
      id: "messages",
      title: "Messages",
      icon: Mail,
      url: "/messages"
    },
    {
      id: "calendar",
      title: "Calendar",
      icon: Calendar,
      url: "/calendar"
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      url: "/settings"
    }
  ],
  navCollapsible: {
    favorites: [
      {
        id: "project-alpha",
        title: "Project Alpha",
        href: "/projects/alpha",
        color: "bg-blue-500"
      },
      {
        id: "q3-report",
        title: "Q3 Report",
        href: "/reports/q3",
        color: "bg-green-500"
      },
      {
        id: "team-meeting",
        title: "Team Meeting Notes",
        href: "/documents/team-meeting",
        color: "bg-purple-500"
      },
      {
        id: "product-roadmap",
        title: "Product Roadmap",
        href: "/roadmap",
        color: "bg-orange-500"
      }
    ],
    teams: [
      {
        id: "engineering",
        title: "Engineering",
        icon: Code
      },
      {
        id: "product",
        title: "Product",
        icon: BarChart3
      },
      {
        id: "design",
        title: "Design",
        icon: Star
      },
      {
        id: "marketing",
        title: "Marketing",
        icon: Building
      }
    ],
    topics: [
      {
        id: "development",
        title: "Development",
        icon: Code
      },
      {
        id: "infrastructure",
        title: "Infrastructure",
        icon: Database
      },
      {
        id: "cloud",
        title: "Cloud Services",
        icon: Cloud
      },
      {
        id: "security",
        title: "Security",
        icon: Settings
      }
    ]
  }
};

// Alternative avec des données plus minimalistes si besoin
export const minimalSidebarData: SidebarData = {
  user: {
    name: "Jean Dupont",
    email: "jean.dupont@company.com",
    avatar: "/avatars/jean.jpg"
  },
  navMain: [
    {
      id: "home",
      title: "Accueil",
      icon: Home,
      url: "/",
      isActive: true
    },
    {
      id: "search",
      title: "Recherche",
      icon: Search,
      url: "/search"
    }
  ],
  navCollapsible: {
    favorites: [
      {
        id: "fav-1",
        title: "Document Important",
        href: "/documents/important",
        color: "bg-red-500"
      }
    ],
    teams: [
      {
        id: "main-team",
        title: "Équipe Principale",
        icon: Users
      }
    ],
    topics: [
      {
        id: "general",
        title: "Général",
        icon: FileText
      }
    ]
  }
};
