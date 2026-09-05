import { connection } from 'next/server'
import { SeedPanel } from '@/components/seed'

export default async function AdminSeedPage() {
  await connection()

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <SeedPanel />
    </main>
  )
}
