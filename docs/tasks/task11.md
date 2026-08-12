# Program — Activation et verrouillage

## Objectif

Un `Program` représente une maquette pédagogique pouvant être appliquée à des classes.

Deux propriétés on ete ajouter sur le model Program pour permettre de contrôler ses modification :

```prisma
isActive Boolean @default(false)
isLocked Boolean @default(false)
```

### `isActive`

Détermine si le programme peut être **appliqué à une nouvelle classe**.

```text
isActive = false → le programme n'est plus suggerer et applicable a de nouvelle classe 
isActive = true  → le programme est applicable
```

L'activation ne concerne que l'utilisation du programme. Elle ne détermine pas si le programme peut être modifié.

### `isLocked`

Détermine si le programme peut être **modifié**.

```text
isLocked = false → le programme est modifiable
isLocked = true  → le programme est verrouillé
```

Un programme verrouillé ne doit pas pouvoir être modifié par un membre ordinaire.

---

## Protection du programme

Le verrouillage protège **l'ensemble du `Program`**, et pas uniquement sa liste d'UE.

Sont notamment protégés :

```text
Program
├── name
├── description
├── programTrackId
└── ProgramUE[]
```

Une fois le programme verrouillé, les modifications suivantes sont interdites :

```text
❌ modifier le nom
❌ modifier la description
❌ changer la filière
❌ ajouter une UE
❌ retirer une UE
❌ changer l'UE d'un ProgramUE
❌ changer semester
❌ changer isOptional
❌ changer order
```
---

## Autorisation exceptionnelle

Le verrouillage peut être contourné uniquement par l'utilisateur disposant de l'autorisation :

```ts
const auth = await authAccess({
  requiredRole: 'DIRECTION',
  requiredFunction: 'PRINCIPAL',
});
```

Cette autorisation doit être vérifiée **côté serveur** lors des opérations de modification.

L'interface utilisateur peut désactiver les actions pour un programme verrouillé, mais cette protection UI ne remplace pas le contrôle serveur.

---

### Modification du programme

un trigger db se chargera de la verification de Program.isLocked ou Program.isActive dans les operation crud (pas de complexiter inutile dans les services sauf si ca ne necesite pas une requette supplementaire)

de ton coter tu dois simplement desactiver l acces au modification pr un program Program.isLocked et ne pas permetre la suggestion d un Program.isActive = false dans l ui pour une nouvelle classe


## Résumé

NB: les contrainte critiques serons gerer en DB conforment au paterne du projet , concentre toi sur le flux applicatif

implication :
- ne pas permetre l edit mode pr un program locked 
-ecrire une fn pr debloquer ou bloquer le program qui verifie dasn sont action :
const auth = await authAccess({
  requiredRole: 'DIRECTION',
  requiredFunction: 'PRINCIPAL',
});
