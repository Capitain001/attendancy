'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from '@/lib/toast/custom-toast'
import { updateOrgIdentityAction } from '@/services/organization/actions'
import { LOGO_BUCKET, getLogoPath, getLogoPublicUrl } from '@/lib/storage/logo'

export function useOrgIdentity(organizationId?: string) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function updateIdentity(input: { name?: string; email?: string }): Promise<boolean> {
    if (!input.name && !input.email) return false

    setIsPending(true)
    try {
      const result = await updateOrgIdentityAction(input as { name?: string; email?: string })
      if ('error' in result) {
        toast.error(result.error ?? 'Erreur lors de la mise a jour')
        return false
      }
      router.refresh()
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour')
      return false
    } finally {
      setIsPending(false)
    }
  }

  async function uploadLogo(file: File): Promise<boolean> {
    if (!file || !organizationId) return false

    setIsPending(true)
    try {
      const supabase = createClient()
      const filePath = getLogoPath(organizationId)

      const { error: uploadErr } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw uploadErr

      const logoUrl = getLogoPublicUrl(filePath)
      const result = await updateOrgIdentityAction({ logo: logoUrl })
      if ('error' in result) {
        toast.error(result.error ?? 'Erreur lors de la mise � jour')
        return false
      }

      router.refresh()
      toast.success('Logo mis à jour avec succès')
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de téléversement')
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { isPending, updateIdentity, uploadLogo }
}
