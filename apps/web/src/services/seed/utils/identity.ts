import crypto from "node:crypto";
import { faker } from "@faker-js/faker/locale/fr";
import type { Sex } from "@/generated/prisma/client";

export interface FakeIdentity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sex: Sex;
  dateOfBirth: Date;
}

// User.email et User.phone sont @unique dans le schéma : plutôt que de
// retenter sur conflit (comme tryConstraint le fait ailleurs pour de vraies
// mutations utilisateur), on garantit l'unicité à la génération via un
// suffixe haute-entropie — plus simple et déterministe pour un outil de seed.
export function generateFakeIdentity(): FakeIdentity {
  const sex = faker.helpers.arrayElement<Sex>(["MALE", "FEMALE"]);
  const firstName = faker.person.firstName(sex === "MALE" ? "male" : "female");
  const lastName = faker.person.lastName();
  const uniqueSuffix = crypto.randomUUID().slice(0, 8);

  const emailLocal = `${firstName}.${lastName}.${uniqueSuffix}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z0-9.]/g, "");

  return {
    firstName,
    lastName,
    // Domaine .test (RFC 2606, réservé aux tests) : jamais un vrai domaine,
    // trivialement reconnaissable comme donnée factice dans les logs/exports.
    email: `${emailLocal}@seed.test`,
    // Préfixe +000 : n'est l'indicatif d'aucun pays réel, donc jamais confondu
    // avec un vrai numéro, tout en respectant le format attendu par le champ.
    phone: `+000${faker.string.numeric(9)}`,
    sex,
    dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
  };
}
