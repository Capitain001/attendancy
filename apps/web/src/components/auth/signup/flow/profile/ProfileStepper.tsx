"use client"

import { motion, AnimatePresence } from "framer-motion"

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useProfileStepper } from "@/hooks/auth/useAuthStepper"
import { useProfileMutations } from "@/hooks/auth/useProfileMutations"
import { Step1 } from "./StepCards/Step1"
import { Step2 } from "./StepCards/Step2"
import { StepIndicator } from "./StepIndicator"

export default function   ProfileStepper() {
  const {
    currentStep,
    nextStep,
    prevStep,
    validateStep,
    formData,
    getProfileData
  } = useProfileStepper()

  const { submitProfile, profileMutation } = useProfileMutations()
  const router = useRouter()

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  const handleSubmit = async () => {
    try {
      const payload = getProfileData()
      await submitProfile(payload)
      toast.success("Profil complété avec succès!")
      router.push("/auth/redirect") // Redirection après succès
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du profil")
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      prevStep()
    } else if (step > currentStep && validateStep(currentStep)) {
      nextStep()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
       {/* Indicateur d'étapes */}
       <StepIndicator
         currentStep={currentStep}
         totalSteps={2}
         onStepClick={handleStepClick}
         validateStep={validateStep}
       />

      {/* Contenu des étapes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 ? (
            <Step1
              nom={formData.lastName}
              setNom={formData.setLastName}
              prenom={formData.firstName}
              setPrenom={formData.setFirstName}
              sex={formData.sex}
              setSex={(value: string) => formData.setSex(value as "MALE" | "FEMALE" | "")}
              onNext={nextStep}
              canNext={validateStep(1)}
            />
          ) : (
            <Step2
              dateOfBirth={formData.dateOfBirth}
              setDateOfBirth={formData.setDateOfBirth}
              phone={formData.phone}
              setPhone={formData.setPhone}
              onBack={prevStep}
              onSubmit={handleSubmit}
              canSubmit={validateStep(2)}
              isSubmitting={profileMutation.isPending}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}