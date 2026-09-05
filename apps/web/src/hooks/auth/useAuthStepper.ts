"use client"

import { useState } from "react"

export type Step = 1 | 2

export type Sex = "MALE" | "FEMALE"

interface ProfileData {
  firstName: string
  lastName: string
  sex: Sex
  dateOfBirth: string
  phone: string
  avatar_url: string
}

export function useProfileStepper() {
  const [currentStep, setCurrentStep] = useState<Step>(1)

  // Champs du formulaire
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [sex, setSex] = useState<Sex | "">("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  // Navigation
  const nextStep = () => setCurrentStep(2)
  const prevStep = () => setCurrentStep(1)

  // Validation des étapes
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return firstName.trim().length > 0 && 
               lastName.trim().length > 0 && 
               sex !== ""
      case 2:
        if (!dateOfBirth.trim()) return false
        
        // Validation âge (13-120 ans)
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        const age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        const actualAge = monthDiff < 0 || 
          (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
            ? age - 1 
            : age
        
        return actualAge >= 13 && actualAge <= 120
      default:
        return false
    }
  }

  const getProfileData = (): ProfileData => ({
    firstName,
    lastName,
    sex: sex as Sex,
    dateOfBirth,
    phone,
    avatar_url: avatarUrl
  })

  return {
    // État courant
    currentStep,
    
    // Navigation
    nextStep,
    prevStep,
    
    // Validation
    validateStep,
    
    // Données formulaire
    formData: {
      firstName, setFirstName,
      lastName, setLastName,
      sex, setSex,
      dateOfBirth, setDateOfBirth,
      phone, setPhone,
      avatarUrl, setAvatarUrl
    },
    
    // Helpers
    getProfileData
  }
}
