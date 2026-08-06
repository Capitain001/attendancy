// prisma/seed/referential-togo-2022.ts
// Référentiel national Togo — Curricula harmonisés MESRS, Avril 2022.
// Idempotent : skip les UE déjà insérées (check code+referentialId pour les codées,
//              nom+semestre+mention+spécialité pour les LIBRE).
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UETemplateType } from '../../src/generated/prisma/client'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL environment variable')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// ─── Types ────────────────────────────────────────────────────────────────────

type ECData = { code: string; name?: string; credits: number }

type UEData = {
  code: string | null
  name: string
  type: UETemplateType
  credits: number
  semester: number
  elements: ECData[]
}

type MentionData = {
  domain: string
  degree: string
  mention: string
  speciality: string | null
  ues: UEData[]
}

// ─── Données ──────────────────────────────────────────────────────────────────

const TOGO_2022: MentionData[] = [

  // ──────────────────────────────────────────────────────
  // LLA — Traduction, Anglais-Français-Anglais
  // ──────────────────────────────────────────────────────
  {
    domain: 'LLA', degree: 'LICENCE',
    mention: 'Traduction', speciality: 'Anglais-Français-Anglais',
    ues: [
      // Semestre 1
      { code: 'ANG 1160', name: 'Grammaire anglaise', type: 'FONDAMENTALE', credits: 3, semester: 1, elements: [{ code: '1ANG1160', credits: 1.5 }, { code: '2ANG1160', credits: 1.5 }] },
      { code: 'LNG 1160', name: 'Introduction à la linguistique anglaise', type: 'FONDAMENTALE', credits: 3, semester: 1, elements: [{ code: '1LNG1160', credits: 1.5 }, { code: '2LNG1160', credits: 1.5 }] },
      { code: 'DRP 1330', name: 'Droit civil: introduction', type: 'TRANSVERSALE', credits: 2, semester: 1, elements: [{ code: '1DRP1330', credits: 1 }, { code: '2DRP1330', credits: 1 }] },
      { code: 'ANG 1161', name: 'Civilisation anglophone', type: 'COMPLEMENTAIRE', credits: 4, semester: 1, elements: [{ code: '1ANG1161', credits: 1 }, { code: '2ANG1161', credits: 1 }, { code: '3ANG1161', credits: 2 }] },
      { code: 'ANG 1162', name: 'Laboratoire 1', type: 'FONDAMENTALE', credits: 3, semester: 1, elements: [{ code: '1ANG1162', credits: 1.5 }, { code: '2ANG1162', credits: 1.5 }] },
      { code: 'FRA 1160', name: 'Littérature et culture francophones', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [{ code: '1FRA1160', credits: 2 }, { code: '2FRA1160', credits: 2 }] },
      { code: 'TRA 1160', name: 'Stylistique comparée (français-anglais)', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [{ code: '1TRA1160', credits: 2 }, { code: '2TRA1160', credits: 2 }] },
      // Semestre 2
      { code: 'TRA 1260', name: 'Techniques de résumé de texte', type: 'COMPLEMENTAIRE', credits: 3, semester: 2, elements: [{ code: '1TRA1260', credits: 1.5 }, { code: '2TRA1260', credits: 1.5 }] },
      { code: 'LNG 1260', name: 'Phonétique articulatoire', type: 'FONDAMENTALE', credits: 3, semester: 2, elements: [{ code: '1LNG1260', credits: 1.5 }, { code: '2LNG1260', credits: 1.5 }] },
      { code: 'FRA 1260', name: 'Grammaire de base en français', type: 'FONDAMENTALE', credits: 3, semester: 2, elements: [{ code: '1FRA1260', credits: 1.5 }, { code: '2FRA1260', credits: 1.5 }] },
      { code: 'LNG 1261', name: 'Phonétique-Phonologie', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [{ code: '1LNG1261', credits: 2 }, { code: '2LNG1261', credits: 2 }] },
      { code: 'ANG 1263', name: 'Laboratoire 2', type: 'FONDAMENTALE', credits: 3, semester: 2, elements: [{ code: '1ANG1263', credits: 1.5 }, { code: '2ANG1263', credits: 1.5 }] },
      { code: 'TRA 1261', name: 'Mécanismes et difficultés de la Traduction', type: 'FONDAMENTALE', credits: 3, semester: 2, elements: [{ code: '1TRA1261', credits: 1.5 }, { code: '2TRA1261', credits: 1.5 }] },
      { code: 'ANG 1261', name: 'Littérature et culture anglophones', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1ANG1261', credits: 1 }, { code: '2ANG1261', credits: 1 }, { code: '3ANG1261', credits: 2 }] },
      { code: 'TRA 1262', name: 'Traduction et interdisciplinarité', type: 'APPROFONDISSEMENT', credits: 5, semester: 2, elements: [{ code: '1TRA1262', credits: 2.5 }, { code: '2TRA1262', credits: 2.5 }] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 2, elements: [] },
      // Semestre 3
      { code: 'ANG 1360', name: 'Morphologie syntaxe', type: 'FONDAMENTALE', credits: 4, semester: 3, elements: [{ code: '1ANG1360', credits: 2 }, { code: '2ANG1360', credits: 2 }] },
      { code: 'TRA 1360', name: 'Culture anglophone et interprétation', type: 'APPROFONDISSEMENT', credits: 5, semester: 3, elements: [{ code: '1TRA1360', credits: 2.5 }, { code: '2TRA1360', credits: 2.5 }] },
      { code: 'TRA 1361', name: 'Les faux amis sémantiques anglais-français', type: 'APPROFONDISSEMENT', credits: 5, semester: 3, elements: [{ code: '1TRA1361', credits: 2.5 }, { code: '2TRA1361', credits: 2.5 }] },
      { code: 'TRA 1362', name: 'Les faux amis morphologique français-anglais', type: 'APPROFONDISSEMENT', credits: 5, semester: 3, elements: [{ code: '1TRA1362', credits: 2.5 }, { code: '2TRA1362', credits: 2.5 }] },
      { code: 'ANG 1361', name: 'Laboratoire 3', type: 'APPROFONDISSEMENT', credits: 3, semester: 3, elements: [{ code: '1ANG1361', credits: 1.5 }, { code: '2ANG1361', credits: 1.5 }] },
      { code: 'DRV 1330', name: 'Droit international: introduction', type: 'TRANSVERSALE', credits: 2, semester: 3, elements: [{ code: '1DRV1330', credits: 1 }, { code: '2DRV1330', credits: 1 }] },
      { code: 'MGT 1340', name: 'Gestion des Ressources Humaines', type: 'COMPLEMENTAIRE', credits: 4, semester: 3, elements: [{ code: '1MGT1340', credits: 2 }, { code: '2MGT1340', credits: 2 }] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 3, elements: [] },
      // Semestre 4
      { code: 'TRA 1460', name: 'Anglais économique, commercial et financier', type: 'APPROFONDISSEMENT', credits: 5, semester: 4, elements: [{ code: '1TRA1460', credits: 2.5 }, { code: '2TRA1460', credits: 2.5 }] },
      { code: 'TRA 1461', name: 'Théories contemporaines et méthodes de traduction', type: 'APPROFONDISSEMENT', credits: 5, semester: 4, elements: [{ code: '1TRA1461', credits: 2.5 }, { code: '2TRA1461', credits: 2.5 }] },
      { code: 'SOC 1450', name: 'Traduction comme science humaine', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [{ code: '1SOC1450', credits: 1.5 }, { code: '2SOC1450', credits: 1.5 }] },
      { code: 'TRA 1462', name: 'Equipement de traduction', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [{ code: '1TRA1462', credits: 1.5 }, { code: '2TRA1462', credits: 1.5 }] },
      { code: 'TRA 1463', name: "Champs sémantiques: Agriculture, Hôtellerie, Tourisme", type: 'APPROFONDISSEMENT', credits: 4, semester: 4, elements: [{ code: '1TRA1463', credits: 2 }, { code: '2TRA1463', credits: 2 }] },
      { code: 'ANG 1460', name: 'Laboratoire 4', type: 'APPROFONDISSEMENT', credits: 2, semester: 4, elements: [{ code: '1ANG1460', credits: 1 }, { code: '2ANG1460', credits: 1 }] },
      { code: 'MGT 1440', name: 'Entrepreneuriat', type: 'TRANSVERSALE', credits: 3, semester: 4, elements: [{ code: '1MGT1440', credits: 1.5 }, { code: '2MGT1440', credits: 1.5 }] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 4, elements: [] },
      // Semestre 5
      { code: 'ANG 1560', name: 'Techniques de rédaction académique', type: 'TRANSVERSALE', credits: 3, semester: 5, elements: [{ code: '1ANG1560', credits: 1.5 }, { code: '2ANG1560', credits: 1.5 }] },
      { code: 'TRA 1560', name: 'Champs sémantiques: Informatique, Transport et Logistique', type: 'SPECIALITE', credits: 4, semester: 5, elements: [{ code: '1TRA1560', credits: 2 }, { code: '2TRA1560', credits: 2 }] },
      { code: 'TRA 1561', name: 'Techniques de prise de notes', type: 'COMPLEMENTAIRE', credits: 3, semester: 5, elements: [{ code: '1TRA1561', credits: 1.5 }, { code: '2TRA1561', credits: 1.5 }] },
      { code: 'TRA 1562', name: 'Abréviations internationales', type: 'SPECIALITE', credits: 4, semester: 5, elements: [{ code: '1TRA1562', credits: 2 }, { code: '2TRA1562', credits: 2 }] },
      { code: 'ANG 1561', name: 'Laboratoire 5', type: 'SPECIALITE', credits: 2, semester: 5, elements: [{ code: '1ANG1561', credits: 1 }, { code: '2ANG1561', credits: 1 }] },
      { code: 'DRP 1530', name: 'Droit de travail', type: 'TRANSVERSALE', credits: 2, semester: 5, elements: [{ code: '1DRP1530', credits: 1 }, { code: '2DRP1530', credits: 1 }] },
      { code: 'TRA 1563', name: 'Champs sémantiques: droit, économie et société', type: 'SPECIALITE', credits: 4, semester: 5, elements: [{ code: '1TRA1563', credits: 2 }, { code: '2TRA1563', credits: 2 }] },
      { code: 'TRA 1564', name: 'Logiciels de traduction', type: 'SPECIALITE', credits: 3, semester: 5, elements: [{ code: '1TRA1564', credits: 1.5 }, { code: '2TRA1564', credits: 1.5 }] },
      { code: 'TRA 1565', name: 'Stage professionnel et rapport', type: 'SPECIALITE', credits: 5, semester: 5, elements: [{ code: '1TRA1565', credits: 2.5 }, { code: '2TRA1565', credits: 2.5 }] },
      // Semestre 6
      { code: 'DRP 1630', name: 'Code du travail togolais', type: 'TRANSVERSALE', credits: 2, semester: 6, elements: [{ code: '1DRP1630', credits: 1 }, { code: '2DRP1630', credits: 1 }] },
      { code: 'TRA 1660', name: 'Présentation du projet professionnel', type: 'SPECIALITE', credits: 3, semester: 6, elements: [{ code: '1TRA1660', credits: 1.5 }, { code: '2TRA1660', credits: 1.5 }] },
      { code: 'TRA 1661', name: 'Rédaction du mémoire', type: 'SPECIALITE', credits: 10, semester: 6, elements: [{ code: '1TRA1661', credits: 5 }, { code: '2TRA1661', credits: 5 }] },
      { code: 'TRA 1662', name: 'Soutenance', type: 'SPECIALITE', credits: 15, semester: 6, elements: [{ code: '1TRA1662', credits: 7.5 }, { code: '2TRA1662', credits: 7.5 }] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // SHS — Philosophie (sans spécialité)
  // ──────────────────────────────────────────────────────
  {
    domain: 'SHS', degree: 'LICENCE',
    mention: 'Philosophie', speciality: null,
    ues: [
      // Semestre 1
      { code: 'PHI 1150', name: 'Histoire de la philosophie: Les présocratiques', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [] },
      { code: 'PHI 1151', name: 'Histoire de la philosophie: Socrate et les socratiques', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [] },
      { code: 'PHI 1152', name: 'Introduction à la philosophie', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [] },
      { code: 'PHI 1153', name: 'Introduction à la philosophie morale', type: 'APPROFONDISSEMENT', credits: 3, semester: 1, elements: [] },
      { code: 'PHI 1154', name: 'Méthodologie philosophique: Dissertation', type: 'FONDAMENTALE', credits: 2, semester: 1, elements: [] },
      { code: 'MTU 1100', name: "Formation au travail universitaire et à l'informatique", type: 'TRANSVERSALE', credits: 2, semester: 1, elements: [] },
      { code: 'FRA 1100', name: 'Français: Lire et écrire', type: 'TRANSVERSALE', credits: 2, semester: 1, elements: [] },
      { code: 'ANG 1100', name: 'Anglais: lire et écrire', type: 'TRANSVERSALE', credits: 2, semester: 1, elements: [] },
      { code: 'ANT 1100', name: "Introduction à l'anthropologie sociale et culturelle", type: 'COMPLEMENTAIRE', credits: 3, semester: 1, elements: [] },
      { code: 'PHI 1155', name: 'Introduction à la philosophie africaine', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [] },
      // Semestre 2
      { code: 'PHI 1250', name: 'Stoïcisme, épicurisme et scepticisme', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'PHI 1251', name: 'Néoplatonisme et antiquité tardive', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'PHI 1252', name: 'Logique classique', type: 'FONDAMENTALE', credits: 3, semester: 2, elements: [] },
      { code: 'PHI 1253', name: "Introduction à la philosophie de l'éducation", type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'EDU 1200', name: "Introduction aux sciences de l'éducation", type: 'COMPLEMENTAIRE', credits: 3, semester: 2, elements: [] },
      { code: 'PHI 1254', name: 'Introduction à la métaphysique', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'PHI 1255', name: 'Introduction à la philosophie politique', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'SOC 1200', name: 'Introduction à la sociologie', type: 'COMPLEMENTAIRE', credits: 2, semester: 2, elements: [] },
      { code: 'PSY 1200', name: 'Introduction à la psychologie', type: 'COMPLEMENTAIRE', credits: 2, semester: 2, elements: [] },
      // Semestre 3
      { code: 'PHI 1350', name: 'Histoire de la Philosophie occidentale médiévale', type: 'FONDAMENTALE', credits: 3, semester: 3, elements: [] },
      { code: 'PHI 1351', name: 'Introduction à la philosophie du langage', type: 'FONDAMENTALE', credits: 3, semester: 3, elements: [] },
      { code: 'PHI 1352', name: 'Logique mathématique', type: 'FONDAMENTALE', credits: 3, semester: 3, elements: [] },
      { code: 'PHI 1353', name: 'Doctrines éthiques modernes', type: 'APPROFONDISSEMENT', credits: 3, semester: 3, elements: [] },
      { code: 'PHI 1354', name: 'Philosophie politique moderne', type: 'APPROFONDISSEMENT', credits: 3, semester: 3, elements: [] },
      { code: 'PHI 1355', name: 'Philosophie sociale', type: 'APPROFONDISSEMENT', credits: 2, semester: 3, elements: [] },
      { code: 'PHI 1356', name: 'Méthodologie philosophique: commentaire', type: 'FONDAMENTALE', credits: 3, semester: 3, elements: [] },
      { code: 'SOC 1300', name: 'Introduction aux méthodes des sciences sociales', type: 'COMPLEMENTAIRE', credits: 2, semester: 3, elements: [] },
      { code: 'PHI 1357', name: 'Anthropologie philosophique', type: 'FONDAMENTALE', credits: 2, semester: 3, elements: [] },
      { code: 'PHI 1358', name: "Philosophie de l'art", type: 'APPROFONDISSEMENT', credits: 2, semester: 3, elements: [] },
      { code: null, name: 'Ecrits professionnels (rapports, comptes-rendus, PV)', type: 'TRANSVERSALE', credits: 2, semester: 3, elements: [] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 3, elements: [] },
      // Semestre 4
      { code: 'PHI 1450', name: 'Histoire de la Philosophie occidentale: La Renaissance', type: 'FONDAMENTALE', credits: 4, semester: 4, elements: [] },
      { code: 'PHI 1451', name: 'Histoire de la Philosophie occidentale moderne', type: 'FONDAMENTALE', credits: 4, semester: 4, elements: [] },
      { code: 'PHI 1452', name: 'Epistémologie générale', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [] },
      { code: 'PHI 1453', name: 'Métaphysique et ontologie', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [] },
      { code: 'PHI 1454', name: 'Philosophie de la nature', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [] },
      { code: 'PHI 1455', name: 'Histoire de la philosophie africaine moderne', type: 'FONDAMENTALE', credits: 3, semester: 4, elements: [] },
      { code: 'PHI 1456', name: 'Théodicée/Philosophie politique contemporaine', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [] },
      { code: 'PHI 1457', name: 'Philosophie du droit', type: 'APPROFONDISSEMENT', credits: 3, semester: 4, elements: [] },
      { code: null, name: 'Culture et civilisation de la sous-région ouest-africaine', type: 'TRANSVERSALE', credits: 2, semester: 4, elements: [] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 4, elements: [] },
      // Semestre 5
      { code: 'PHI 1550', name: 'Idéalisme allemand', type: 'APPROFONDISSEMENT', credits: 3, semester: 5, elements: [] },
      { code: 'PHI 1551', name: 'Le matérialisme et le spiritualisme', type: 'APPROFONDISSEMENT', credits: 3, semester: 5, elements: [] },
      { code: 'PHI 1552', name: 'Pessimisme, nihilisme, existentialisme et personnalisme', type: 'APPROFONDISSEMENT', credits: 3, semester: 5, elements: [] },
      { code: 'PHI 1553', name: 'Philosophie du genre/Philosophie chrétienne', type: 'APPROFONDISSEMENT', credits: 2, semester: 5, elements: [] },
      { code: 'PHI 1554', name: 'Philosophie des sciences', type: 'APPROFONDISSEMENT', credits: 2, semester: 5, elements: [] },
      { code: 'PHI 1555', name: 'Epistémologie des sciences sociales', type: 'APPROFONDISSEMENT', credits: 2, semester: 5, elements: [] },
      { code: 'PHI 1556', name: 'Morale et économie', type: 'APPROFONDISSEMENT', credits: 2, semester: 5, elements: [] },
      { code: 'PHI 1557', name: 'Philosophie de la culture', type: 'APPROFONDISSEMENT', credits: 2, semester: 5, elements: [] },
      { code: 'PHI 1558', name: "Philosophie de l'éducation", type: 'APPROFONDISSEMENT', credits: 2, semester: 5, elements: [] },
      { code: 'PHI 1559', name: 'Méthodologie de la synthèse', type: 'APPROFONDISSEMENT', credits: 3, semester: 5, elements: [] },
      { code: 'ANT 1500', name: "Anthropologie du développement", type: 'COMPLEMENTAIRE', credits: 2, semester: 5, elements: [] },
      { code: null, name: 'Les grands enjeux mondiaux', type: 'TRANSVERSALE', credits: 2, semester: 5, elements: [] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 5, elements: [] },
      // Semestre 6
      { code: 'PHI 1650', name: 'Histoire de la philosophie africaine contemporaine', type: 'FONDAMENTALE', credits: 3, semester: 6, elements: [] },
      { code: 'PHI 1651', name: 'Histoire de la Philosophie occidentale contemporaine', type: 'FONDAMENTALE', credits: 3, semester: 6, elements: [] },
      { code: 'PHI 1652', name: 'Bioéthique', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1653', name: "Ethique de l'environnement", type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1654', name: 'Philosophie du langage', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1655', name: 'Philosophie américaine', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1656', name: 'Philosophie des normes', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1657', name: 'Philosophie des religions', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1658', name: 'Philosophie et Doctrine sociale de l\'Eglise', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: null, name: 'Culture générale', type: 'TRANSVERSALE', credits: 2, semester: 6, elements: [] },
      { code: 'INF 1600', name: 'Informatique appliquée à la rédaction de la synthèse', type: 'APPROFONDISSEMENT', credits: 2, semester: 6, elements: [] },
      { code: 'PHI 1659', name: 'Rédaction et présentation de la synthèse', type: 'SPECIALITE', credits: 4, semester: 6, elements: [] },
      { code: null, name: 'UE Libre', type: 'LIBRE', credits: 2, semester: 6, elements: [] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // SHS — Travail Social, Assistance Sociale (AS)
  // ──────────────────────────────────────────────────────
  {
    domain: 'SHS', degree: 'LICENCE',
    mention: 'Travail Social', speciality: 'Assistance Sociale',
    ues: [
      { code: 'EDU 1170', name: 'Education et Bureautique', type: 'FONDAMENTALE', credits: 6, semester: 1, elements: [{ code: '1EDU1170', credits: 2 }, { code: '2EDU1170', credits: 2 }, { code: '3EDU1170', credits: 2 }] },
      { code: 'DRP 1130', name: 'Initiation au Sciences Juridiques', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [{ code: '1DRP1130', credits: 2 }, { code: '2DRP1130', credits: 2 }] },
      { code: 'SOC 1150', name: 'Psychosocial et Culturalisme', type: 'FONDAMENTALE', credits: 6, semester: 1, elements: [{ code: '1SOC1150', credits: 2 }, { code: '2SOC1150', credits: 2 }, { code: '3SOC1150', credits: 2 }] },
      { code: 'MED 1100', name: 'Santé Publique', type: 'FONDAMENTALE', credits: 6, semester: 1, elements: [{ code: '1MED1100', credits: 2 }, { code: '2MED1100', credits: 2 }, { code: '3MED1100', credits: 2 }] },
      { code: 'ADP 1130', name: 'Administration publique', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [{ code: '1ADP1130', credits: 2 }, { code: '2ADP1130', credits: 2 }] },
      { code: 'SOC 1151', name: 'Méthodologie et sciences sociales', type: 'TRANSVERSALE', credits: 4, semester: 1, elements: [{ code: '1SOC1151', credits: 2 }, { code: '2SOC1151', credits: 2 }] },
      { code: 'SOC 1250', name: 'Organisations et Aménagement', type: 'FONDAMENTALE', credits: 6, semester: 2, elements: [{ code: '1SOC1250', credits: 2 }, { code: '2SOC1250', credits: 2 }, { code: '3SOC1250', credits: 2 }] },
      { code: 'PHI 1251', name: 'Philosophie', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [{ code: '1PHI1251', credits: 2 }, { code: '2PHI1251', credits: 2 }] },
      { code: 'MED 1200', name: 'Médecine générale', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1MED1200', credits: 2 }, { code: '2MED1200', credits: 2 }] },
      { code: 'GES 1240', name: 'Economie Générale et Comptabilité', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1GES1240', credits: 2 }, { code: '2GES1240', credits: 2 }] },
      { code: 'AGR 1210', name: 'Population et agriculture', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1AGR1210', credits: 2 }, { code: '2AGR1210', credits: 2 }] },
      { code: 'ANG 1260', name: 'Anglais', type: 'TRANSVERSALE', credits: 4, semester: 2, elements: [{ code: '1ANG1260', credits: 2 }, { code: '2ANG1260', credits: 2 }] },
      { code: 'TCC 1290', name: "Stage d'exploration", type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'PSY 1350', name: 'Psychologie appliquée', type: 'SPECIALITE', credits: 6, semester: 3, elements: [{ code: '1PSY1350', credits: 2 }, { code: '2PSY1350', credits: 2 }, { code: '3PSY1350', credits: 2 }] },
      { code: 'PSY 1351', name: 'Service Social', type: 'SPECIALITE', credits: 4, semester: 3, elements: [{ code: '1PSY1351', credits: 2 }, { code: '2PSY1351', credits: 2 }] },
      { code: 'SOC 1352', name: 'Société et Développement', type: 'SPECIALITE', credits: 4, semester: 3, elements: [{ code: '1SOC1352', credits: 2 }, { code: '2SOC1352', credits: 2 }] },
      { code: 'SOC 1353', name: 'Méthodologie et sciences sociales', type: 'COMPLEMENTAIRE', credits: 4, semester: 3, elements: [{ code: '1SOC1353', credits: 2 }, { code: '2SOC1353', credits: 2 }] },
      { code: 'DRP 1330', name: 'Droit humain', type: 'COMPLEMENTAIRE', credits: 6, semester: 3, elements: [{ code: '1DRP1330', credits: 2 }, { code: '2DRP1330', credits: 2 }, { code: '3DRP1330', credits: 2 }] },
      { code: 'MED 1300', name: 'Médecine générale', type: 'COMPLEMENTAIRE', credits: 4, semester: 3, elements: [{ code: '1MED1300', credits: 2 }, { code: '2MED1300', credits: 2 }] },
      { code: 'SOC 1354', name: 'Economie Sociale et Familiale', type: 'TRANSVERSALE', credits: 2, semester: 3, elements: [] },
      { code: 'PSY 1450', name: 'Service Social: Normes et Pratiques', type: 'SPECIALITE', credits: 6, semester: 4, elements: [{ code: '1PSY1450', credits: 2 }, { code: '2PSY1450', credits: 2 }, { code: '3PSY1450', credits: 2 }] },
      { code: 'SOC 1451', name: 'Développement et Participation', type: 'SPECIALITE', credits: 4, semester: 4, elements: [{ code: '1SOC1451', credits: 2 }, { code: '2SOC1451', credits: 2 }] },
      { code: 'EDU 1470', name: 'Education et Réadaptation', type: 'SPECIALITE', credits: 4, semester: 4, elements: [{ code: '1EDU1470', credits: 2 }, { code: '2EDU1470', credits: 2 }] },
      { code: 'ADP 1431', name: 'Intervention administrative', type: 'COMPLEMENTAIRE', credits: 4, semester: 4, elements: [{ code: '1ADP1431', credits: 2 }, { code: '2ADP1431', credits: 2 }] },
      { code: 'GES 1440', name: 'Gestion des Projets', type: 'SPECIALITE', credits: 4, semester: 4, elements: [{ code: '1GES1440', credits: 2 }, { code: '2GES1440', credits: 2 }] },
      { code: 'TCC 1490', name: 'Stage de consolidation et médicosocial', type: 'APPROFONDISSEMENT', credits: 6, semester: 4, elements: [] },
      { code: 'DRV 1430', name: 'Obligation et Etat', type: 'TRANSVERSALE', credits: 4, semester: 4, elements: [{ code: '1DRV1430', credits: 2 }, { code: '2DRV1430', credits: 2 }] },
      { code: 'GES 1540', name: 'Gestion des Organisations', type: 'COMPLEMENTAIRE', credits: 6, semester: 5, elements: [{ code: '1GES1540', credits: 2 }, { code: '2GES1540', credits: 2 }, { code: '3GES1540', credits: 2 }] },
      { code: 'MED 1500', name: 'Médecine Pédiatrique', type: 'COMPLEMENTAIRE', credits: 4, semester: 5, elements: [{ code: '1MED1500', credits: 2 }, { code: '2MED1500', credits: 2 }] },
      { code: 'PSY 1550', name: 'Service sociaux des adultes', type: 'SPECIALITE', credits: 4, semester: 5, elements: [{ code: '1PSY1550', credits: 2 }, { code: '2PSY1550', credits: 2 }] },
      { code: 'PSY 1551', name: 'Psychologie des adultes et Relations humaines', type: 'SPECIALITE', credits: 6, semester: 5, elements: [{ code: '1PSY1551', credits: 2 }, { code: '2PSY1551', credits: 2 }, { code: '3PSY1551', credits: 2 }] },
      { code: 'SOC 1552', name: 'Politique et Développement social', type: 'SPECIALITE', credits: 6, semester: 5, elements: [{ code: '1SOC1552', credits: 2 }, { code: '2SOC1552', credits: 2 }, { code: '3SOC1552', credits: 2 }] },
      { code: 'DRV 1530', name: "Droit du travail et de l'obligation", type: 'TRANSVERSALE', credits: 4, semester: 5, elements: [{ code: '1DRV1530', credits: 2 }, { code: '2DRV1530', credits: 2 }] },
      { code: 'GES 1640', name: 'Séminaire de formation', type: 'COMPLEMENTAIRE', credits: 10, semester: 6, elements: [] },
      { code: 'TCC 1691', name: 'Stage préprofessionnel + Rapport de stage', type: 'SPECIALITE', credits: 6, semester: 6, elements: [] },
      { code: 'TCC 1692', name: 'Rédaction de mémoire et soutenance', type: 'FONDAMENTALE', credits: 14, semester: 6, elements: [] },
    ],
  },

  // ──────────────────────────────────────────────────────
  // SHS — Travail Social, Développement Local Participatif (DLP)
  // ──────────────────────────────────────────────────────
  {
    domain: 'SHS', degree: 'LICENCE',
    mention: 'Travail Social', speciality: 'Développement Local Participatif',
    ues: [
      { code: 'EDU 1170', name: 'Education et Bureautique', type: 'FONDAMENTALE', credits: 6, semester: 1, elements: [{ code: '1EDU1170', credits: 2 }, { code: '2EDU1170', credits: 2 }, { code: '3EDU1170', credits: 2 }] },
      { code: 'DRP 1130', name: 'Initiation aux sciences juridiques', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [{ code: '1DRP1130', credits: 2 }, { code: '2DRP1130', credits: 2 }] },
      { code: 'SOC 1150', name: 'Psychosocial et culturalisme', type: 'FONDAMENTALE', credits: 6, semester: 1, elements: [{ code: '1SOC1150', credits: 2 }, { code: '2SOC1150', credits: 2 }, { code: '3SOC1150', credits: 2 }] },
      { code: 'MED 1100', name: 'Sante publique', type: 'FONDAMENTALE', credits: 6, semester: 1, elements: [{ code: '1MED1100', credits: 2 }, { code: '2MED1100', credits: 2 }, { code: '3MED1100', credits: 2 }] },
      { code: 'ADP 1130', name: 'Administration publique', type: 'FONDAMENTALE', credits: 4, semester: 1, elements: [{ code: '1ADP1130', credits: 2 }, { code: '2ADP1130', credits: 2 }] },
      { code: 'SOC 1151', name: 'Méthodologie et sciences sociales', type: 'TRANSVERSALE', credits: 4, semester: 1, elements: [{ code: '1SOC1151', credits: 2 }, { code: '2SOC1151', credits: 2 }] },
      { code: 'SOC 1250', name: 'Organisations et Aménagement', type: 'FONDAMENTALE', credits: 6, semester: 2, elements: [{ code: '1SOC1250', credits: 2 }, { code: '2SOC1250', credits: 2 }, { code: '3SOC1250', credits: 2 }] },
      { code: 'PHI 1251', name: 'Philosophie', type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [{ code: '1PHI1251', credits: 2 }, { code: '2PHI1251', credits: 2 }] },
      { code: 'MED 1200', name: 'Médecine générale', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1MED1200', credits: 2 }, { code: '2MED1200', credits: 2 }] },
      { code: 'GES 1240', name: 'Economie générale et Comptabilité', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1GES1240', credits: 2 }, { code: '2GES1240', credits: 2 }] },
      { code: 'AGR 1210', name: 'Population et Agriculture', type: 'COMPLEMENTAIRE', credits: 4, semester: 2, elements: [{ code: '1AGR1210', credits: 2 }, { code: '2AGR1210', credits: 2 }] },
      { code: 'ANG 1260', name: 'Anglais', type: 'TRANSVERSALE', credits: 4, semester: 2, elements: [{ code: '1ANG1260', credits: 2 }, { code: '2ANG1260', credits: 2 }] },
      { code: 'TCC 1290', name: "Stage d'exploration", type: 'FONDAMENTALE', credits: 4, semester: 2, elements: [] },
      { code: 'PSY 1350', name: 'Service Social', type: 'SPECIALITE', credits: 6, semester: 3, elements: [{ code: '1PSY1350', credits: 2 }, { code: '2PSY1350', credits: 2 }, { code: '3PSY1350', credits: 2 }] },
      { code: 'SOC 1351', name: 'Développement local et inclusif', type: 'SPECIALITE', credits: 6, semester: 3, elements: [{ code: '1SOC1351', credits: 2 }, { code: '2SOC1351', credits: 2 }, { code: '3SOC1351', credits: 2 }] },
      { code: 'ECO 1340', name: "Développement de l'environnement", type: 'COMPLEMENTAIRE', credits: 6, semester: 3, elements: [{ code: '1ECO1340', credits: 2 }, { code: '2ECO1340', credits: 2 }, { code: '3ECO1340', credits: 2 }] },
      { code: 'SOC 1352', name: 'Développement communautaire', type: 'SPECIALITE', credits: 4, semester: 3, elements: [{ code: '1SOC1352', credits: 2 }, { code: '2SOC1352', credits: 2 }] },
      { code: 'SOC 1353', name: 'Politique de population', type: 'TRANSVERSALE', credits: 4, semester: 3, elements: [{ code: '1SOC1353', credits: 2 }, { code: '2SOC1353', credits: 2 }] },
      { code: 'SOC 1354', name: 'Statistique et Méthodologie', type: 'COMPLEMENTAIRE', credits: 4, semester: 3, elements: [{ code: '1SOC1354', credits: 2 }, { code: '2SOC1354', credits: 2 }] },
      { code: 'SOC 1450', name: 'Société et Développement', type: 'APPROFONDISSEMENT', credits: 4, semester: 4, elements: [{ code: '1SOC1450', credits: 2 }, { code: '2SOC1450', credits: 2 }] },
      { code: 'ECO 1440', name: 'Economie et Développement', type: 'APPROFONDISSEMENT', credits: 4, semester: 4, elements: [{ code: '1ECO1440', credits: 2 }, { code: '2ECO1440', credits: 2 }] },
      { code: 'GES 1441', name: 'Gestion des projets', type: 'SPECIALITE', credits: 4, semester: 4, elements: [{ code: '1GES1441', credits: 2 }, { code: '2GES1441', credits: 2 }] },
      { code: 'SOC 1451', name: 'Méthodologie de la recherche en Sciences sociales avancée', type: 'APPROFONDISSEMENT', credits: 2, semester: 4, elements: [] },
      { code: 'SOC 1452', name: "Sociologie de l'exclusion", type: 'TRANSVERSALE', credits: 2, semester: 4, elements: [] },
      { code: 'AGRI 1410', name: 'Production et Environnement', type: 'APPROFONDISSEMENT', credits: 6, semester: 4, elements: [{ code: '1AGRI1410', credits: 2 }, { code: '2AGRI1410', credits: 2 }, { code: '3AGRI1410', credits: 2 }] },
      { code: 'EDU 1470', name: 'Alphabétisation et NTIC', type: 'SPECIALITE', credits: 4, semester: 4, elements: [{ code: '1EDU1470', credits: 2 }, { code: '2EDU1470', credits: 2 }] },
      { code: 'TCC 1490', name: 'Stage de Consolidation', type: 'APPROFONDISSEMENT', credits: 6, semester: 4, elements: [] },
      { code: 'GES 1540', name: 'Gestion des Organisations', type: 'COMPLEMENTAIRE', credits: 6, semester: 5, elements: [{ code: '1GES1540', credits: 2 }, { code: '2GES1540', credits: 2 }, { code: '3GES1540', credits: 2 }] },
      { code: 'ECO 1541', name: 'Economie et Changement social', type: 'SPECIALITE', credits: 6, semester: 5, elements: [{ code: '1ECO1541', credits: 2 }, { code: '2ECO1541', credits: 2 }, { code: '3ECO1541', credits: 2 }] },
      { code: 'PSY 1551', name: 'Soutien éducatif local', type: 'SPECIALITE', credits: 6, semester: 5, elements: [{ code: '1PSY1551', credits: 2 }, { code: '2PSY1551', credits: 2 }, { code: '3PSY1551', credits: 2 }] },
      { code: 'EDU 1570', name: 'Education et Genre', type: 'SPECIALITE', credits: 4, semester: 5, elements: [{ code: '1EDU1570', credits: 2 }, { code: '2EDU1570', credits: 2 }] },
      { code: 'SOC 1552', name: 'Politique et Développement social', type: 'TRANSVERSALE', credits: 4, semester: 5, elements: [{ code: '1SOC1552', credits: 2 }, { code: '2SOC1552', credits: 2 }] },
      { code: 'TCC 1690', name: 'Séminaire de formation', type: 'FONDAMENTALE', credits: 10, semester: 6, elements: [] },
      { code: 'TCC 1691', name: 'Stage préprofessionnel et Rapport de stage', type: 'APPROFONDISSEMENT', credits: 6, semester: 6, elements: [] },
      { code: 'TCC 1692', name: 'MEMOIRE + SOUTENANCE', type: 'FONDAMENTALE', credits: 14, semester: 6, elements: [] },
    ],
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedReferentialTogo2022() {
  console.log('🌍 Seed référentiel Togo 2022...')

  const referential = await prisma.nationalReferential.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id:          '00000000-0000-0000-0000-000000000001',
      country:     'TG',
      issuer:      'MESRS-Togo',
      name:        'Curricula harmonisés',
      version:     '2022-04',
      isActive:    true,
      publishedAt: new Date('2022-04-01'),
    },
  })

  console.log(`  ✓ Référentiel: ${referential.name} v${referential.version}`)

  let upserted = 0
  let skipped = 0

  for (const mention of TOGO_2022) {
    for (const ue of mention.ues) {
      // Clé d'idempotence : code+referentialId pour les codées, sinon nom+mention+spécialité+semestre
      const existing = ue.code
        ? await prisma.uETemplate.findFirst({
            where: { referentialId: referential.id, code: ue.code },
            select: { id: true },
          })
        : await prisma.uETemplate.findFirst({
            where: {
              referentialId: referential.id,
              code:          null,
              name:          ue.name,
              mention:       mention.mention,
              speciality:    mention.speciality ?? null,
              semester:      ue.semester,
            },
            select: { id: true },
          })

      if (existing) {
        skipped++
        continue
      }

      await prisma.uETemplate.create({
        data: {
          referentialId: referential.id,
          domain:        mention.domain,
          degree:        mention.degree,
          mention:       mention.mention,
          speciality:    mention.speciality ?? null,
          semester:      ue.semester,
          code:          ue.code,
          name:          ue.name,
          type:          ue.type,
          credits:       ue.credits,
          elements: {
            create: ue.elements.map((ec) => ({
              code:    ec.code,
              name:    ec.name,
              credits: ec.credits,
            })),
          },
        },
      })

      upserted++
    }
  }

  console.log(`  ✓ UE créées : ${upserted} | déjà existantes : ${skipped}`)
}

seedReferentialTogo2022()
  .then(() => {
    console.log('✅ Seed référentiel terminé')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
