cree l equivalent en v2 , si possible ajoute des filtre tel que classId , suis le skill service pr le format v2
path service:apps\web\src\services\student

prerequie:
-lire les models concerner dans le schema prisma 

-lire le skill: docs\skills\service-module-pattern\SKILL.md 

```typescript
/* =========================
   DIRECTION — ANNUAIRE ÉTUDIANTS (P-14/P-15)
   Liste administrative scopée org. Inclut les étudiants DÉSACTIVÉS
   (status !== ACTIVE) : la direction doit les voir. Le statut vient de
   `UserOrganization.status` (scope org), pas de `User.status`.
========================= */

export async function getDirectionStudents(orgId: string) {
  return unstable_cache(
    async () => {
      const rows = await prisma.student.findMany({
        where: {
          deletedAt: null,
          user: {
            deletedAt: null,
            userOrganizations: { some: { orgId, role: "STUDENT" } },
          },
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar_url: true,
              sex: true,
              dateOfBirth: true,
              userOrganizations: {
                where: { orgId, role: "STUDENT" },
                select: { status: true },
                take: 1,
              },
            },
          },
          _count: { select: { childrenRelations: { where: { deletedAt: null } } } },
          childrenRelations: {
            where: { deletedAt: null },
            select: {
              relation: true,
              parent: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      phone: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          studentEnrollments: {
            where: { deletedAt: null, class: { programTrack: { orgId } } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              class: {
                select: {
                  name: true,
                  level: true,
                  programTrack: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [
          { user: { lastName: "asc" } },
          { user: { firstName: "asc" } },
        ],
      });

      return rows.map((r) => {
        // .at(0) → typé `| undefined` (nullabilité honnête : un étudiant peut
        // n'avoir aucune inscription active → pas de classe/filière).
        const enrollment = r.studentEnrollments.at(0)?.class ?? null;
        return {
          studentId: r.id,
          userId: r.user.id,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          email: r.user.email,
          phone: r.user.phone,
          avatarUrl: r.user.avatar_url,
          sex: r.user.sex,
          dateOfBirth: r.user.dateOfBirth,
          status: r.user.userOrganizations[0]?.status ?? "ACTIVE",
          className: enrollment?.name ?? null,
          level: enrollment?.level ?? null,
          programTrackId: enrollment?.programTrack.id ?? null,
          programTrackName: enrollment?.programTrack.name ?? null,
          parentCount: r._count.childrenRelations,
          parents: r.childrenRelations.map((cr) => ({
            parentId: cr.parent.id,
            firstName: cr.parent.user.firstName,
            lastName: cr.parent.user.lastName,
            phone: cr.parent.user.phone,
            email: cr.parent.user.email,
            relation: cr.relation,
          })),
        };
      });
    },
    ["direction", "students", orgId],
    {
      revalidate: CACHE_DURATION.MEDIUM,
      tags: [CACHE.STUDENT(orgId)],
    },
  )();
}
```