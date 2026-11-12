Le blocage vient du `?:` qui remplace tout le formulaire, sélecteur de classe compris. On le supprime : le formulaire reste affiché, et seuls les champs sans données sont désactivés, avec un petit texte d'aide à la place du message bloquant.

**1. Dérivé à ajouter (près de `hasCourses` / `hasRooms`)**

```tsx
const canSubmit = hasCourses && hasRooms;
```

**2. Corps : retirer la branche bloquante**

```tsx
// AVANT
{!hasCourses || !hasRooms ? (
  <div>…message…</div>
) : !scheduleEditable ? (
  <dl>…</dl>
) : (
  <div className="space-y-5">…</div>
)}

// APRÈS
{!scheduleEditable ? (
  <dl>…</dl>
) : (
  <div className="space-y-5">…</div>
)}
```

**3. Champ Cours : désactivé s'il n'y a pas de cours**

```tsx
<Field label="Cours">
  <Select
    value={form.courseId}
    onValueChange={handleCourseChange}
    disabled={!hasCourses}
  >
    <SelectTrigger className="w-full">
      <SelectValue
        placeholder={hasCourses ? "Sélectionner un cours" : "Aucun cours dans cette classe"}
      />
    </SelectTrigger>
    <SelectContent>
      {resources.courses.map((c) => (
        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  {!hasCourses && (
    <p className="text-xs text-muted-foreground">
      Créez d'abord un cours dans cette classe, ou changez de classe.
    </p>
  )}
</Field>
```

**4. Champ Salle : visible aussi quand il n'y en a aucune**

La condition passe de `rooms.length > 1` à `rooms.length !== 1` (avec une seule salle, le champ reste masqué comme avant).

```tsx
{resources.rooms.length !== 1 && (
  <Field label="Salle">
    <Select
      value={form.roomId}
      onValueChange={(v) => setForm((p) => ({ ...p, roomId: v }))}
      disabled={!hasRooms}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={hasRooms ? "Choisir une salle" : "Aucune salle disponible"} />
      </SelectTrigger>
      <SelectContent>
        {/* inchangé */}
      </SelectContent>
    </Select>
  </Field>
)}
```

**5. Actions : le bouton « Fermer » ne couvre plus ce cas, et la validation s'appuie sur `canSubmit`**

```tsx
{!scheduleEditable ? (
  <Button variant="outline" onClick={onBack} className="w-full">Fermer</Button>
) : isCreation ? (
  <Button onClick={handleSubmit} disabled={isBusy || !form.courseId || !canSubmit} className="w-full">
```

Même chose pour le bouton « Enregistrer les modifications » : `disabled={isBusy || !form.courseId || !canSubmit}`.

Le sélecteur de classe n'est plus jamais masqué, donc on peut changer de classe depuis une classe vide. Si la nouvelle classe a des cours, les champs se réactivent d'eux-mêmes, car `resources` change.

Si le hook remet `form.courseId` à vide au changement de classe, rien à faire. Sinon, vérifie qu'un `courseId` de l'ancienne classe ne reste pas sélectionné, sinon `!form.courseId` ne bloquerait plus le bouton (`canSubmit` couvre quand même le cas « aucun cours »).