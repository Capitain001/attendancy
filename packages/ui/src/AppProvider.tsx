//packages\ui\src\AppProvider.tsx
"use client"; // ignoré par Vite, nécessaire quand le web (Next) importe ce fichier

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./providers/theme-provider";
import { ActiveThemeProvider } from "./components/theme/ActiveTheme";
import { NoiseFilterDefs } from "./components/design/NoiseFilter";

// AppProvider.tsx  (partagé avec le web)
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ActiveThemeProvider>
        <NoiseFilterDefs baseFrequency={0.65} numOctaves={3} />
        {children}
        <Toaster position="top-right" expand duration={4000} />
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}
