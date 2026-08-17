
import { validateUUID } from '@/utils/server/validation'
import { div } from 'motion/react-client';

interface PageProps {
  params: Promise<{ ueId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { ueId, slug } = await params
  // UUID invalide → notFound() immédiat, avant toute requête DB du détail cours.
  validateUUID(ueId)
  return (
    <div className='p-3'>
      DetailUE
    </div>
  )
}
