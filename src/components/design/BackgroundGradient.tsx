"use client";

import React from "react";
import { useTheme } from "next-themes";

export default function BackgroundGradient() {
  const { theme } = useTheme();

  // Si le thème est sombre, on ne rend rien
  if (theme === "dark") return null;

  return (
    <div
      className="absolute right-0 top-12 pointer-events-none h-[300px] w-[300px] rounded-full bg-gradient-to-br from-pink-400 via-orange-100 to-gray-50 opacity-30 blur-3xl"
      aria-hidden="true"
    ></div>
  );
}
