import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ThemeProvider } from '@/providers/theme-provider'
import { ErudaProvider } from '@/providers/eruda-provider'
import ReactQueryProvider from '@/providers/react-query-provider'
import { Suspense } from 'react'
import { AsyncHeader } from '@/components/layout/Header/AsyncHeader'
import HeaderSkeleton from '@/components/layout/Header/HeaderSkeleton'
import './globals.css'

export const metadata: Metadata = {
  title: 'Attendancy',
  description: 'Gestion des présences et du planning académique',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <NuqsAdapter>
              <div className="flex h-screen flex-col">
                <Suspense fallback={<HeaderSkeleton />}>
                  <AsyncHeader />
                </Suspense>
                <main className="flex-1 overflow-y-auto">
                  <Suspense fallback={null}>
                    {children}
                  </Suspense>
                </main>
              </div>
              <ErudaProvider />
              <Toaster position="top-right" expand duration={4000} />
            </NuqsAdapter>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
