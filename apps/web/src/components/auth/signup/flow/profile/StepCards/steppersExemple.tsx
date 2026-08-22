// Exemple d'utilisation

import { useState } from 'react'
import CustomStepper, { Step } from './steppers'

export default function InscriptionPage() {
  const [formData, setFormData] = useState({})

  const handleStepChange = (step: Step) => {
    console.log(`Passage à l'étape ${step}`)
  }

  const renderStepContent = (currentStep: Step) => {
    switch(currentStep) {
      case 1:
        return <div />
      case 2:
        return <div />
      case 3:
        return <div />
      default:
        return null
    }
  }

  return (
    <CustomStepper 
      role="ADMIN"
      initialStep={1}
      onStepChange={handleStepChange}
      className="ma-classe-personnalisee"
    >
      {renderStepContent}
    </CustomStepper>
  )
}