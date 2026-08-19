/**
 * standardize-prisma-imports.ts
 *
 * Vérifie / corrige les imports Prisma pour qu'ils pointent tous vers
 * '@/generated/prisma/browser' au lieu de :
 *   - '@/generated/prisma/enums'
 *   - '@/generated/prisma/models'
 *   - '@/prisma' (barrel intermédiaire)
 *
 * Ignore volontairement :
 *   - '@/generated/prisma/client'  (ex: import type { Prisma } from '@/generated/prisma/client')
 *   - '@/generated/prisma/browser' (déjà standardisé)
 *   - tout fichier situé dans le dossier généré lui-même
 *
 * Usage :
 *   tsx scripts/generate/types/standardize-prisma-imports.ts check
 *   tsx scripts/generate/types/standardize-prisma-imports.ts fix
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = process.cwd(); // lancer depuis apps/web
const SCAN_DIR = join(ROOT, 'src');

const EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', 'generated']);

const TARGET_IMPORT = '@/generated/prisma/browser';

// Regex générique qui capture toute déclaration d'import avec sa spécification
// de module entre guillemets (simple ou double, même caractère de fermeture).
const IMPORT_REGEX =
  /import\s+(?:type\s+)?(?:\{[\s\S]*?\}|\*\s+as\s+\w+|\w+)\s+from\s+(['"])([^'"]+)\1/g;

function shouldRewrite(spec: string): boolean {
  if (spec === '@/prisma') return true;
  if (/\/generated\/prisma\/enums$/.test(spec)) return true;
  if (/\/generated\/prisma\/models$/.test(spec)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Parcours des fichiers
// ---------------------------------------------------------------------------

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Analyse d'un fichier
// ---------------------------------------------------------------------------

interface Finding {
  file: string;
  line: number;
  oldSpec: string;
  matchIndex: number;
  matchLength: number;
  matchText: string;
  quote: string;
}

function analyzeFile(filePath: string, content: string): Finding[] {
  const findings: Finding[] = [];
  let match: RegExpExecArray | null;

  IMPORT_REGEX.lastIndex = 0;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const [full, quote, spec] = match;
    if (!shouldRewrite(spec)) continue;

    const line = content.slice(0, match.index).split('\n').length;

    findings.push({
      file: filePath,
      line,
      oldSpec: spec,
      matchIndex: match.index,
      matchLength: full.length,
      matchText: full,
      quote,
    });
  }

  return findings;
}

function applyFix(content: string, findings: Finding[]): string {
  // Appliquer les remplacements de la fin vers le début pour ne pas
  // décaler les index des remplacements suivants.
  let result = content;
  const sorted = [...findings].sort((a, b) => b.matchIndex - a.matchIndex);

  for (const f of sorted) {
    const quotedLen = f.oldSpec.length + 2; // + 2 guillemets
    const prefix = f.matchText.slice(0, f.matchText.length - quotedLen);
    const newFull = `${prefix}${f.quote}${TARGET_IMPORT}${f.quote}`;

    result =
      result.slice(0, f.matchIndex) +
      newFull +
      result.slice(f.matchIndex + f.matchLength);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const mode = process.argv[2];

  if (mode !== 'check' && mode !== 'fix') {
    console.error('Usage: standardize-prisma-imports.ts <check|fix>');
    process.exit(1);
  }

  const files = walk(SCAN_DIR);
  let totalFindings = 0;
  let filesTouched = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const findings = analyzeFile(file, content);

    if (findings.length === 0) continue;

    filesTouched++;
    totalFindings += findings.length;

    const relPath = file.replace(ROOT + '\\', '').replace(ROOT + '/', '');

    for (const f of findings) {
      console.log(
        `${mode === 'check' ? '[FOUND]' : '[FIXED]'} ${relPath}:${f.line}  '${f.oldSpec}' -> '${TARGET_IMPORT}'`
      );
    }

    if (mode === 'fix') {
      const newContent = applyFix(content, findings);
      writeFileSync(file, newContent, 'utf-8');
    }
  }

  console.log('');
  console.log(`${filesTouched} fichier(s) concerné(s), ${totalFindings} import(s) ${mode === 'check' ? 'à corriger' : 'corrigé(s)'}.`);

  if (mode === 'check' && totalFindings > 0) {
    console.log(`\nLance 'fix' pour corriger automatiquement :`);
    console.log(`  tsx scripts/generate/types/standardize-prisma-imports.ts fix`);
    process.exit(1); // utile pour un check CI
  }
}

main();