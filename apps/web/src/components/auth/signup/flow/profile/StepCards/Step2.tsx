

import { Button } from "@/components/ui/button"
import { LoaderCircleIcon } from 'lucide-react'
import { StepCard } from "./StepCard"
import { FormInput } from "@/components/forms/FormInput"

interface Step2Props {
  dateOfBirth: string
  setDateOfBirth: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  onBack: () => void
  onSubmit: () => void
  canSubmit: boolean
  isSubmitting: boolean
}

export function Step2({
  dateOfBirth,
  setDateOfBirth,
  phone,
  setPhone,
  onBack,
  onSubmit,
  canSubmit,
  isSubmitting,
}: Step2Props) {
  // Calcul de l'âge pour l'affichage
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age
  }

  const age = calculateAge(dateOfBirth)
  const isAgeValid = age !== null && age >= 13 && age <= 120

  return (
    <StepCard title="Informations complémentaires">
      <div className="space-y-6">
        <div>
          <FormInput    
            label="Date de naissance *"
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />
          {dateOfBirth && (
            <div className="mt-2">
              {isAgeValid ? (
                <p className="text-sm text-green-600">
                  Âge: {age} ans ✓
                </p>
              ) : (
                <p className="text-sm text-red-600">
                  Âge: {age} ans - Vous devez avoir entre 13 et 120 ans
                </p>
              )}
            </div>
          )}
        </div>
{/* (optionnel) */}
        <FormInput
          label="Téléphone"
          id="phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={setPhone}
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Retour
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={!canSubmit || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Finaliser mon profil'
            )}
          </Button>
        </div>
      </div>
    </StepCard>
  )
}
