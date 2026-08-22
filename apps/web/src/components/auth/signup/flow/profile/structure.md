components/
├── layout/
│   └── flow/
│       ├── AuthStepper.tsx          // Composant principal
│       ├── StepCards/               // Dossier des cartes modulaires
│       │   ├── index.ts             // Export centralisé
│       │   ├── OrganizationStepCard.tsx
│       │   ├── ProfileStepCard.tsx
│       │   ├── RoleStepCard.tsx
│       │   └── TeacherStepCard.tsx  // Cartes spécifiques par rôle
│       └── hooks/
│           ├── useAuthStepper.ts
│           └── useStepValidation.ts