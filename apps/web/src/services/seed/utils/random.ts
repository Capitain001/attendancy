export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[randomInt(0, items.length - 1)];
}

// Échantillon SANS remise (jamais deux fois le même élément) — utile pour
// "rattacher N enfants distincts à ce parent". Pour un tirage AVEC remise
// (ex: un même prof peut enseigner plusieurs cours), utiliser pickRandom en
// boucle plutôt que sampleN.
export function sampleN<T>(items: readonly T[], n: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  const count = Math.min(n, pool.length);

  for (let i = 0; i < count; i++) {
    const index = randomInt(0, pool.length - 1);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}
