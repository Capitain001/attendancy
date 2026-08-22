"use client"

import { motion } from "framer-motion"
import type { Step } from "@/hooks/auth/useAuthStepper"

interface StepIndicatorProps {
  currentStep: number | Step
  totalSteps: number
  onStepClick: (step: number | Step) => void
  validateStep: (step: Step) => boolean
  className?: string
}

export function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
  validateStep,
  className = ""
}: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed"
    if (step === currentStep) return "current"
    return "upcoming"
  }

  const isStepClickable = (step: number) => {
    if (step < currentStep) return true // Peut revenir en arrière
    if (step === currentStep + 1) return validateStep(currentStep as Step) // Peut aller à l'étape suivante si l'étape actuelle est validée
    return false
  }

  const getStepClasses = (step: number) => {
    const status = getStepStatus(step)
    const isClickable = isStepClickable(step)
    
    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all duration-200"
    
    if (status === "completed") {
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 hover:scale-105`
    }
    
    if (status === "current") {
      return `${baseClasses} bg-blue-600 text-white`
    }
    
    if (isClickable) {
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700  hover:scale-105`
    }
    
    return `${baseClasses} bg-gray-200 text-gray-400 `
  }

  const getConnectorClasses = (step: number) => {
    const isCompleted = step < currentStep
    return `w-12 h-1 transition-colors duration-200 ${
      isCompleted ? "bg-blue-600" : "bg-gray-200"
    }`
  }

  return (
    <div className={`flex justify-center mb-8 ${className}`}>
      <div className="flex items-center ">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <button
              onClick={() => isStepClickable(step) && onStepClick(step)}
              disabled={!isStepClickable(step)}
              className={getStepClasses(step)}
            >
              {step}
            </button>
            {index < steps.length - 1 && (
              <div className={getConnectorClasses(step)} />
            )}
          </div>
        ))}
      </div>
  </div>
  )
}
