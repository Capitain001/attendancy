// scripts/generate/service/utils.ts
//
// Helpers CLI purs partagés par les générateurs de service (service.ts,
// create-service.ts) : parsing d'arguments + conversions de casse. Zéro état,
// zéro effet de bord — à importer, jamais à redupliquer dans un générateur.

export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | true>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      flags[key] = rest.length > 0 ? rest.join("=") : true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

export function toPascalCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toScreamingSnake(input: string): string {
  return toKebabCase(input).replace(/-/g, "_").toUpperCase();
}
