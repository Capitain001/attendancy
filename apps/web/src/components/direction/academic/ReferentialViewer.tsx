"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { GetReferentialWithProgramsDto } from '@/services/ue-template'
import { applyProgramsAction } from '@/services/ue-template/actions'
import { toast } from 'sonner'
import { Loader2, Book, GraduationCap, Briefcase, Target, Info } from 'lucide-react'

type Referential = NonNullable<GetReferentialWithProgramsDto>
type ProgramTemplate = Referential['programs'][0]

export function ReferentialViewer({ referential }: { referential: Referential }) {
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())
  const [isApplying, setIsApplying] = useState(false)

  // Grouper les programmes par domaine et mention
  const groupedPrograms = referential.programs.reduce<Record<string, Record<string, ProgramTemplate[]>>>((acc, program) => {
    if (!acc[program.domain]) acc[program.domain] = {}
    if (!acc[program.domain][program.mention]) acc[program.domain][program.mention] = []
    acc[program.domain][program.mention].push(program)
    return acc
  }, {})

  const handleSelectProgram = (programId: string, checked: boolean) => {
    const next = new Set(selectedPrograms)
    if (checked) next.add(programId)
    else next.delete(programId)
    setSelectedPrograms(next)
  }

  const handleSelectDomain = (domain: string, checked: boolean) => {
    const next = new Set(selectedPrograms)
    const domainPrograms = Object.values(groupedPrograms[domain]).flat()
    domainPrograms.forEach((p) => {
      if (checked) next.add(p.id)
      else next.delete(p.id)
    })
    setSelectedPrograms(next)
  }

  const isDomainFullySelected = (domain: string) => {
    const domainPrograms = Object.values(groupedPrograms[domain]).flat()
    return domainPrograms.length > 0 && domainPrograms.every((p) => selectedPrograms.has(p.id))
  }

  const isDomainPartiallySelected = (domain: string) => {
    const domainPrograms = Object.values(groupedPrograms[domain]).flat()
    const selectedCount = domainPrograms.filter((p) => selectedPrograms.has(p.id)).length
    return selectedCount > 0 && selectedCount < domainPrograms.length
  }

  const handleApply = async () => {
    if (selectedPrograms.size === 0) return

    setIsApplying(true)
    try {
      const res = await applyProgramsAction({ programTemplateIds: Array.from(selectedPrograms) })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Programmes et UE importés avec succès')
        // Optionnel : réinitialiser la sélection
        setSelectedPrograms(new Set())
      }
    } catch (e) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsApplying(false)
    }
  }

  const formatDegree = (degree: string) => {
    return degree.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
  }

  return (
    <div className="flex flex-col gap-y-8 pb-12 w-full">
      {/* Barre d'action sticky au style très rectangulaire/pro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-5 border-y border-border sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="font-semibold text-lg uppercase tracking-wider text-foreground">
            {selectedPrograms.size} programme(s) sélectionné(s)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez les programmes à importer dans le catalogue de votre établissement.
          </p>
        </div>
        <Button 
          onClick={handleApply} 
          disabled={selectedPrograms.size === 0 || isApplying}
          className="mt-4 sm:mt-0 rounded-none shadow-none"
          size="lg"
        >
          {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Importer la sélection
        </Button>
      </div>

      <Accordion type="multiple" className="w-full space-y-6">
        {Object.entries(groupedPrograms).map(([domain, mentions]) => (
          <AccordionItem key={domain} value={domain} className="border-x border-t border-b-0 border-border bg-card rounded-none overflow-hidden">
            {/* Header Domaine */}
            <div className="flex items-center gap-x-4 px-5 py-1 border-b bg-accent/20">
              <Checkbox
                checked={isDomainFullySelected(domain) ? true : isDomainPartiallySelected(domain) ? 'indeterminate' : false}
                onCheckedChange={(c) => handleSelectDomain(domain, c === true)}
                className="rounded-none h-5 w-5"
              />
              <AccordionTrigger className="hover:no-underline py-2 flex-1">
                <span className="font-bold text-lg tracking-wide">{domain}</span>
              </AccordionTrigger>
            </div>
            
            <AccordionContent className="pt-0 pb-0">
              <div className="flex flex-col divide-y divide-border">
                {Object.entries(mentions).map(([mention, programs]) => (
                  <div key={mention} className=" px-4 py-5 bg-background">
                    {/* Header Mention */}
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-x-2 text-base">
                      <GraduationCap className="w-5 h-5 text-muted-foreground" />
                      Mention : {mention}
                    </h3>
                    
                    {/* Grille des spécialités */}
                    <div className="grid grid-cols-1 gap-4 pl-2 sm:pl-7">
                      {programs.map((program) => {
                        const isSelected = selectedPrograms.has(program.id)
                        return (
                          <div
                            key={program.id}
                            className={`flex items-start gap-x-4 p-4 border transition-colors ${
                              isSelected 
                                ? 'bg-primary/5 border-l-4 border-l-primary/80 border-y-dashed  border-r-border' 
                                : 'bg-card border-l-4 border-l-transparent border-y-dashed border-y-border border-r-border hover:border-l-muted-foreground/30'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(c) => handleSelectProgram(program.id, c === true)}
                              className="mt-1 rounded-none h-5 w-5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-2">
                                <div className="font-semibold text-base text-foreground">
                                  {program.specialty || 'Tronc commun / Sans spécialité'}
                                </div>
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-accent text-accent-foreground whitespace-nowrap">
                                  {formatDegree(program.degree)}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-3">
                                  <div className="text-sm flex items-center gap-x-2 text-muted-foreground">
                                    <Book className="w-4 h-4 shrink-0" />
                                    <span>{program.programUEs.length} Unités d'Enseignement</span>
                                  </div>
                                  
                                  {program.profile && (
                                    <div className="text-sm flex items-start gap-x-2 text-muted-foreground">
                                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-medium text-foreground">Profil d'entrée :</span>
                                        <p className="mt-0.5 leading-snug">{program.profile}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {program.competencies && (
                                    <div className="text-sm flex items-start gap-x-2 text-muted-foreground">
                                      <Target className="w-4 h-4 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-medium text-foreground">Compétences visées :</span>
                                        <p className="mt-0.5 leading-snug line-clamp-2" title={program.competencies}>{program.competencies}</p>
                                      </div>
                                    </div>
                                  )}

                                  {program.outcomes && (
                                    <div className="text-sm flex items-start gap-x-2 text-muted-foreground">
                                      <Briefcase className="w-4 h-4 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-medium text-foreground">Débouchés :</span>
                                        <p className="mt-0.5 leading-snug line-clamp-2" title={program.outcomes}>{program.outcomes}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
