import { Stepper, StepperContent, StepperDescription, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperSeparator, StepperTitle, StepperTrigger } from '@/components/ui/stepper'
import { Role } from '@/types'
import { AnimatePresence } from 'framer-motion'
import { Check, LoaderCircleIcon } from 'lucide-react'
import React, { useState } from 'react'

// Types
export type Step = 1 | 2 | 3 | number
export type StepStatus = 'completed' | 'current' | 'loading' | 'pending'

export interface StepConfig {
  title: string
  description: string
  step: Step
  status?: StepStatus
}

export interface StepperProps {
  role: Role
  steps?: StepConfig[]
  initialStep?: Step
  onStepChange?: (step: Step) => void
  className?: string
  children: (currentStep: Step) => React.ReactNode
}

const defaultSteps = (role: Role): StepConfig[] => [
  { 
    title: 'Identité', 
    description: 'Renseignez vos informations personnelles',
    step: 1
  },
  { 
    title: 'Profil utilisateur', 
    description: 'Avatar et date de naissance',
    step: 2
  },
  { 
    title: role === 'ADMIN' ? 'Profil admin' : 'Profil utilisateur', 
    description: role === 'ADMIN' ? 'Complétez votre profil admin' : 'Complétez votre profil utilisateur',
    step: 3
  },
]

export default function CustomStepper({
  role,
  steps,
  initialStep = 1,
  onStepChange,
  className = "",
  children
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep)
  
  const stepConfig = steps || defaultSteps(role)

  const handleStepChange = (step: Step) => {
    setCurrentStep(step)
    onStepChange?.(step)
  }

  const getStepStatus = (step: Step): StepStatus => {
    if (step === currentStep) return 'current'
    if (step < currentStep) return 'completed'
    return 'pending'
  }

  return (
    <div className={`flex flex-col gap-5 p-10 w-full mx-auto max-w-[600px] h-full justify-center items-center ${className}`}>
      <Stepper
        value={currentStep}
        onValueChange={handleStepChange}
        indicators={{
          completed: <Check className="size-4" />,
          loading: <LoaderCircleIcon className="size-4 animate-spin" />,
        }}
        className="space-y-8 w-full"
      >
        <StepperNav>
          {stepConfig.map((step, index) => (
            <StepperItem 
              key={step.step} 
              step={step.step} 
              className="relative flex-1"
            >
              <StepperTrigger 
                className="flex justify-start gap-1.5 w-full"
                disabled={getStepStatus(step.step) === 'pending'}
              >
                <StepperIndicator className={getStepStatus(step.step) === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                >
                  {step.step}
                </StepperIndicator>
                <div className="flex flex-col items-start gap-0.5">
                  <StepperTitle>{step.title}</StepperTitle>
                  <StepperDescription>{step.description}</StepperDescription>
                </div>
              </StepperTrigger>

              {stepConfig.length > index + 1 && (
                <StepperSeparator className="md:mx-2.5" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <StepperPanel className="text-sm w-full">
          <StepperContent 
            value={currentStep} 
            className="flex items-center justify-center"
          >
            <div className="w-full max-w-md rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                {stepConfig.find(step => step.step === currentStep)?.title}
              </h2>
              
              <AnimatePresence mode="wait">
                {children(currentStep)}
              </AnimatePresence>
            </div>
          </StepperContent>
        </StepperPanel>
      </Stepper>
    </div>
  )
}
