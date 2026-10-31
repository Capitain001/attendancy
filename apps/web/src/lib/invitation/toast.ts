// Livraison d'un lien d'invitation : partage natif, sinon repli presse-papiers.
import { toast } from 'sonner'
import { share } from '@/lib/invitation/share'

export async function shareInviteLink(link: string, text: string): Promise<void> {
  try {
    const outcome = await share.native(link, { title: 'Invitation', text })
    if (outcome === 'shared') {
      toast.success('Lien partagé')
      return
    }
    if (outcome === 'cancelled') {
      toast.message('Invitation créée, lien non partagé')
      return
    }
  } catch {
    // permission refusée / activation utilisateur expirée → presse-papiers
  }
  const { copied } = await share.clipboard(link)
  if (copied) toast.success("Lien d'invitation copié")
  else toast.message("Lien d'invitation", { description: link })
}