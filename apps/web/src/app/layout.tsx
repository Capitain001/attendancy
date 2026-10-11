// src/app/layout.tsx
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppProvider } from "@attendancy/ui";
import { ErudaProvider } from "@/providers/eruda-provider";
import ReactQueryProvider from "@/providers/react-query-provider";
import { Suspense } from "react";
import { AsyncHeader } from "@/components/layout/Header/AsyncHeader";
import { HeaderSkeleton } from "@/components/layout/Header/HeaderSkeleton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendancy",
  description: "Gestion des présences et du planning académique",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AppProvider>
          <ReactQueryProvider>
            <NuqsAdapter>
              <div className="flex h-screen flex-col">
                <Suspense fallback={<HeaderSkeleton />}>
                  <AsyncHeader />
                </Suspense>
                <main className="flex flex-1 flex-col overflow-y-auto">
                  <Suspense fallback={null}>{children}</Suspense>
                </main>
              </div>
              <ErudaProvider />
            </NuqsAdapter>
          </ReactQueryProvider>
        </AppProvider>
      </body>
    </html>
  );
}
