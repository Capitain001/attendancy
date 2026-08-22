import AvatarUploader from "@/components/users/AvatarUploader"
import { StepCard } from "./StepCard"

import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/forms/FormInput"
import { FormSelect } from "@/components/forms/FormSelect"

interface Step1Props {
  nom: string
  setNom: (v: string) => void
  prenom: string
  setPrenom: (v: string) => void
  sex: string
  setSex: (v: string) => void
  onNext: () => void
  canNext: boolean
}

export function Step1({
  nom,
  setNom,
  prenom,
  setPrenom,
  sex,
  setSex,
  onNext,
  canNext,
}: Step1Props) {
  return (
    <StepCard title="Informations personnelles">
      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <AvatarUploader
            
          />
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Prénom *"
            id="prenom"
            placeholder="Jean"
            value={prenom}
            onChange={setPrenom}
          />
          
          <FormInput
            label="Nom *"
            id="nom"
            placeholder="Dupont"
            value={nom}
            onChange={setNom}
          />
        </div>

        <FormSelect
          label="Sexe *"
          id="sex"
          value={sex}
          onValueChange={setSex}
          options={[
            { value: "MALE", label: "Homme" },
            { value: "FEMALE", label: "Femme" },
          ]}
          placeholder="Sélectionnez votre sexe"
        />

        <Button 
          onClick={onNext} 
          className="w-full"
          disabled={!canNext}
        >
          Continuer
        </Button>
      </div>
    </StepCard>
  )
}