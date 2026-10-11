apps\web\src\components\design\NoiseFilter.tsx
apps\web\src\providers\theme-provider.tsx
apps\web\src\components\theme


OBJECTIF deplacer 

@/providers/theme-provider
@/components/theme/ActiveTheme
@/components/design/NoiseFilter

dans packages/ui et complète AppProvider (packages\ui\src\AppProvider.tsx) :

resultat :

// AppProvider.tsx  (partagé avec le web)
export function AppProvider({ children }: { children: React.ReactNode }) {
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