import { cacheTag, cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";

export async function getCourseEvaluations(courseId: string, orgId: string) {
  "use cache";
  cacheTag(CACHE.EVALUATION(orgId));
  cacheTag(CACHE.EVALUATION(orgId, courseId));
  cacheLife(CACHE.EVALUATION.life);

  return prisma.evaluation.findMany({
    where: { courseId, orgId },
    orderBy: { datedAt: "desc" },
    select: {
      id: true,
      courseId: true,
      type: true,
      title: true,
      coefficient: true,
      maxScore: true,
      datedAt: true,
      createdAt: true,
      _count: {
        select: { grades: true },
      },
      grades: {
        select: {
          id: true,
          status: true,
          score: true,
        },
      },
    },
  });
}

export async function getEvaluationDetail(evaluationId: string, orgId: string) {
  "use cache";
  cacheTag(CACHE.EVALUATION(orgId));
  cacheTag(CACHE.EVALUATION(orgId, evaluationId));
  cacheLife(CACHE.EVALUATION.life);

  return prisma.evaluation.findFirst({
    where: { id: evaluationId, orgId },
    select: {
      id: true,
      courseId: true,
      type: true,
      title: true,
      coefficient: true,
      maxScore: true,
      datedAt: true,
      course: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              id: true,
              name: true,
              studentEnrollments: {
                select: {
                  id: true,
                  student: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          avatar_url: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      grades: {
        select: {
          id: true,
          enrollmentId: true,
          status: true,
          score: true,
          comment: true,
          enrollment: {
            select: {
              id: true,
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar_url: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getEvaluation(evaluationId: string, orgId: string) {
  "use cache";
  cacheTag(CACHE.EVALUATION(orgId));
  cacheTag(CACHE.EVALUATION(orgId, evaluationId));
  cacheLife(CACHE.EVALUATION.life);

  return prisma.evaluation.findFirst({
    where: { id: evaluationId, orgId },
    select: {
      id: true,
      courseId: true,
      type: true,
      title: true,
      coefficient: true,
      maxScore: true,
      datedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
