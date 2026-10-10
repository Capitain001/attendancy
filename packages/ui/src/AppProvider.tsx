"use client"; // ignoré par Vite, nécessaire quand le web (Next) importe ce fichier

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster position="top-right" expand duration={4000} />
    </ThemeProvider>
  );
}
