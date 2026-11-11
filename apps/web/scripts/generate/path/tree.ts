#!/usr/bin/env ts-node
// scripts/generate/path/tree.ts

import fs from 'fs/promises';
import path from 'path';

/**
 * Génère une arborescence équivalente à `tree <cible> /f` (Windows)
 * et l'écrit dans docs/tree/<nom>.txt
 *
 * Usage (depuis apps/web) :
 *   tsx scripts/generate/path/tree.ts src
 *   tsx scripts/generate/path/tree.ts src/services --name services
 *   tsx scripts/generate/path/tree.ts src --no-files
 *   tsx scripts/generate/path/tree.ts src --ascii
 *   tsx scripts/generate/path/tree.ts src --out docs/autre
 *   tsx scripts/generate/path/tree.ts src --ignore "*.test.ts,__mocks__"
 */

/** Dossiers/fichiers ignorés par défaut (noms exacts) */
const DEFAULT_IGNORE = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  'out',
];

const DEFAULT_OUT_DIR = 'docs/tree';

interface Options {
  target: string;
  outDir: string;
  name?: string;
  withFiles: boolean;
  ascii: boolean;
  ignore: string[];
}

interface Glyphs {
  pipe: string; // "│   "
  tee: string; // "├───"
  last: string; // "└───"
  bar: string; // "│"
  blank: string; // "    "
}

const UNICODE: Glyphs = { pipe: '│   ', tee: '├───', last: '└───', bar: '│', blank: '    ' };
const ASCII: Glyphs = { pipe: '|   ', tee: '+---', last: '\\---', bar: '|', blank: '    ' };

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    target: '',
    outDir: DEFAULT_OUT_DIR,
    withFiles: true,
    ascii: false,
    ignore: [...DEFAULT_IGNORE],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--out':
        opts.outDir = argv[++i];
        break;
      case '--name':
        opts.name = argv[++i];
        break;
      case '--no-files':
        opts.withFiles = false;
        break;
      case '--ascii':
        opts.ascii = true;
        break;
      case '--ignore':
        opts.ignore.push(
          ...(argv[++i] ?? '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        );
        break;
      default:
        if (!arg.startsWith('--') && !opts.target) opts.target = arg;
    }
  }

  return opts;
}

/** Match simple : nom exact ou glob avec `*` */
function isIgnored(name: string, patterns: string[]): boolean {
  return patterns.some(p => {
    if (!p.includes('*')) return p === name;
    const re = new RegExp(
      '^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
    );
    return re.test(name);
  });
}

const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });

/**
 * Construit les lignes de l'arbre au format `tree /f` :
 * fichiers du dossier d'abord, puis sous-dossiers.
 */
async function buildLines(
  dir: string,
  prefix: string,
  opts: Options,
  g: Glyphs,
  lines: string[],
): Promise<void> {
  const entries = (await fs.readdir(dir, { withFileTypes: true }))
    .filter(e => !isIgnored(e.name, opts.ignore))
    .sort((a, b) => collator.compare(a.name, b.name));

  const dirs = entries.filter(e => e.isDirectory());
  const files = opts.withFiles ? entries.filter(e => !e.isDirectory()) : [];
  const hasDirs = dirs.length > 0;

  // Fichiers du dossier courant
  for (const f of files) {
    lines.push(`${prefix}${hasDirs ? g.pipe : g.blank}${f.name}`);
  }
  if (files.length > 0 && hasDirs) lines.push(`${prefix}${g.bar}`);

  // Sous-dossiers
  for (let i = 0; i < dirs.length; i++) {
    const isLast = i === dirs.length - 1;
    const d = dirs[i];
    lines.push(`${prefix}${isLast ? g.last : g.tee}${d.name}`);
    await buildLines(path.join(dir, d.name), prefix + (isLast ? g.blank : g.pipe), opts, g, lines);
    if (!isLast) lines.push(`${prefix}${g.bar}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.target) {
    console.error('❌ Cible manquante. Exemple : tsx scripts/generate/path/tree.ts src');
    process.exit(1);
  }

  // rootDir = où le script est lancé (ex: apps/web) ; sert de base aux chemins relatifs
  const rootDir = process.cwd();
  const targetDir = path.resolve(rootDir, opts.target);

  const stat = await fs.stat(targetDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(`❌ Dossier introuvable : ${targetDir}`);
    process.exit(1);
  }

  const g = opts.ascii ? ASCII : UNICODE;
  const header = path.relative(rootDir, targetDir).replace(/\//g, '\\') || '.';

  const lines: string[] = [header];
  await buildLines(targetDir, '', opts, g, lines);

  // Nom du fichier : --name, sinon dérivé de la cible (apps/web/src -> src ; src/services -> src-services)
  const rel = path.relative(rootDir, targetDir).replace(/\\/g, '/');
  const baseName = opts.name ?? (rel ? rel.replace(/\//g, '-') : path.basename(rootDir));

  const outDir = path.resolve(rootDir, opts.outDir);
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `${baseName}.txt`);

  const content = lines.map(l => l.replace(/\s+$/, '')).join('\n') + '\n';
  await fs.writeFile(outFile, content, 'utf8');

  console.log(`📂 Cible : ${header}`);
  console.log(`✅ Arborescence écrite : ${path.relative(rootDir, outFile).replace(/\\/g, '/')}`);
}

main().catch(err => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});