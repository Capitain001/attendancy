// apps/web/src/components/theme/active-theme.tsx
"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_THEME, THEME_NAMES } from "@/config/themes";

const COOKIE_NAME = "active_theme";
const VALID_THEMES = new Set(THEME_NAMES);

function isValidTheme(value: string | undefined | null): value is string {
  return !!value && VALID_THEMES.has(value);
}

function setThemeCookie(theme: string) {
  if (typeof window === "undefined") return;

  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${
    window.location.protocol === "https:" ? "Secure;" : ""
  }`;
}

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveThemeState] = useState<string>(DEFAULT_THEME);

  const setActiveTheme = (theme: string) => {
    setActiveThemeState(isValidTheme(theme) ? theme : DEFAULT_THEME);
  };

  // Récupère le thème depuis le cookie au montage
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    const cookieTheme = cookie?.split("=")[1];

    if (isValidTheme(cookieTheme) && cookieTheme !== activeTheme) {
      setActiveThemeState(cookieTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Applique la classe theme-{name} sur <body> et persiste le cookie
  useEffect(() => {
    setThemeCookie(activeTheme);

    Array.from(document.body.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => document.body.classList.remove(className));

    if (activeTheme !== DEFAULT_THEME) {
      document.body.classList.add(`theme-${activeTheme}`);
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {/* Évite le flash de thème par défaut avant l'hydratation React */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function() {
            try {
              var valid = ${JSON.stringify(THEME_NAMES)};
              var cookie = document.cookie
                .split('; ')
                .find(function (row) { return row.indexOf('${COOKIE_NAME}=') === 0; });
              if (cookie) {
                var theme = cookie.split('=')[1];
                if (valid.indexOf(theme) !== -1 && theme !== '${DEFAULT_THEME}') {
                  document.body.classList.add('theme-' + theme);
                }
              }
            } catch (e) {}
          })();
        `,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "useThemeConfig must be used within an ActiveThemeProvider",
    );
  }
  return context;
}