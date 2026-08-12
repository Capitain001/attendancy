// src/services/class/database/class.queries.ts

import { cacheTag, cacheLife } from "next/cache";

import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";
import { Level, Prisma } from "@/generated/prisma/client";

/**
 * Liste des classes d'une organisation.
 * Peut être filtrée par année académique et filière.
 */
export async function getClasses({ orgId, yearId, programTrackId, name, level }: { orgId: string; yearId?: string; programTrackId?: string; name?: string; level?: Level }) {
  'use cache'
  cacheTag(CACHE.CLASS(orgId))
  cacheLife(CACHE.CLASS.life)

const where: Prisma.ClassWhereInput = {
  deletedAt: null,
  programTrack: { orgId },
  ...(yearId ? { academicYearId: yearId } : {}),
  ...(programTrackId ? { programTrackId } : {}),
  ...(name ? { name: { contains: name, mode: 'insensitive' } } : {}),
  ...(level ? { level: level  } : {}),
}

  return prisma.class.findMany({
    where,
    select: {
      id: true,
      name: true,
      level: true,
      academicYearId: true,
      programTrackId: true,
      academicYear: { select: { id: true, name: true } },
      programTrack: { select: { id: true, name: true } },
      _count: { select: { studentEnrollments: true, courses: true } },
    },
    orderBy: [{ programTrack: { name: 'asc' } }, { name: 'asc' }],
  })
}

/**
 * Détail d'une classe.
 */
export async function getClass({
  classId,
  orgId,
}: {
  classId: string;
  orgId: string;
}) {
  "use cache";

  cacheTag(CACHE.CLASS(orgId));
  cacheTag(CACHE.CLASS(orgId, classId));
  cacheLife(CACHE.CLASS.life);

  return prisma.class.findFirst({
    where: {
      id: classId,
      deletedAt: null,
      programTrack: { orgId },
    },

    select: {
      id: true,
      name: true,
      level: true,
      programId: true,

      groups: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,

          _count: {
            select: {
              studentGroups: true,
            },
          },
        },
      },

      createdAt: true,

      programTrack: {
        select: {
          id: true,
          name: true,
          departmentId: true,
        },
      },

      academicYear: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          isActive: true,
          isCurrent: true,
        },
      },

      _count: {
        select: {
          studentEnrollments: true,
          courses: true,
        },
      },
    },
  });
}