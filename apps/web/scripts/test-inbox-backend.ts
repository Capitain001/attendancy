// scripts/test-inbox-backend.ts
/**
 * scripts/test-inbox-backend.ts
 *
 * Test d'intégration de bout en bout des Lots 1 et 2 (Backend Inbox & Invitations) :
 * 1. Création d'invitation avec notification interne (targetUserId, event CREATED).
 * 2. Consultation de l'inbox et comptage des non-lus (getInboxNotificationsForUser / getUnreadCountForUser).
 * 3. Marquage comme lu (markNotificationRead).
 * 4. Acceptation transactionnelle d'invitation + notification émetteur (event CONFIRMED).
 * 5. Refus d'invitation + notification émetteur (event REJECTED).
 * 6. Nettoyage des données de test.
 *
 * Usage :
 *   cd apps/web && tsx --env-file=.env scripts/test-inbox-backend.ts
 */

import { prisma } from '@/lib/prisma'
import { Action } from '@/generated/prisma/browser'
import { saveInvitationWithAudit } from '@/modules/invitation/database'
import {
  getInboxNotificationsForUser,
  getUnreadCountForUser,
} from '@/services/notification/database/notification.queries'
import {
  markNotificationRead,
  setInvitationNotificationStatus,
  createInvitationNotification,
} from '@/services/notification/database/notification.mutations'

import { generateInvitationMetadata } from '@/modules/invitation/metadata'
import { getOrgsIdentities } from '@/services/organization/server'
import type { UserInfo } from '@/types/user'
import { buildInvitationResponsePayload } from '@/services/notification/messages/invitation.messages'

const C = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
}

function logPass(msg: string) {
  console.log(`  ${C.green}✓${C.reset} ${msg}`)
}

function logFail(msg: string, err: unknown) {
  console.error(`  ${C.red}✗${C.reset} ${msg}`)
  console.error(err)
}

async function run() {
  console.log(`\n${C.bold}${C.cyan}=== TEST D'INTÉGRATION DES LOTS 1 & 2 (BACKEND INBOX) ===${C.reset}\n`)

  const testSuffix = Date.now().toString().slice(-6)
  const inviterEmail = `inviter_${testSuffix}@attendancy.test`
  const inviteeEmail = `invitee_${testSuffix}@attendancy.test`
  const orgSlug = `test-org-${testSuffix}`

  let orgId = ''
  let inviterId = ''
  let inviteeId = ''
  let invitationId1 = ''
  let invitationId2 = ''
  let notificationId1 = ''
  let notificationId2 = ''

  try {
    // ── 0. Préparation des données de test ─────────────────────────────────────
    console.log(`${C.yellow}0. Préparation des entités de test...${C.reset}`)

    const org = await prisma.organization.create({
      data: {
        name: `Org Test ${testSuffix}`,
        slug: orgSlug,
        details: {},
      },
    })
    orgId = org.id

    const inviter = await prisma.user.create({
      data: {
        email: inviterEmail,
        firstName: 'Émetteur',
        lastName: 'Test',
      },
    })
    inviterId = inviter.id

    const invitee = await prisma.user.create({
      data: {
        email: inviteeEmail,
        firstName: 'Invité',
        lastName: 'Test',
      },
    })
    inviteeId = invitee.id

    logPass(`Organisation créée: ${orgSlug} (${orgId})`)
    logPass(`Émetteur créé: ${inviterEmail} (${inviterId})`)
    logPass(`Invité créé: ${inviteeEmail} (${inviteeId})`)

    // ── 1. TEST LOT 1 : Émission d'invitation avec notification interne ───────
    console.log(`\n${C.yellow}1. Test Lot 1 : Flux réel de métadonnées (generateInvitationMetadata -> saveInvitationWithAudit)...${C.reset}`)

    const token1 = `token_1_${testSuffix}`
    const expiresAt1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Simulation de la session active réelle de l'émetteur
    const inviterUserInfo: UserInfo = {
      id: inviterId,
      email: inviterEmail,
      name: 'Émetteur Test',
      status: 'ACTIVE',
      organization: {
        id: orgId,
        name: org.name,
        slug: orgSlug,
        logo: 'https://example.com/logo.png',
      },
      organizations: [
        {
          id: orgId,
          name: org.name,
          slug: orgSlug,
          logo: 'https://example.com/logo.png',
        },
      ],
    }

    // Appel de la VRAIE fonction de production qui génère les métadonnées lors d'une invitation
    const productionMetadata1 = generateInvitationMetadata(
      {
        email: inviteeEmail,
        role: 'TEACHER',
      },
      inviterUserInfo,
      token1,
      'ACTIVE',
    )

    const saveResult1 = await saveInvitationWithAudit({
      email: inviteeEmail,
      token: token1,
      expiresAt: expiresAt1,
      inviterUserId: inviterId,
      action: Action.CREATE,
      metadata: productionMetadata1,
      targetUserId: inviteeId,
    })

    invitationId1 = saveResult1.invitation.id
    if (!saveResult1.invitation.userId) {
      throw new Error(`Invitation.userId attendu (${inviteeId}), reçu: ${saveResult1.invitation.userId}`)
    }
    logPass(`Invitation 1 créée avec userId lié (${invitationId1})`)

    // Vérifier la notification créée pour l'invité
    const notifCreated = await prisma.notification.findFirst({
      where: { userId: inviteeId, resourceType: 'INVITATION' },
    })
    if (!notifCreated) {
      throw new Error(`Aucune notification interne créée pour ${inviteeId}`)
    }
    notificationId1 = notifCreated.id

    // Vérification des colonnes et métadonnées côté notification
    if (notifCreated.orgId !== orgId) throw new Error(`orgId attendu '${orgId}', reçu: ${notifCreated.orgId}`)
    if (notifCreated.resourceType !== 'INVITATION') throw new Error(`resourceType attendu 'INVITATION', reçu: ${notifCreated.resourceType}`)
    if (notifCreated.resourceId !== invitationId1) throw new Error(`resourceId attendu '${invitationId1}', reçu: ${notifCreated.resourceId}`)
    if (notifCreated.event !== 'CREATED') throw new Error(`event attendu 'CREATED', reçu: ${notifCreated.event}`)
    logPass(`Notification colonnes validées (orgId, resourceType: INVITATION, resourceId: ${invitationId1}, event: CREATED)`)

    const notifMeta = notifCreated.metadata as Record<string, any>
    if (!notifMeta) throw new Error('metadata de notification manquante')
    if (notifMeta.action !== 'JOIN_ORG') throw new Error(`metadata.action attendu 'JOIN_ORG', reçu: ${notifMeta.action}`)
    if (notifMeta.role !== 'TEACHER') throw new Error(`metadata.role discordant`)
    if (notifMeta.sendBy?.id !== inviterId) throw new Error(`metadata.sendBy.id attendu '${inviterId}', reçu: ${notifMeta.sendBy?.id}`)
    if (notifMeta.sendBy?.name !== 'Émetteur Test') throw new Error(`metadata.sendBy.name discordant, reçu: ${notifMeta.sendBy?.name}`)
    if (notifMeta.target !== undefined && notifMeta.target !== null) throw new Error(`metadata.target devrait être absent pour JOIN_ORG`)
    if (notifMeta.status !== 'PENDING') throw new Error(`metadata.status discordant`)
    if (!notifMeta.expiresAt) throw new Error(`metadata.expiresAt manquant`)
    logPass(`Métadonnées (action, role, sendBy, expiresAt, status) présentes et correctes`)

    // ── 2. TEST LOT 2 : Consultation de la boîte de réception & enrichissement ───
    console.log(`\n${C.yellow}2. Test Lot 2 : getInboxNotificationsForUser & getOrgsIdentities...${C.reset}`)

    const inboxList = await getInboxNotificationsForUser(inviteeId, 'all', 10)
    if (inboxList.length !== 1 || inboxList[0]?.id !== notificationId1) {
      throw new Error(`Inbox attendue avec notification ${notificationId1}, reçus: ${inboxList.length} items`)
    }
    logPass(`getInboxNotificationsForUser retourne la notification (${inboxList.length} item)`)

    // Résolution de l'identité de l'organisation via orgId (le nom n'est plus dans la metadata)
    const orgIdentities = await getOrgsIdentities([orgId])
    if (orgIdentities.length === 0 || orgIdentities[0]?.slug !== orgSlug) {
      throw new Error(`getOrgsIdentities a échoué pour orgId ${orgId}`)
    }
    logPass(`getOrgsIdentities résout avec succès l'identité de l'organisation (${orgIdentities[0]?.name})`)

    const unreadCountBefore = await getUnreadCountForUser(inviteeId)
    if (unreadCountBefore !== 1) {
      throw new Error(`Unread count attendu 1, reçu: ${unreadCountBefore}`)
    }
    logPass(`getUnreadCountForUser retourne 1 notification non lue`)

    // ── 3. TEST LOT 2 : Marquage de la notification comme lue ─────────────────
    console.log(`\n${C.yellow}3. Test Lot 2 : markNotificationRead...${C.reset}`)

    const marked = await markNotificationRead({ notificationId: notificationId1, userId: inviteeId })
    if (marked.count !== 1) {
      throw new Error(`Notification devrait être marquée lue (count=1, reçu: ${marked.count})`)
    }
    const unreadCountAfter = await getUnreadCountForUser(inviteeId)
    if (unreadCountAfter !== 0) {
      throw new Error(`Unread count attendu 0 après lecture, reçu: ${unreadCountAfter}`)
    }
    logPass(`Notification marquée comme lue avec succès (unreadCount = 0)`)

    // ── 4. TEST LOT 2 : Acceptation de l'invitation (transactionnel) ──────────
    console.log(`\n${C.yellow}4. Test Lot 2 : Acceptation transactionnelle & Notification émetteur...${C.reset}`)

    await prisma.$transaction(async (tx) => {
      // Claim atomique
      const claimed = await tx.invitation.updateMany({
        where: { id: invitationId1, userId: inviteeId, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      })
      if (claimed.count !== 1) {
        throw new Error(`Échec du claim atomique sur l'invitation ${invitationId1}`)
      }

      // Création UserOrganization
      await tx.userOrganization.create({
        data: {
          userId: inviteeId,
          orgId,
          role: 'TEACHER',
          isMainOrg: true,
          isResponsable: false,
        },
      })

      // Mise à jour du statut dans la notification de l'invité
      await setInvitationNotificationStatus(tx, {
        userId: inviteeId,
        invitationId: invitationId1,
        status: 'ACCEPTED',
      })

      // Création de l'accusé pour l'émetteur
      await createInvitationNotification(tx, {
        userId: inviterId,
        payload: buildInvitationResponsePayload({
          event: 'CONFIRMED',
          invitationId: invitationId1,
          orgId,
          orgName: org.name,
          action: 'JOIN_ORG',
          sender: {
            id: inviteeId,
            name: 'Invité Test',
            email: inviteeEmail,
          },
        }),
      })
    })

    // Vérifications post-acceptation
    const checkInv1 = await prisma.invitation.findUnique({ where: { id: invitationId1 } })
    if (!checkInv1?.usedAt) {
      throw new Error(`Invitation 1 devrait avoir usedAt renseigné`)
    }
    logPass(`Invitation 1 réclamée avec usedAt (${checkInv1.usedAt.toISOString()})`)

    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: inviteeId, orgId },
    })
    if (!userOrg || userOrg.role !== 'TEACHER') {
      throw new Error(`UserOrganization attendue pour ${inviteeId} dans ${orgId}`)
    }
    logPass(`UserOrganization créée avec rôle TEACHER (isMainOrg=${userOrg.isMainOrg})`)

    const notifInvitee = await prisma.notification.findUnique({ where: { id: notificationId1 } })
    const metaInvitee = notifInvitee?.metadata as Record<string, any>
    if (metaInvitee?.status !== 'ACCEPTED') {
      throw new Error(`Notification invité attendue avec status=ACCEPTED, reçu: ${metaInvitee?.status}`)
    }
    logPass(`Notification invité mise à jour avec status=ACCEPTED`)

    const notifInviterAccepted = await prisma.notification.findFirst({
      where: { userId: inviterId, resourceType: 'INVITATION', event: 'CONFIRMED' },
    })
    if (!notifInviterAccepted) {
      throw new Error(`Notification émetteur attendue avec event=CONFIRMED`)
    }
    if (notifInviterAccepted.resourceId !== invitationId1) {
      throw new Error(`resourceId émetteur attendu '${invitationId1}', reçu: ${notifInviterAccepted.resourceId}`)
    }
    const metaInviter = notifInviterAccepted.metadata as Record<string, any>
    if (metaInviter?.action !== 'JOIN_ORG') {
      throw new Error(`metadata.action attendu 'JOIN_ORG', reçu: ${metaInviter?.action}`)
    }
    if (metaInviter?.sendBy?.id !== inviteeId) {
      throw new Error(`metadata.sendBy.id attendu '${inviteeId}', reçu: ${metaInviter?.sendBy?.id}`)
    }
    if (!notifInviterAccepted.message.includes('a accepté')) {
      throw new Error(`Message d'acceptation inattendu: ${notifInviterAccepted.message}`)
    }
    logPass(`Notification émetteur créée avec event=CONFIRMED (id=${notifInviterAccepted.id})`)

    // ── 5. TEST LOT 2 : Refus d'invitation (2ème invitation) ──────────────────
    console.log(`\n${C.yellow}5. Test Lot 2 : Refus d'invitation & Notification émetteur...${C.reset}`)

    const token2 = `token_2_${testSuffix}`
    const productionMetadata2 = generateInvitationMetadata(
      {
        email: inviteeEmail,
        role: 'STUDENT',
      },
      inviterUserInfo,
      token2,
      'ACTIVE',
    )

    const saveResult2 = await saveInvitationWithAudit({
      email: inviteeEmail,
      token: token2,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      inviterUserId: inviterId,
      action: Action.CREATE,
      metadata: productionMetadata2,
      targetUserId: inviteeId,
    })
    invitationId2 = saveResult2.invitation.id

    // Le lien notification <-> invitation passe désormais par la colonne resourceId
    const notif2 = await prisma.notification.findFirst({
      where: { userId: inviteeId, resourceType: 'INVITATION', resourceId: invitationId2 },
    })
    if (!notif2) throw new Error(`Notification 2 non trouvée`)
    notificationId2 = notif2.id

    // Exécution du refus
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitationId2, userId: inviteeId, usedAt: null, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date(), details: { status: 'DECLINED' } },
      })
      if (claimed.count !== 1) {
        throw new Error(`Échec du claim sur l'invitation 2`)
      }

      await setInvitationNotificationStatus(tx, {
        userId: inviteeId,
        invitationId: invitationId2,
        status: 'DECLINED',
      })

      await createInvitationNotification(tx, {
        userId: inviterId,
        payload: buildInvitationResponsePayload({
          event: 'REJECTED',
          invitationId: invitationId2,
          orgId,
          orgName: org.name,
          action: 'JOIN_ORG',
          sender: {
            id: inviteeId,
            name: 'Invité Test',
            email: inviteeEmail,
          },
        }),
      })
    })

    const notifInviteeDeclined = await prisma.notification.findUnique({ where: { id: notificationId2 } })
    const metaDeclined = notifInviteeDeclined?.metadata as Record<string, any>
    if (metaDeclined?.status !== 'DECLINED') {
      throw new Error(`Notification attendue avec status=DECLINED, reçu: ${metaDeclined?.status}`)
    }
    logPass(`Notification invité mise à jour avec status=DECLINED`)

    const notifInviterDeclined = await prisma.notification.findFirst({
      where: {
        userId: inviterId,
        resourceType: 'INVITATION',
        resourceId: invitationId2,
        event: 'REJECTED',
      },
    })
    if (!notifInviterDeclined) {
      throw new Error(`Notification émetteur event=REJECTED non trouvée`)
    }
    if (!notifInviterDeclined.message.includes('a décliné')) {
      throw new Error(`Message de refus inattendu: ${notifInviterDeclined.message}`)
    }
    logPass(`Notification émetteur créée avec event=REJECTED (id=${notifInviterDeclined.id})`)

    console.log(`\n${C.bold}${C.green}✓ TOUS LES TESTS DES LOTS 1 & 2 SONT PASSÉS AVEC SUCCÈS !${C.reset}\n`)
  } catch (error) {
    logFail('Une erreur est survenue pendant le test :', error)
    process.exitCode = 1
  } finally {
    // ── 6. Nettoyage des données de test ───────────────────────────────────────
    console.log(`${C.dim}Nettoyage des données de test...${C.reset}`)
    try {
      if (inviteeId) await prisma.notification.deleteMany({ where: { userId: inviteeId } })
      if (inviterId) await prisma.notification.deleteMany({ where: { userId: inviterId } })
      if (inviteeId && orgId) await prisma.userOrganization.deleteMany({ where: { userId: inviteeId, orgId } })
      if (invitationId1) await prisma.invitation.deleteMany({ where: { id: invitationId1 } })
      if (invitationId2) await prisma.invitation.deleteMany({ where: { id: invitationId2 } })
      if (inviteeId) await prisma.auditLog.deleteMany({ where: { userId: inviteeId } })
      if (inviterId) await prisma.auditLog.deleteMany({ where: { userId: inviterId } })
      if (inviteeId) await prisma.user.deleteMany({ where: { id: inviteeId } })
      if (inviterId) await prisma.user.deleteMany({ where: { id: inviterId } })
      if (orgId) await prisma.organization.deleteMany({ where: { id: orgId } })
      logPass('Données de test nettoyées proprement.')
    } catch (cleanErr) {
      console.warn('Avertissement pendant le nettoyage :', cleanErr)
    }

    await prisma.$disconnect()
  }
}

void run()