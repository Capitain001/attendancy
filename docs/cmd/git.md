# Git — Commandes du projet

## Convention de commits

Format : `type(scope): message`

### Types

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Réécriture sans changement de comportement |
| `chore` | Maintenance, config, outillage |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |
| `perf` | Optimisation de performance |

### Exemples du projet

```bash
feat(course): extrait service course-teacher + port page détail cours V2
refactor(courses): enseignants via hooks/data + types UI dérivés + garde UUID
fix(auth): corriger pattern authAccess dans actions planning
chore(claude): post-compaction hook + context-essentials
docs(visions): vision produit complète — rôles, parcours, navigation
```

---

## Branches

```bash
# Voir branche courante
git branch

# Créer et basculer
git checkout -b feat/nom-feature

# Basculer
git checkout main
git switch main
```

---

## Staging & commit

```bash
# Voir état
git status

# Stager des fichiers précis (préféré — évite les .env)
git add src/services/planning/actions.ts src/components/planning/

# Stager tout le suivi (jamais pour le premier commit d'un fichier sensible)
git add -u

# Commit
git commit -m "feat(planning): ajouter CoursePlanningDialog"

# Vérifier ce qui va être committé
git diff --staged
```

---

## Synchronisation

```bash
# Récupérer sans merger
git fetch origin

# Pull avec rebase (évite les merge commits)
git pull --rebase origin main

# Push
git push origin feat/nom-feature

# Push premier envoi
git push -u origin feat/nom-feature
```

---

## Inspection

```bash
# Historique condensé
git log --oneline -10

# Historique avec graph
git log --oneline --graph --decorate -15

# Diff non stagé
git diff

# Diff stagé
git diff --staged

# Voir un commit
git show decb56e
```

---

## Stash

```bash
# Mettre de côté le travail en cours
git stash

# Lister les stashs
git stash list

# Récupérer le dernier stash
git stash pop

# Récupérer un stash précis
git stash pop stash@{1}
```

---

## Corrections

```bash
# Modifier le dernier message de commit (avant push)
git commit --amend -m "nouveau message"

# Annuler le dernier commit en gardant les modifications
git reset HEAD~1

# Voir qui a modifié une ligne
git blame src/services/planning/actions.ts
```

---

## Monorepo — commandes depuis la racine

```bash
# Status global
git status

# Diff d'un package
git diff packages/planning/

# Diff d'une app
git diff apps/web/src/services/
```

---

## Règles du projet

- Ne jamais committer `.env` ou `.env.local`
- Préférer `git add <fichiers>` plutôt que `git add .`
- Un commit = une unité logique de travail
- Le scope du commit correspond au service ou composant modifié : `feat(session)`, `fix(schedule)`, `refactor(planning)`
- Ne pas utiliser `--force` sur `main` / `--no-verify`
