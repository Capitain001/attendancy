import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'

export async function applyProgramTemplate(orgId: string, programTemplateId: string) {
  // 1. Fetch template with details
  const template = await prisma.programTemplate.findUniqueOrThrow({
    where: { id: programTemplateId },
    include: {
      programUEs: {
        include: {
          ueTemplate: {
            include: { elements: true },
          },
        },
      },
    },
  })

  // 2. Créer/mettre à jour les entités de base (hors transaction)
  let department = await prisma.department.findUnique({
    where: { name_orgId: { name: template.domain, orgId } },
  })
  if (!department) {
    department = await prisma.department.create({
      data: { name: template.domain, orgId },
    })
  }

  let track = await prisma.programTrack.findUnique({
    where: { name_departmentId: { name: template.mention, departmentId: department.id } },
  })
  if (!track) {
    track = await prisma.programTrack.create({
      data: { name: template.mention, departmentId: department.id, orgId },
    })
  }

  let program = await prisma.program.findUnique({
    where: { name_programTrackId: { name: template.specialty, programTrackId: track.id } },
  })
  if (!program) {
    program = await prisma.program.create({
      data: {
        name: template.specialty,
        programTrackId: track.id,
        orgId,
        description: template.profile,
         isLocked: true,// rules: tout program issue d un template est verouller : seul l user autoriser peut le deverouiller
      },
    })
  }

  // 3. Traiter les UEs une par une (hors transaction ou avec des transactions plus petites)
  for (const pUETemplate of template.programUEs) {
    const ueT = pUETemplate.ueTemplate

    // Utiliser une transaction plus petite pour chaque UE
    await prisma.$transaction(
      async (tx) => {
        // Find or create OrgUETemplate
        let orgUE = await tx.orgUETemplate.findUnique({
          where: { templateId_orgId: { templateId: ueT.id, orgId } },
        })

        let ueId = orgUE?.ueId

        if (!orgUE) {
          // Attempt to find existing UE by code if code is present
          let ue = ueT.code
            ? await tx.uE.findUnique({
                where: { code_orgId: { code: ueT.code, orgId } },
              })
            : null

          if (!ue) {
            ue = await tx.uE.create({
              data: {
                name: ueT.name,
                code: ueT.code,
                description: ueT.description,
                orgId,
                departmentId: department.id,
              },
            })
          }
          ueId = ue.id

          await tx.orgUETemplate.create({
            data: { templateId: ueT.id, orgId, ueId },
          })

          // Create ECs if they don't exist
          for (const ec of ueT.elements) {
            const ueCourse = await tx.uECourse.findUnique({
              where: { ueId_order: { ueId: ueId, order: ec.order } },
            })
            if (!ueCourse) {
              await tx.uECourse.create({
                data: {
                  name: ec.name,
                  code: ec.code,
                  description: ec.description,
                  credits: ec.credits,
                  order: ec.order,
                  ueId: ueId,
                  orgId,
                },
              })
            }
          }
        }

        // Link UE to Program
        const programUE = await tx.programUE.findUnique({
          where: { programId_ueId: { programId: program.id, ueId: ueId! } },
        })

        if (!programUE) {
          await tx.programUE.create({
            data: {
              programId: program.id,
              ueId: ueId!,
              semester: pUETemplate.semester,
              order: pUETemplate.order,
            },
          })
        }
      },
      {
        timeout: 10000, // 10 secondes par UE
      }
    )
  }

  // 4. Upsert trace table (dernière opération)
  const result = await prisma.orgProgramTemplate.upsert({
    where: { orgId_programTemplateId: { orgId, programTemplateId } },
    update: { departmentId: department.id, trackId: track.id, programId: program.id },
    create: {
      orgId,
      programTemplateId,
      departmentId: department.id,
      trackId: track.id,
      programId: program.id,
    },
  })

  invalidateEvent('PROGRAM_TEMPLATE_APPLIED', orgId)
  return result
}