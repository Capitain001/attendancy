// prisma/seed/referential-togo-2022.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UETemplateType, DegreeType } from '../../src/generated/prisma/client'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL environment variable')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// ─── Types ────────────────────────────────────────────────────────────────────

type ECData = { 
  code: string
  name: string
  credits: number
}

type UEData = {
  code: string | null
  name: string
  type: UETemplateType
  credits: number
  semester: number
  elements: ECData[]
}

type ProgramData = {
  domain: string
  degree: DegreeType
  mention: string
  speciality: string | null
  ues: UEData[]
  profile?: string
  competencies?: string
  outcomes?: string
}

// ─── Données ──────────────────────────────────────────────────────────────────

const TOGO_2022: ProgramData[] = [

  // ──────────────────────────────────────────────────────
  // LLA — Traduction, Anglais-Français-Anglais
  // ──────────────────────────────────────────────────────
  {
    domain: 'LLA',
    degree: 'LICENCE_PROFESSIONNELLE',
    mention: 'Traduction',
    speciality: 'Anglais-Français-Anglais',
    profile: "BAC2 toutes séries ou équivalent",
    competencies: "Maîtrise des techniques de traduction anglais-français",
    outcomes: "Traducteur, interprète, rédacteur technique",
    ues: [
      // Semestre 1
      { 
        code: 'ANG-1160', 
        name: 'Grammaire anglaise', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 1, 
        elements: [
          { code: '1ANG-1160', name: 'Grammaire de base', credits: 1.5 },
          { code: '2ANG-1160', name: 'Grammaire avancée', credits: 1.5 }
        ] 
      },
      { 
        code: 'LNG-1160', 
        name: 'Introduction à la linguistique anglaise', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 1, 
        elements: [
          { code: '1LNG-1160', name: 'Linguistique générale', credits: 1.5 },
          { code: '2LNG-1160', name: 'Linguistique anglaise', credits: 1.5 }
        ] 
      },
      { 
        code: 'DRP-1330', 
        name: 'Droit civil: introduction', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 1, 
        elements: [
          { code: '1DRP-1330', name: 'Droit civil général', credits: 1 },
          { code: '2DRP-1330', name: 'Droit des personnes', credits: 1 }
        ] 
      },
      { 
        code: 'ANG-1161', 
        name: 'Civilisation anglophone', 
        type: 'COMPLEMENTAIRE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1ANG-1161', name: 'Civilisation britannique', credits: 1 },
          { code: '2ANG-1161', name: 'Civilisation américaine', credits: 1 },
          { code: '3ANG-1161', name: 'Civilisation africaine anglophone', credits: 2 }
        ] 
      },
      { 
        code: 'ANG-1162', 
        name: 'Laboratoire 1', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 1, 
        elements: [
          { code: '1ANG-1162', name: 'Laboratoire audio', credits: 1.5 },
          { code: '2ANG-1162', name: 'Laboratoire vidéo', credits: 1.5 }
        ] 
      },
      { 
        code: 'FRA-1160', 
        name: 'Littérature et culture francophones', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1FRA-1160', name: 'Littérature française', credits: 2 },
          { code: '2FRA-1160', name: 'Culture francophone', credits: 2 }
        ] 
      },
      { 
        code: 'TRA-1160', 
        name: 'Stylistique comparée (français-anglais)', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1TRA-1160', name: 'Stylistique française', credits: 2 },
          { code: '2TRA-1160', name: 'Stylistique anglaise', credits: 2 }
        ] 
      },
      // Semestre 2
      { 
        code: 'TRA-1260', 
        name: 'Techniques de résumé de texte', 
        type: 'COMPLEMENTAIRE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1TRA-1260', name: 'Résumé en français', credits: 1.5 },
          { code: '2TRA-1260', name: 'Résumé en anglais', credits: 1.5 }
        ] 
      },
      { 
        code: 'LNG-1260', 
        name: 'Phonétique articulatoire', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1LNG-1260', name: 'Phonétique générale', credits: 1.5 },
          { code: '2LNG-1260', name: 'Phonétique anglaise', credits: 1.5 }
        ] 
      },
      { 
        code: 'FRA-1260', 
        name: 'Grammaire de base en français', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1FRA-1260', name: 'Grammaire française', credits: 1.5 },
          { code: '2FRA-1260', name: 'Orthographe française', credits: 1.5 }
        ] 
      },
      { 
        code: 'LNG-1261', 
        name: 'Phonétique-Phonologie', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1LNG-1261', name: 'Phonétique anglaise', credits: 2 },
          { code: '2LNG-1261', name: 'Phonologie anglaise', credits: 2 }
        ] 
      },
      { 
        code: 'ANG-1263', 
        name: 'Laboratoire 2', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1ANG-1263', name: 'Laboratoire audio avancé', credits: 1.5 },
          { code: '2ANG-1263', name: 'Laboratoire vidéo avancé', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1261', 
        name: 'Mécanismes et difficultés de la Traduction', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1TRA-1261', name: 'Mécanismes de traduction', credits: 1.5 },
          { code: '2TRA-1261', name: 'Difficultés de traduction', credits: 1.5 }
        ] 
      },
      { 
        code: 'ANG-1261', 
        name: 'Littérature et culture anglophones', 
        type: 'COMPLEMENTAIRE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1ANG-1261', name: 'Littérature anglaise', credits: 1 },
          { code: '2ANG-1261', name: 'Littérature américaine', credits: 1 },
          { code: '3ANG-1261', name: 'Culture anglophone', credits: 2 }
        ] 
      },
      { 
        code: 'TRA-1262', 
        name: 'Traduction et interdisciplinarité', 
        type: 'APPROFONDISSEMENT', 
        credits: 5, 
        semester: 2, 
        elements: [
          { code: '1TRA-1262', name: 'Traduction littéraire', credits: 2.5 },
          { code: '2TRA-1262', name: 'Traduction technique', credits: 2.5 }
        ] 
      },
      // UE libre sans code
      { 
        code: null, 
        name: 'UE Libre S2', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 2, 
        elements: [] 
      },
      // Semestre 3
      { 
        code: 'ANG-1360', 
        name: 'Morphologie syntaxe', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 3, 
        elements: [
          { code: '1ANG-1360', name: 'Morphologie anglaise', credits: 2 },
          { code: '2ANG-1360', name: 'Syntaxe anglaise', credits: 2 }
        ] 
      },
      { 
        code: 'TRA-1360', 
        name: 'Culture anglophone et interprétation', 
        type: 'APPROFONDISSEMENT', 
        credits: 5, 
        semester: 3, 
        elements: [
          { code: '1TRA-1360', name: 'Culture anglophone', credits: 2.5 },
          { code: '2TRA-1360', name: 'Interprétation', credits: 2.5 }
        ] 
      },
      { 
        code: 'TRA-1361', 
        name: 'Les faux amis sémantiques anglais-français', 
        type: 'APPROFONDISSEMENT', 
        credits: 5, 
        semester: 3, 
        elements: [
          { code: '1TRA-1361', name: 'Faux amis anglais-français', credits: 2.5 },
          { code: '2TRA-1361', name: 'Exercices pratiques', credits: 2.5 }
        ] 
      },
      { 
        code: 'TRA-1362', 
        name: 'Les faux amis morphologique français-anglais', 
        type: 'APPROFONDISSEMENT', 
        credits: 5, 
        semester: 3, 
        elements: [
          { code: '1TRA-1362', name: 'Faux amis français-anglais', credits: 2.5 },
          { code: '2TRA-1362', name: 'Exercices pratiques', credits: 2.5 }
        ] 
      },
      { 
        code: 'ANG-1361', 
        name: 'Laboratoire 3', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1ANG-1361', name: 'Laboratoire avancé 1', credits: 1.5 },
          { code: '2ANG-1361', name: 'Laboratoire avancé 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'DRV-1330', 
        name: 'Droit international: introduction', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 3, 
        elements: [
          { code: '1DRV-1330', name: 'Droit international public', credits: 1 },
          { code: '2DRV-1330', name: 'Droit international privé', credits: 1 }
        ] 
      },
      { 
        code: 'MGT-1340', 
        name: 'Gestion des Ressources Humaines', 
        type: 'COMPLEMENTAIRE', 
        credits: 4, 
        semester: 3, 
        elements: [
          { code: '1MGT-1340', name: 'GRH générale', credits: 2 },
          { code: '2MGT-1340', name: 'GRH pratique', credits: 2 }
        ] 
      },
      { 
        code: null, 
        name: 'UE Libre S3', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 3, 
        elements: [] 
      },
      // Semestre 4
      { 
        code: 'TRA-1460', 
        name: 'Anglais économique, commercial et financier', 
        type: 'APPROFONDISSEMENT', 
        credits: 5, 
        semester: 4, 
        elements: [
          { code: '1TRA-1460', name: 'Anglais économique', credits: 2.5 },
          { code: '2TRA-1460', name: 'Anglais financier', credits: 2.5 }
        ] 
      },
      { 
        code: 'TRA-1461', 
        name: 'Théories contemporaines et méthodes de traduction', 
        type: 'APPROFONDISSEMENT', 
        credits: 5, 
        semester: 4, 
        elements: [
          { code: '1TRA-1461', name: 'Théories de traduction', credits: 2.5 },
          { code: '2TRA-1461', name: 'Méthodes de traduction', credits: 2.5 }
        ] 
      },
      { 
        code: 'SOC-1450', 
        name: 'Traduction comme science humaine', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 4, 
        elements: [
          { code: '1SOC-1450', name: 'Traduction et société', credits: 1.5 },
          { code: '2SOC-1450', name: 'Traduction et culture', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1462', 
        name: 'Equipement de traduction', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 4, 
        elements: [
          { code: '1TRA-1462', name: 'Logiciels de traduction', credits: 1.5 },
          { code: '2TRA-1462', name: 'Outils de traduction', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1463', 
        name: "Champs sémantiques: Agriculture, Hôtellerie, Tourisme", 
        type: 'APPROFONDISSEMENT', 
        credits: 4, 
        semester: 4, 
        elements: [
          { code: '1TRA-1463', name: 'Agriculture', credits: 2 },
          { code: '2TRA-1463', name: 'Hôtellerie-Tourisme', credits: 2 }
        ] 
      },
      { 
        code: 'ANG-1460', 
        name: 'Laboratoire 4', 
        type: 'APPROFONDISSEMENT', 
        credits: 2, 
        semester: 4, 
        elements: [
          { code: '1ANG-1460', name: 'Laboratoire 4-1', credits: 1 },
          { code: '2ANG-1460', name: 'Laboratoire 4-2', credits: 1 }
        ] 
      },
      { 
        code: 'MGT-1440', 
        name: 'Entrepreneuriat', 
        type: 'TRANSVERSALE', 
        credits: 3, 
        semester: 4, 
        elements: [
          { code: '1MGT-1440', name: 'Entrepreneuriat général', credits: 1.5 },
          { code: '2MGT-1440', name: 'Création d\'entreprise', credits: 1.5 }
        ] 
      },
      { 
        code: null, 
        name: 'UE Libre S4', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 4, 
        elements: [] 
      },
      // Semestre 5
      { 
        code: 'ANG-1560', 
        name: 'Techniques de rédaction académique', 
        type: 'TRANSVERSALE', 
        credits: 3, 
        semester: 5, 
        elements: [
          { code: '1ANG-1560', name: 'Rédaction académique anglaise', credits: 1.5 },
          { code: '2ANG-1560', name: 'Rédaction académique française', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1560', 
        name: 'Champs sémantiques: Informatique, Transport et Logistique', 
        type: 'SPECIALITE', 
        credits: 4, 
        semester: 5, 
        elements: [
          { code: '1TRA-1560', name: 'Informatique', credits: 2 },
          { code: '2TRA-1560', name: 'Transport-Logistique', credits: 2 }
        ] 
      },
      { 
        code: 'TRA-1561', 
        name: 'Techniques de prise de notes', 
        type: 'COMPLEMENTAIRE', 
        credits: 3, 
        semester: 5, 
        elements: [
          { code: '1TRA-1561', name: 'Prise de notes française', credits: 1.5 },
          { code: '2TRA-1561', name: 'Prise de notes anglaise', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1562', 
        name: 'Abréviations internationales', 
        type: 'SPECIALITE', 
        credits: 4, 
        semester: 5, 
        elements: [
          { code: '1TRA-1562', name: 'Abréviations générales', credits: 2 },
          { code: '2TRA-1562', name: 'Abréviations spécialisées', credits: 2 }
        ] 
      },
      { 
        code: 'ANG-1561', 
        name: 'Laboratoire 5', 
        type: 'SPECIALITE', 
        credits: 2, 
        semester: 5, 
        elements: [
          { code: '1ANG-1561', name: 'Laboratoire 5-1', credits: 1 },
          { code: '2ANG-1561', name: 'Laboratoire 5-2', credits: 1 }
        ] 
      },
      { 
        code: 'DRP-1530', 
        name: 'Droit de travail', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 5, 
        elements: [
          { code: '1DRP-1530', name: 'Droit du travail général', credits: 1 },
          { code: '2DRP-1530', name: 'Droit du travail comparé', credits: 1 }
        ] 
      },
      { 
        code: 'TRA-1563', 
        name: 'Champs sémantiques: droit, économie et société', 
        type: 'SPECIALITE', 
        credits: 4, 
        semester: 5, 
        elements: [
          { code: '1TRA-1563', name: 'Droit', credits: 2 },
          { code: '2TRA-1563', name: 'Economie-Société', credits: 2 }
        ] 
      },
      { 
        code: 'TRA-1564', 
        name: 'Logiciels de traduction', 
        type: 'SPECIALITE', 
        credits: 3, 
        semester: 5, 
        elements: [
          { code: '1TRA-1564', name: 'Trados', credits: 1.5 },
          { code: '2TRA-1564', name: 'Autres logiciels', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1565', 
        name: 'Stage professionnel et rapport', 
        type: 'SPECIALITE', 
        credits: 5, 
        semester: 5, 
        elements: [
          { code: '1TRA-1565', name: 'Stage', credits: 2.5 },
          { code: '2TRA-1565', name: 'Rapport de stage', credits: 2.5 }
        ] 
      },
      // Semestre 6
      { 
        code: 'DRP-1630', 
        name: 'Code du travail togolais', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 6, 
        elements: [
          { code: '1DRP-1630', name: 'Code du travail général', credits: 1 },
          { code: '2DRP-1630', name: 'Code du travail pratique', credits: 1 }
        ] 
      },
      { 
        code: 'TRA-1660', 
        name: 'Présentation du projet professionnel', 
        type: 'SPECIALITE', 
        credits: 3, 
        semester: 6, 
        elements: [
          { code: '1TRA-1660', name: 'Projet professionnel', credits: 1.5 },
          { code: '2TRA-1660', name: 'Présentation orale', credits: 1.5 }
        ] 
      },
      { 
        code: 'TRA-1661', 
        name: 'Rédaction du mémoire', 
        type: 'SPECIALITE', 
        credits: 10, 
        semester: 6, 
        elements: [
          { code: '1TRA-1661', name: 'Mémoire 1', credits: 5 },
          { code: '2TRA-1661', name: 'Mémoire 2', credits: 5 }
        ] 
      },
      { 
        code: 'TRA-1662', 
        name: 'Soutenance', 
        type: 'SPECIALITE', 
        credits: 15, 
        semester: 6, 
        elements: [
          { code: '1TRA-1662', name: 'Préparation soutenance', credits: 7.5 },
          { code: '2TRA-1662', name: 'Soutenance orale', credits: 7.5 }
        ] 
      },
    ],
  },

  // ──────────────────────────────────────────────────────
  // SHS — Philosophie (sans spécialité)
  // ──────────────────────────────────────────────────────
  {
    domain: 'SHS',
    degree: 'LICENCE_FONDAMENTALE',
    mention: 'Philosophie',
    speciality: null,
    profile: "BAC2 toutes séries ou équivalent",
    competencies: "Esprit critique, analyse philosophique",
    outcomes: "Enseignant, chercheur, consultant",
    ues: [
      // Semestre 1
      { 
        code: 'PHI-1150', 
        name: 'Histoire de la philosophie: Les présocratiques', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1PHI-1150', name: 'Présocratiques 1', credits: 2 },
          { code: '2PHI-1150', name: 'Présocratiques 2', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1151', 
        name: 'Histoire de la philosophie: Socrate et les socratiques', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1PHI-1151', name: 'Socrate', credits: 2 },
          { code: '2PHI-1151', name: 'Socratiques', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1152', 
        name: 'Introduction à la philosophie', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1PHI-1152', name: 'Philosophie générale', credits: 2 },
          { code: '2PHI-1152', name: 'Philosophie pratique', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1153', 
        name: 'Introduction à la philosophie morale', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 1, 
        elements: [
          { code: '1PHI-1153', name: 'Morale générale', credits: 1.5 },
          { code: '2PHI-1153', name: 'Morale pratique', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1154', 
        name: 'Méthodologie philosophique: Dissertation', 
        type: 'FONDAMENTALE', 
        credits: 2, 
        semester: 1, 
        elements: [
          { code: '1PHI-1154', name: 'Méthodologie 1', credits: 1 },
          { code: '2PHI-1154', name: 'Méthodologie 2', credits: 1 }
        ] 
      },
      { 
        code: 'MTU-1100', 
        name: "Formation au travail universitaire et à l'informatique", 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 1, 
        elements: [
          { code: '1MTU-1100', name: 'Travail universitaire', credits: 1 },
          { code: '2MTU-1100', name: 'Informatique', credits: 1 }
        ] 
      },
      { 
        code: 'FRA-1100', 
        name: 'Français: Lire et écrire', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 1, 
        elements: [
          { code: '1FRA-1100', name: 'Lecture', credits: 1 },
          { code: '2FRA-1100', name: 'Écriture', credits: 1 }
        ] 
      },
      { 
        code: 'ANG-1100', 
        name: 'Anglais: lire et écrire', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 1, 
        elements: [
          { code: '1ANG-1100', name: 'Lecture anglaise', credits: 1 },
          { code: '2ANG-1100', name: 'Écriture anglaise', credits: 1 }
        ] 
      },
      { 
        code: 'ANT-1100', 
        name: "Introduction à l'anthropologie sociale et culturelle", 
        type: 'COMPLEMENTAIRE', 
        credits: 3, 
        semester: 1, 
        elements: [
          { code: '1ANT-1100', name: 'Anthropologie sociale', credits: 1.5 },
          { code: '2ANT-1100', name: 'Anthropologie culturelle', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1155', 
        name: 'Introduction à la philosophie africaine', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 1, 
        elements: [
          { code: '1PHI-1155', name: 'Philosophie africaine 1', credits: 2 },
          { code: '2PHI-1155', name: 'Philosophie africaine 2', credits: 2 }
        ] 
      },
      // Semestre 2
      { 
        code: 'PHI-1250', 
        name: 'Stoïcisme, épicurisme et scepticisme', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1PHI-1250', name: 'Stoïcisme', credits: 1.5 },
          { code: '2PHI-1250', name: 'Épicurisme', credits: 1.5 },
          { code: '3PHI-1250', name: 'Scepticisme', credits: 1 }
        ] 
      },
      { 
        code: 'PHI-1251', 
        name: 'Néoplatonisme et antiquité tardive', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1PHI-1251', name: 'Néoplatonisme', credits: 2 },
          { code: '2PHI-1251', name: 'Antiquité tardive', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1252', 
        name: 'Logique classique', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1PHI-1252', name: 'Logique 1', credits: 1.5 },
          { code: '2PHI-1252', name: 'Logique 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1253', 
        name: "Introduction à la philosophie de l'éducation", 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1PHI-1253', name: 'Philosophie éducative', credits: 2 },
          { code: '2PHI-1253', name: 'Éducation pratique', credits: 2 }
        ] 
      },
      { 
        code: 'EDU-1200', 
        name: "Introduction aux sciences de l'éducation", 
        type: 'COMPLEMENTAIRE', 
        credits: 3, 
        semester: 2, 
        elements: [
          { code: '1EDU-1200', name: 'Sciences éducatives', credits: 1.5 },
          { code: '2EDU-1200', name: 'Pédagogie', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1254', 
        name: 'Introduction à la métaphysique', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1PHI-1254', name: 'Métaphysique 1', credits: 2 },
          { code: '2PHI-1254', name: 'Métaphysique 2', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1255', 
        name: 'Introduction à la philosophie politique', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 2, 
        elements: [
          { code: '1PHI-1255', name: 'Philosophie politique 1', credits: 2 },
          { code: '2PHI-1255', name: 'Philosophie politique 2', credits: 2 }
        ] 
      },
      { 
        code: 'SOC-1200', 
        name: 'Introduction à la sociologie', 
        type: 'COMPLEMENTAIRE', 
        credits: 2, 
        semester: 2, 
        elements: [
          { code: '1SOC-1200', name: 'Sociologie générale', credits: 1 },
          { code: '2SOC-1200', name: 'Sociologie pratique', credits: 1 }
        ] 
      },
      { 
        code: 'PSY-1200', 
        name: 'Introduction à la psychologie', 
        type: 'COMPLEMENTAIRE', 
        credits: 2, 
        semester: 2, 
        elements: [
          { code: '1PSY-1200', name: 'Psychologie générale', credits: 1 },
          { code: '2PSY-1200', name: 'Psychologie pratique', credits: 1 }
        ] 
      },
      // Semestre 3
      { 
        code: 'PHI-1350', 
        name: 'Histoire de la Philosophie occidentale médiévale', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1PHI-1350', name: 'Médiévale 1', credits: 1.5 },
          { code: '2PHI-1350', name: 'Médiévale 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1351', 
        name: 'Introduction à la philosophie du langage', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1PHI-1351', name: 'Langage 1', credits: 1.5 },
          { code: '2PHI-1351', name: 'Langage 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1352', 
        name: 'Logique mathématique', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1PHI-1352', name: 'Logique math 1', credits: 1.5 },
          { code: '2PHI-1352', name: 'Logique math 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1353', 
        name: 'Doctrines éthiques modernes', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1PHI-1353', name: 'Éthique moderne 1', credits: 1.5 },
          { code: '2PHI-1353', name: 'Éthique moderne 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1354', 
        name: 'Philosophie politique moderne', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1PHI-1354', name: 'Politique moderne 1', credits: 1.5 },
          { code: '2PHI-1354', name: 'Politique moderne 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1355', 
        name: 'Philosophie sociale', 
        type: 'APPROFONDISSEMENT', 
        credits: 2, 
        semester: 3, 
        elements: [
          { code: '1PHI-1355', name: 'Sociale 1', credits: 1 },
          { code: '2PHI-1355', name: 'Sociale 2', credits: 1 }
        ] 
      },
      { 
        code: 'PHI-1356', 
        name: 'Méthodologie philosophique: commentaire', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 3, 
        elements: [
          { code: '1PHI-1356', name: 'Commentaire 1', credits: 1.5 },
          { code: '2PHI-1356', name: 'Commentaire 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'SOC-1300', 
        name: 'Introduction aux méthodes des sciences sociales', 
        type: 'COMPLEMENTAIRE', 
        credits: 2, 
        semester: 3, 
        elements: [
          { code: '1SOC-1300', name: 'Méthodes SHS 1', credits: 1 },
          { code: '2SOC-1300', name: 'Méthodes SHS 2', credits: 1 }
        ] 
      },
      { 
        code: 'PHI-1357', 
        name: 'Anthropologie philosophique', 
        type: 'FONDAMENTALE', 
        credits: 2, 
        semester: 3, 
        elements: [
          { code: '1PHI-1357', name: 'Anthropologie 1', credits: 1 },
          { code: '2PHI-1357', name: 'Anthropologie 2', credits: 1 }
        ] 
      },
      { 
        code: 'PHI-1358', 
        name: "Philosophie de l'art", 
        type: 'APPROFONDISSEMENT', 
        credits: 2, 
        semester: 3, 
        elements: [
          { code: '1PHI-1358', name: 'Art 1', credits: 1 },
          { code: '2PHI-1358', name: 'Art 2', credits: 1 }
        ] 
      },
      { 
        code: null, 
        name: 'Ecrits professionnels (rapports, comptes-rendus, PV)', 
        type: 'TRANSVERSALE', 
        credits: 2, 
        semester: 3, 
        elements: [
          { code: 'ECRIT-1', name: 'Rapports', credits: 1 },
          { code: 'ECRIT-2', name: 'Comptes-rendus', credits: 1 }
        ] 
      },
      { 
        code: null, 
        name: 'UE Libre S3', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 3, 
        elements: [] 
      },
      // Semestre 4 (simplifié pour l'exemple)
      { 
        code: 'PHI-1450', 
        name: 'Histoire de la Philosophie occidentale: La Renaissance', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 4, 
        elements: [
          { code: '1PHI-1450', name: 'Renaissance 1', credits: 2 },
          { code: '2PHI-1450', name: 'Renaissance 2', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1451', 
        name: 'Histoire de la Philosophie occidentale moderne', 
        type: 'FONDAMENTALE', 
        credits: 4, 
        semester: 4, 
        elements: [
          { code: '1PHI-1451', name: 'Moderne 1', credits: 2 },
          { code: '2PHI-1451', name: 'Moderne 2', credits: 2 }
        ] 
      },
      { 
        code: 'PHI-1452', 
        name: 'Epistémologie générale', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 4, 
        elements: [
          { code: '1PHI-1452', name: 'Épistémologie 1', credits: 1.5 },
          { code: '2PHI-1452', name: 'Épistémologie 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1453', 
        name: 'Métaphysique et ontologie', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 4, 
        elements: [
          { code: '1PHI-1453', name: 'Métaphysique', credits: 1.5 },
          { code: '2PHI-1453', name: 'Ontologie', credits: 1.5 }
        ] 
      },
      { 
        code: null, 
        name: 'UE Libre S4', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 4, 
        elements: [] 
      },
      // Semestre 5 (simplifié)
      { 
        code: 'PHI-1550', 
        name: 'Idéalisme allemand', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 5, 
        elements: [
          { code: '1PHI-1550', name: 'Idéalisme 1', credits: 1.5 },
          { code: '2PHI-1550', name: 'Idéalisme 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1551', 
        name: 'Le matérialisme et le spiritualisme', 
        type: 'APPROFONDISSEMENT', 
        credits: 3, 
        semester: 5, 
        elements: [
          { code: '1PHI-1551', name: 'Matérialisme', credits: 1.5 },
          { code: '2PHI-1551', name: 'Spiritualisme', credits: 1.5 }
        ] 
      },
      { 
        code: null, 
        name: 'UE Libre S5', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 5, 
        elements: [] 
      },
      // Semestre 6 (simplifié)
      { 
        code: 'PHI-1650', 
        name: 'Histoire de la philosophie africaine contemporaine', 
        type: 'FONDAMENTALE', 
        credits: 3, 
        semester: 6, 
        elements: [
          { code: '1PHI-1650', name: 'Africaine 1', credits: 1.5 },
          { code: '2PHI-1650', name: 'Africaine 2', credits: 1.5 }
        ] 
      },
      { 
        code: 'PHI-1659', 
        name: 'Rédaction et présentation de la synthèse', 
        type: 'SPECIALITE', 
        credits: 4, 
        semester: 6, 
        elements: [
          { code: '1PHI-1659', name: 'Rédaction', credits: 2 },
          { code: '2PHI-1659', name: 'Présentation', credits: 2 }
        ] 
      },
      { 
        code: null, 
        name: 'UE Libre S6', 
        type: 'LIBRE', 
        credits: 2, 
        semester: 6, 
        elements: [] 
      },
    ],
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

export async function seedReferentialTogo2022() {
  console.log('🌍 Seed référentiel Togo 2022...')

  // 1. Création du référentiel
  const referential = await prisma.referential.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      country: 'TG',
      issuer: 'MESRS-Togo',
      name: 'Curricula harmonisés',
      version: '2022-04',
      isActive: true,
      publishedAt: new Date('2022-04-01'),
    },
  })

  console.log(`  ✓ Référentiel: ${referential.name} v${referential.version}`)

  let upsertedUEs = 0
  let skippedUEs = 0
  let upsertedPrograms = 0

  // 2. Pour chaque programme, créer ou réutiliser les UEs, puis créer le programme
  for (const programData of TOGO_2022) {
    // 2.1. Vérifier si le programme existe déjà
    const existingProgram = await prisma.programTemplate.findFirst({
      where: {
        referentialId: referential.id,
        domain: programData.domain,
        mention: programData.mention,
        specialty: programData.speciality ?? '',
      },
    })

    if (existingProgram) {
      console.log(`  ⏩ Programme existant: ${programData.domain} - ${programData.mention}${programData.speciality ? ` (${programData.speciality})` : ''}`)
      continue
    }

    // 2.2. Créer ou récupérer les UEs
    const ueIds: string[] = []

    for (const ueData of programData.ues) {
      let ueTemplateId: string

      // Recherche de l'UE par code (si code) ou par nom
      const existingUE = ueData.code
        ? await prisma.uETemplate.findFirst({
            where: {
              referentialId: referential.id,
              code: ueData.code,
            },
            select: { id: true },
          })
        : await prisma.uETemplate.findFirst({
            where: {
              referentialId: referential.id,
              code: null,
              name: ueData.name,
            },
            select: { id: true },
          })

      if (existingUE) {
        ueTemplateId = existingUE.id
        skippedUEs++
      } else {
        // Création de l'UE
        const newUE = await prisma.uETemplate.create({
          data: {
            referentialId: referential.id,
            code: ueData.code,
            name: ueData.name,
            description: `UE ${ueData.type} - Semestre ${ueData.semester}`,
            totalCredits: ueData.credits,
            elements: {
              create: ueData.elements.map((ec) => ({
                order: parseInt(ec.code.split('-')[0]) || 1,
                code: ec.code,
                name: ec.name,
                credits: ec.credits,
                description: null,
              })),
            },
          },
        })
        ueTemplateId = newUE.id
        upsertedUEs++
      }

      ueIds.push(ueTemplateId)
    }

    // 2.3. Créer le Programme avec ses ProgramUETemplate
    const program = await prisma.programTemplate.create({
      data: {
        referentialId: referential.id,
        domain: programData.domain,
        mention: programData.mention,
        specialty: programData.speciality ?? '',
        degree: programData.degree,
        profile: programData.profile,
        competencies: programData.competencies,
        outcomes: programData.outcomes,
        programUEs: {
          create: programData.ues.map((ueData, index) => ({
            ueTemplateId: ueIds[index],
            semester: ueData.semester,
            order: index + 1,
            type: ueData.type,
          })),
        },
      },
    })

    upsertedPrograms++
    console.log(`  ✓ Programme créé: ${programData.domain} - ${programData.mention}${programData.speciality ? ` (${programData.speciality})` : ''}`)
  }

  console.log(`  ✓ UE créées : ${upsertedUEs} | déjà existantes : ${skippedUEs}`)
  console.log(`  ✓ Programmes créés : ${upsertedPrograms}`)
}

seedReferentialTogo2022()
  .then(() => {
    console.log('✅ Seed référentiel terminé')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())