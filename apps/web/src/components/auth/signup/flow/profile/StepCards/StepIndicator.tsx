// src/components/auth/signup/flow/profile/StepCards/StepIndicator.tsx
import React from 'react'

import { StepperIndicator } from '@/components/ui/stepper'

export default function StepIndicators({step}: {step: number}) {
  return (
    <StepperIndicator>{step}</StepperIndicator>
  )
}
