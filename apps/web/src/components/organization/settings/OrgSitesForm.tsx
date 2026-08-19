'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, MapPin, Building, Phone, Mail } from 'lucide-react'

import { setOrgDetailsAction } from '@/services/organization/actions'
import type { OrgDetails, OrgContactSite } from '@/services/organization/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

interface OrgSitesFormProps {
  initialDetails: OrgDetails | null
}

export function OrgSitesForm({ initialDetails }: OrgSitesFormProps) {
  const [isPending, startTransition] = React.useTransition()
  
  // Initialize with existing sites or an empty array
  const [sites, setSites] = React.useState<OrgContactSite[]>(
    initialDetails?.contact ?? []
  )

  const handleAddSite = () => {
    setSites([...sites, { ville: '', 'adresse-postale': '', emails: [], phones: [] }])
  }

  const handleRemoveSite = (index: number) => {
    const newSites = [...sites]
    newSites.splice(index, 1)
    setSites(newSites)
  }

  const handleChange = <K extends keyof OrgContactSite>(index: number, field: K, value: OrgContactSite[K]) => {
    const newSites = [...sites]
    newSites[index] = { ...newSites[index], [field]: value }
    setSites(newSites)
  }

  const handleSave = () => {
    // Basic validation: ville is required
    if (sites.some(s => !s.ville.trim())) {
      toast.error("Veuillez renseigner la ville pour tous les sites.")
      return
    }

    startTransition(async () => {
      const newDetails = { ...initialDetails, contact: sites }
      const result = await setOrgDetailsAction(newDetails)
      
      if ('error' in result) {
        toast.error("Erreur", { description: result.error })
      } else {
        toast.success("Sites mis à jour avec succès")
      }
    })
  }

  return (
    <div className={cn(card.base, 'flex flex-col gap-6')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={typography.h4}>Sites & Adresses</h2>
          <p className={typography.small}>
            Gérez les différents sites géographiques de votre organisation.
          </p>
        </div>
        <Button onClick={handleAddSite} variant="outline" size="sm">
          <Plus className="mr-2 size-4" />
          Ajouter un site
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <MapPin className="mb-2 size-8 text-text-muted" />
            <span className={typography.body}>Aucun site configuré</span>
            <span className={typography.small}>Ajoutez un premier site pour votre organisation.</span>
          </div>
        ) : (
          sites.map((site, index) => (
            <div key={index} className="flex flex-col gap-4  border-b border-dashed  bg-card p-4 pb-8 relative">
              <div className="absolute right-4 top-4">
                 <Button variant="ghost" size="icon" onClick={() => handleRemoveSite(index)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                   <Trash2 className="size-4" />
                 </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pr-10">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Building className="size-3" /> Ville</Label>
                  <Input 
                    placeholder="Paris, Lyon..." 
                    value={site.ville} 
                    onChange={(e) => handleChange(index, 'ville', e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MapPin className="size-3" /> Adresse postale</Label>
                  <Input 
                    placeholder="123 rue de la République" 
                    value={site['adresse-postale'] ?? ''} 
                    onChange={(e) => handleChange(index, 'adresse-postale', e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="size-3" /> Email (séparés par des virgules)</Label>
                  <Input 
                    placeholder="contact@site.com" 
                    value={site.emails?.join(', ') ?? ''} 
                    onChange={(e) => {
                      const val = e.target.value
                      handleChange(index, 'emails', val ? val.split(',').map(s => s.trim()) : [])
                    }} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="size-3" /> Téléphone (séparés par des virgules)</Label>
                  <Input 
                    placeholder="+33 1 23 45 67 89" 
                    value={site.phones?.join(', ') ?? ''} 
                    onChange={(e) => {
                      const val = e.target.value
                      handleChange(index, 'phones', val ? val.split(',').map(s => s.trim()) : [])
                    }} 
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Enregistrement...' : 'Enregistrer les sites'}
        </Button>
      </div>
    </div>
  )
}
