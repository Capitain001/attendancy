#!/usr/bin/env ts-node

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

/**
 * Extensions de fichiers à traiter (fichiers texte source)
 */
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss', '.html', '.vue', '.svelte'];

/**
 * Dossiers à ignorer (pattern glob)
 */
const IGNORE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.git/**',
  'coverage/**',
  '.next/**',
  '.nuxt/**',
  'out/**',
];

/**
 * Ajoute le commentaire de chemin relatif en première ligne d'un fichier
 */
async function addPathComment(filePath: string, rootDir: string): Promise<void> {
  const relativePath = path.relative(rootDir, filePath);
  const commentLine = `//${relativePath}`;

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    // Si la première ligne est déjà le commentaire attendu, on ne fait rien
    if (lines.length > 0 && lines[0].trim() === commentLine) {
      console.log(`⏭️  Déjà présent : ${relativePath}`);
      return;
    }

    // Préserver un éventuel shebang (ex: #!/usr/bin/env node)
    let newContent = '';
    let shebang = '';
    let startIndex = 0;
    if (lines.length > 0 && lines[0].startsWith('#!')) {
      shebang = lines[0] + '\n';
      startIndex = 1;
    }

    // Insérer le commentaire après le shebang, ou en première ligne
    const rest = lines.slice(startIndex).join('\n');
    newContent = shebang + commentLine + '\n' + rest;

    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`✅ Ajouté : ${relativePath}`);
  } catch (err) {
    console.error(`❌ Erreur sur ${relativePath} :`, err);
  }
}

/**
 * Trouve tous les fichiers correspondant aux extensions, dans le dossier donné
 */
async function findFiles(rootDir: string): Promise<string[]> {
  const patterns = EXTENSIONS.map(ext => `**/*${ext}`);
  const ignore = IGNORE_PATTERNS;

  const files = await glob(patterns, {
    cwd: rootDir,
    ignore,
    absolute: true,
    nodir: true,
  });

  return files;
}

async function main() {
  const rootDir = process.argv[2] || process.cwd();
  console.log(`📂 Dossier racine : ${rootDir}`);

  const files = await findFiles(rootDir);
  console.log(`📄 ${files.length} fichier(s) trouvé(s).`);

  for (const file of files) {
    await addPathComment(file, rootDir);
  }
}

main().catch(err => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});