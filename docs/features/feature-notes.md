// ─── Notes personnelles ──────────────────────────────────────────────────────
// Note privée d'un utilisateur : existe sans rattachement (brouillon libre) et
// peut être liée ensuite à UNE ressource (resource + targetId, tous deux null
// ou tous deux renseignés — CHECK en post-migrate). Visible de son seul auteur.
// FK sur User (pas sur un profil) : la note est réutilisable par tous les
// rôles (teacher, student, direction…). Le scope org n'est plus garanti par
// le profil : il repose sur orgId + vérification applicative à l'écriture.
// ⚠️ Intégrité applicative : toute ÉCRITURE vérifie que (1) le user a une
// UserOrganization active dans orgId, (2) targetId appartient bien à orgId
// (pas de FK sur la ressource cible).
// deletedAt = corbeille (réversible).
model Note {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId     String    @db.Uuid
  userId    String    @db.Uuid
  title     String?
  content   String
  isPinned  Boolean   @default(false)

  // Lien optionnel : null/null = note libre
  resource  Resource?
  targetId  String?   @db.Uuid

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  // "Mes notes dans cette org", triées par dernière modification
  @@index([userId, orgId, deletedAt, updatedAt(sort: Desc)])
  // "Les notes liées à ce cours / cette séance / cet étudiant"
  @@index([resource, targetId])
  @@index([orgId])
  @@schema("public")
}