Analyse des fichiers pour comprendre la structure et proposer une solution pour inviter les membres de la direction académique :


[11 tools called]


Analyse des fichiers pour comprendre la structure et proposer une solution :


[5 tools called]


Proposition de structure pour le service d'invitation de la direction académique :

## Proposition de structure

### 1. **Fichiers à créer**

```
src/services/invitation/direction/
├── index.ts          # Export principal (point d'entrée)
├── invite.ts         # Fonction principale d'invitation
├── types.ts          # Types spécifiques à la direction
├── validation.ts     # Validation des données (valibot)
└── database.ts       # Requêtes DB spécifiques (optionnel)
```

### 2. **Fonctionnalités principales**

#### **`invite.ts`** — Fonction d'invitation
- Utilise `inviteUser` comme base
- Rôle fixe : `"DIRECTION"`
- Validation de la fonction (doit exister dans l'organisation)
- Support de plusieurs fonctions (tableau)
- Gestion des permissions associées aux fonctions

#### **`types.ts`** — Types TypeScript
```typescript
export type InviteDirectionParams = {
  email: string;
  name?: string;
  functions: string[]; // IDs ou noms de fonctions
  permissions?: string[];
}
```

#### **`validation.ts`** — Validation avec Valibot
- Validation de l'email
- Validation que les fonctions existent
- Validation que l'utilisateur a le droit d'inviter

### 3. **Différences avec `teacher/invite.ts`**

| Aspect | Teacher | Direction |
|--------|---------|-----------|
| Rôle | `"TEACHER"` | `"DIRECTION"` |
| Fonction | Optionnelle (string) | Obligatoire (string[]) |
| Entité DB | `Teacher` | `Direction` |
| Resources | courses, classes | N/A |
| Validation fonction | Optionnelle | Obligatoire |

### 4. **Flux d'invitation**

1. Validation des paramètres (email, fonctions)
2. Vérification que les fonctions existent dans l'organisation
3. Vérification des permissions de l'inviteur
4. Génération du token et métadonnées
5. Envoi via Supabase (avec `function` dans metadata)
6. Sauvegarde en DB (Invitation + AuditLog)
7. À l'acceptation : création de `Direction` + assignation des fonctions via `UserFunction`

### 5. **Exemple d'utilisation**

```typescript
await inviteDirection({
  email: "directeur@example.com",
  name: "Jean Dupont",
  functions: ["PRINCIPAL", "SECRETARY"], // Noms de fonctions
  permissions: ["READ:STUDENT", "UPDATE:STUDENT"]
});
```

### 6. **Points d'attention**

- Validation des fonctions : vérifier qu'elles existent dans l'organisation
- Support de plusieurs fonctions : un membre de la direction peut avoir plusieurs fonctions
- Permissions : héritées des fonctions ou personnalisées
- Rôle dans UserOrganization : `"DIRECTION"` 

