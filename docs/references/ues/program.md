## Résumé final des modifications à apporter

### 1.3 Ajout des volumes horaires dans `settings`

**Aucune modification du schéma nécessaire !** Utiliser les champs existants :

```prisma
// referentiel.prisma
model UETemplateEC {
  // ... champs existants ...
  duration Int? @default(0)    // Total des heures
  settings Json?               // Détails { hours: { CM: 10, TD: 15, TP: 5 } }
}

// academique.prisma  
model UECourse {
  // ... champs existants ...
  duration Int @default(0)     // Total des heures
  settings Json?               //Détails  { hours: { CM: 10, TD: 15, TP: 5 } }
}
```


### 3.3 Helper TypeScript pour les heures

```typescript
// utils/hours.ts

export interface HoursDetails {
  CM?: number
  TD?: number
  TP?: number
  PROJET?: number
  STAGE?: number
  AUTRE?: number
}

export function getHoursFromSettings(settings: any): {
  details: HoursDetails
  total: number
  display: string
} {
  const hours = settings?.hours || {}
  const total = Object.values(hours).reduce((sum, val) => sum + (val || 0), 0)
  
  const parts = []
  if (hours.CM) parts.push(`CM: ${hours.CM}h`)
  if (hours.TD) parts.push(`TD: ${hours.TD}h`)
  if (hours.TP) parts.push(`TP: ${hours.TP}h`)
  if (hours.PROJET) parts.push(`Projet: ${hours.PROJET}h`)
  if (hours.STAGE) parts.push(`Stage: ${hours.STAGE}h`)
  
  return {
    details: hours,
    total,
    display: parts.join(' | ') || 'Non défini'
  }
}
```

---

## 4. Récapitulatif des modifications

| Élément | Où le modifier | Action | Priorité |
|---------|---------------|--------|----------|
| **Type d'UE** | `UE.type` | Ajouter champ + enum | 🔴 Élevée |
| **Niveau** | `ProgramTemplate.level` | Ajouter champ | 🔴 Élevée |
| **Volumes horaires** | `UETemplateEC.settings` + `UECourse.settings` | Utiliser `settings` existant | 🟡 Moyenne |
| **Durée totale** | `UETemplateEC.duration` + `UECourse.duration` | Ajouter champ | 🟡 Moyenne |
| **Libellé semestre** | `ProgramUETemplate.semesterLabel` + `ProgramUE.semesterLabel` | Ajouter champ | 🟢 Faible |

---


## 6. Exemple de programme complet avec toutes les données

```typescript
// Programme Licence 3 Informatique - Architecture des Logiciels
const programData = {
  domain: 'ST',
  mention: 'Informatique',
  specialty: 'Architecture des Logiciels',
  degree: 'LICENCE_FONDAMENTALE',
  level: 'L3',
  profile: 'BAC2 toutes séries scientifiques',
  competencies: 'Maîtrise des architectures logicielles',
  outcomes: 'Architecte logiciel, Développeur senior',
  ues: [
    {
      code: 'INF1520',
      name: 'Bases de données Avancées',
      type: 'FONDAMENTALE',
      credits: 6,
      duration: 30,
      semester: 5,
      settings: {
        hours: { CM: 10, TD: 15, TP: 5 },
        prerequisites: ['Bases de données']
      },
      elements: [
        {
          code: '1INF1520',
          name: 'Bases de données Orientée Objet et NoSQL',
          credits: 3,
          duration: 15,
          order: 1,
          settings: {
            hours: { CM: 5, TD: 7, TP: 3 }
          }
        },
        {
          code: '2INF1520',
          name: 'Architecture des bases de données distribuées',
          credits: 3,
          duration: 15,
          order: 2,
          settings: {
            hours: { CM: 5, TD: 8, TP: 2 }
          }
        }
      ]
    }
    // ... autres UEs
  ]
}
``` 


