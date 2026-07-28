import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ThemeProvider } from '@/providers/theme-provider'
import { ErudaProvider } from '@/providers/eruda-provider'
import ReactQueryProvider from '@/providers/react-query-provider'
import Header from '@/components/layout/Header/Header'
import { getUserInfo } from '@/services/user/userInfo'
import './globals.css'

export const metadata: Metadata = {
  title: 'Attendancy',
  description: 'Gestion des présences et du planning académique',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUserInfo()

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <NuqsAdapter>
              <div className="flex h-screen flex-col">
                <Header user={user ?? undefined} />
                <main className="flex-1 overflow-y-auto">
                  {children}
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
