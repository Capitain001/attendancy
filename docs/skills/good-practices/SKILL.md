---
name: good-practices
description: Registre évolutif des bonnes pratiques du projet — à charger avant de planifier ou de valider toute tâche de code.
---

# Registre de Bonnes Pratiques (`docs/skills/good-practices/`)

Ce skill maintient un registre de règles d'ingénierie validées au fil des sessions, indexé par domaine dans [`index.yaml`](./index.yaml) et détaillé dans `rules/<domaine>.yaml`.

---

## 1. Comment utiliser ce registre

### A. Avant de planifier une tâche
1. Lire [`index.yaml`](./index.yaml).
2. Ouvrir **uniquement** les fichiers `rules/<domaine>.yaml` dont le champ `applies_to` correspond à la tâche courante (`server-action`, `mutation-hook`, `query-hook`, `orchestrator-service`, `rsc-page`, `ui-component`, `prisma-query`, `schema`, `cache`, `securite`, `types`, `test`, `git`…).
3. Inscrire en tête du plan :
   ```text
   Règles applicables : <ID-001, ID-002…> (ou "Aucune" si le registre ne couvre pas encore le cas)
   ```

### B. Avant de conclure une tâche
1. Passer les motifs `detect` des règles applicables sur son propre diff.
2. Corriger systématiquement tout écart `severity: blocking`.
3. Justifier par écrit tout écart `severity: advisory`.
4. Si le registre est vide ou ne couvre pas le cas rencontré, continuer normalement et proposer au maximum 3 nouveaux candidats en fin de réponse.

---

## 2. Comment repérer et soumettre un candidat

- **Source** : s'appuyer exclusivement sur du code réellement lu durant la session (citer `chemin:lignes`) ou sur une correction explicite de l'utilisateur (`OPERATOR`). Ne rien inventer et ne pas faire de passe d'exploration dédiée.
- **Portée** : ne proposer que des règles réutilisables sur d'autres tâches (jamais une règle spécifique à une seule fonctionnalité).
- **Format de soumission (en fin de réponse, max 3 candidats, 3 lignes chacun)** :
  1. **Règle** : `<énoncé concis en une phrase>`
  2. **Preuve** : `<chemin:lignes>`
  3. **Signal (`detect`)** : `<motif cherchable dans un diff>`
- **Validation** : attendre la réponse de `OPERATOR` (`valide`, `corrige` ou `rejette`) avant toute écriture dans `index.yaml` ou `rules/<domaine>.yaml`. Un candidat rejeté ne doit plus être reproposé.

---

## 3. Comment persister une règle validée

- **Emplacement** : `docs/skills/good-practices/rules/<domaine>.yaml` (créé uniquement au premier candidat validé du domaine).
- **Domaine** : nom court (`erreurs`, `cache`, `hooks`, `services`, `rsc`, `ui`, `types`, `prisma`, `securite`, `git`, `tests`…). Réutiliser un domaine existant avant d'en créer un nouveau.
- **Format de `rules/<domaine>.yaml`** :

```yaml
domain: <domaine>
rules:
  - id: <DOMAINE>-001        # incrémenter dans le domaine, ne jamais réutiliser un id
    severity: blocking | advisory
    applies_to: [<type de tâche : server-action, mutation-hook, query-hook, rsc-page, orchestrator-service, ui-component, prisma-query, schema, test, git…>]
    rule: "<une phrase>"
    why: "<la raison ou l'incident>"
    detect: ["<motif cherchable dans un diff>"]
    evidence: "<chemin:lignes>"
    bad: |      # optionnel
    good: |     # optionnel
```

- **Mise à jour de [`index.yaml`](./index.yaml)** : maintenir une entrée par domaine `{ id, file, applies_to, summary }`.
- **Anti-duplication & conflits** :
  - Vérifier qu'aucune règle existante ne couvre déjà le cas (proposer de modifier la règle existante plutôt qu'en créer une seconde).
  - Si une règle validée contredit une règle existante, le signaler à `OPERATOR` sans trancher soi-même.

