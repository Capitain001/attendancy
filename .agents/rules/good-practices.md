# Règles Générales Antigravity Workspace

## Registre des Bonnes Pratiques (`good-practices`)

À chaque tâche de code dans ce workspace :
1. **Avant de planifier / coder** : Lire systématiquement `docs/skills/good-practices/index.yaml` et appliquer les règles des domaines concernés (`rules/<domaine>.yaml`).
2. **Pendant le travail** : Respecter les règles bloquantes (`severity: blocking`) et justifier les écarts (`severity: advisory`).
3. **Avant de conclure la tâche** : Proposer obligatoirement au maximum 3 nouveaux candidats de bonnes pratiques (3 lignes : Règle, Preuve `chemin:lignes`, Signal `detect`) basés sur le code réel ou les retours d'OPERATOR.
4. **Après validation d'OPERATOR** : Persister les règles dans `docs/skills/good-practices/rules/<domaine>.yaml` et actualiser `index.yaml`.

