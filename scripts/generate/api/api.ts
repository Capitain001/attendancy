/**
 * //scripts/generate/api/api.ts
 * api.ts  â€”  RÃ©gime B du skill service-api-index.
 *
 * Usage : tsx scripts/generate/api/api.ts <service-path> [<service-path2> ...]
 * Exemple: tsx scripts/generate/api/api.ts users/profile
 *          tsx scripts/generate/api/api.ts entity
 *
 * Le chemin de service est relatif Ã  src/services/.
 * GÃ©nÃ¨re src/services/<service>/.api/index.json + une fiche par fn exportÃ©e.
 * PrÃ©serve les champs manuels (rules, why_ref, auth) s'ils existent dÃ©jÃ .
 */

import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { ORG_ID_CHECK, PROJECT_LAYOUT } from "./config.js";

// â”€â”€ Chemins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// api.ts vit maintenant sous scripts/generate/api/ (3 niveaux sous la racine).
const ROOT = path.resolve(__dirname, "../../..");

// â”€â”€ Types internes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CacheMeta {
  strategy: "unstable_cache";
  keys: string[];
  tags: string[];
  revalidate: string;
}

interface OrgIdIssue {
  fn: string;
  kind: "error" | "warn";
  message: string;
}

interface ExtractedFn {
  name: string;
  fileRel: string;
  sig: string;
  layer: "db" | "action";
  kind: "query" | "mutation" | "server-action";
  composes: string[];
  calls: string[];
  // depsMap : fn cross-service â†’ service propriÃ©taire (relatif Ã  src/services/)
  depsMap: Record<string, string>;
  cache?: CacheMeta;
  orgIdIssues: OrgIdIssue[];
}

// â”€â”€ Utilitaires â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function relPath(abs: string): string {
  return path.relative(ROOT, abs).replace(/\\/g, "/");
}

function normalizeSpace(s: string): string {
  return (
    s
      .replace(/\s+/g, " ")
      // trailing commas before } or ) : `{ a, b, }` â†’ `{ a, b }`
      .replace(/,(\s*[})])/g, "$1")
      // trailing semicolons before } in type literals : `string; }` â†’ `string }`
      .replace(/;(\s*})/g, "$1")
      .trim()
  );
}

function getGitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT })
      .toString()
      .trim();
  } catch {
    return "manual";
  }
}

function readJsonIfExists<T>(p: string): T | null {
  try {
    let content = fs.readFileSync(p, "utf8");
    // Strip UTF-8 BOM (PowerShell 5.1 Set-Content -Encoding UTF8 writes BOM)
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function writeJson(p: string, data: unknown): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function isExemptFn(fnName: string, fileRel: string): boolean {
  if ((ORG_ID_CHECK.exemptFns as readonly string[]).includes(fnName)) return true;
  if (ORG_ID_CHECK.exemptDirs.some((d) => fileRel.startsWith(d))) return true;
  return false;
}

// DÃ©rivÃ©s de PROJECT_LAYOUT â€” seul config.ts connaÃ®t les noms rÃ©els des dossiers.
const DB_DIR = PROJECT_LAYOUT.dirNames.db;
const ACTIONS_DIR = PROJECT_LAYOUT.dirNames.actions;
const SERVICES_ROOT = PROJECT_LAYOUT.servicesRoot;
const ORG_ID_FIELD = ORG_ID_CHECK.fieldName;

const dbDirRe = new RegExp(`/${DB_DIR}/`);
const dbFileRe = new RegExp(`/${DB_DIR}\\.ts$`);
const actionsDirRe = new RegExp(`/${ACTIONS_DIR}/`);
const servicePathRe = new RegExp(
  `/${SERVICES_ROOT.replace(/\//g, "\\/")}\\/(.+?)\\/(${DB_DIR}\\/|${DB_DIR}\\.ts|${ACTIONS_DIR}\\/|${ACTIONS_DIR}\\.ts)`,
);

/** Extrait le chemin de service (relatif Ã  src/services/) depuis le fichier dÃ©clarÃ© d'une fn. */
function declFileToServicePath(declFile: string): string | null {
  const n = declFile.replace(/\\/g, "/");
  const m = n.match(servicePathRe);
  return m ? m[1] : null;
}

// Fichier d'une fn d'un service = fichier dans database/ ou database.ts = couche db
function isDbFile(absOrRel: string): boolean {
  const n = absOrRel.replace(/\\/g, "/");
  return dbDirRe.test(n) || dbFileRe.test(n);
}

// Fichier d'action = actions.ts (fichier unique) OU dossier actions/ (barrel)
function isActionsFile(absOrRel: string): boolean {
  const n = absOrRel.replace(/\\/g, "/");
  return actionsDirRe.test(n) || n.endsWith(`/${ACTIONS_DIR}.ts`);
}

// â”€â”€ CrÃ©ation du programme TypeScript â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeProgram(rootFiles: string[]): ts.Program {
  const opts: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.CommonJS,
    // Node10 = rÃ©solution classique Node â€” compatible standalone, gÃ¨re baseUrl+paths
    moduleResolution: ts.ModuleResolutionKind.Node10,
    strict: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    baseUrl: path.resolve(ROOT, PROJECT_LAYOUT.pathAlias.baseUrl),
    // PROJECT_LAYOUT est `as const` (tuples readonly) â€” ts.CompilerOptions.paths
    // attend des string[] mutables, d'oÃ¹ la recopie explicite par alias.
    paths: Object.fromEntries(
      Object.entries(PROJECT_LAYOUT.pathAlias.paths).map(([alias, targets]) => [
        alias,
        [...targets],
      ]),
    ) as Record<string, string[]>,
    skipLibCheck: true,
    noEmit: true,
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
  };
  return ts.createProgram(rootFiles, opts);
}

// â”€â”€ Extraction de signature â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extractSig(
  node: ts.FunctionDeclaration,
  sf: ts.SourceFile,
  checker: ts.TypeChecker
): string {
  const params = node.parameters
    .map((p) => normalizeSpace(p.getText(sf)))
    .join(", ");

  let ret: string;
  if (node.type) {
    ret = normalizeSpace(node.type.getText(sf));
  } else {
    // InfÃ©rÃ© : utiliser le type checker
    const type = checker.getTypeAtLocation(node);
    const sigs = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    if (sigs.length > 0) {
      const rType = checker.getReturnTypeOfSignature(sigs[0]);
      ret = checker.typeToString(rType);
    } else {
      ret = "unknown";
    }
  }

  return `(${params}) => ${ret}`;
}

// â”€â”€ DÃ©tection unstable_cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extractCache(body: ts.Block, sf: ts.SourceFile): CacheMeta | undefined {
  let found: CacheMeta | undefined;

  function visit(node: ts.Node): void {
    if (found) return;
    // Chercher: unstable_cache(fn, keys, options)()
    if (
      ts.isCallExpression(node) &&
      ts.isCallExpression(node.expression)
    ) {
      const inner = node.expression;
      const calleeName =
        ts.isIdentifier(inner.expression) ? inner.expression.text : "";
      if (calleeName === "unstable_cache" && inner.arguments.length >= 3) {
        const keysArg = inner.arguments[1];
        const optsArg = inner.arguments[2];
        const keys: string[] = [];
        const tags: string[] = [];
        let revalidate = "300";

        if (ts.isArrayLiteralExpression(keysArg)) {
          for (const el of keysArg.elements) {
            // Garder la reprÃ©sentation brute (variables, strings)
            keys.push(normalizeSpace(el.getText(sf)).replace(/^["']|["']$/g, ""));
          }
        }
        if (ts.isObjectLiteralExpression(optsArg)) {
          for (const prop of optsArg.properties) {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
            const k = prop.name.text;
            if (k === "revalidate" && ts.isNumericLiteral(prop.initializer)) {
              revalidate = prop.initializer.text;
            } else if (k === "tags" && ts.isArrayLiteralExpression(prop.initializer)) {
              for (const el of prop.initializer.elements) {
                tags.push(normalizeSpace(el.getText(sf)));
              }
            }
          }
        }
        found = { strategy: "unstable_cache", keys, tags, revalidate };
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(body, visit);
  return found;
}

// â”€â”€ RÃ©solution des noms exportÃ©s d'un fichier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function exportedNames(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  ts.forEachChild(sf, (node) => {
    const isExp = (n: ts.Node) =>
      (n as ts.FunctionDeclaration).modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );
    if (ts.isFunctionDeclaration(node) && node.name && isExp(node)) {
      names.add(node.name.text);
    } else if (ts.isVariableStatement(node) && isExp(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) names.add(d.name.text);
      }
    }
  });
  return names;
}

// â”€â”€ Collecte des appels sortants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface OutgoingRef {
  name: string;
  ownerService: string | null; // null = mÃªme service ou inconnu
}

function collectOutgoing(
  fn: ts.FunctionDeclaration,
  layer: "db" | "action",
  sf: ts.SourceFile,
  checker: ts.TypeChecker,
  localExported: Set<string>,
  currentServicePath: string
): OutgoingRef[] {
  const calls = new Map<string, OutgoingRef>(); // dÃ©doublonnage par name
  const currentFile = sf.fileName.replace(/\\/g, "/");

  function resolveCall(expr: ts.Expression): OutgoingRef | null {
    let sym = checker.getSymbolAtLocation(expr);
    if (!sym) return null;
    if (sym.flags & ts.SymbolFlags.Alias) {
      try { sym = checker.getAliasedSymbol(sym); } catch { return null; }
    }

    const decl = sym.valueDeclaration ?? sym.declarations?.[0];
    if (!decl) return null;

    const declFile = decl.getSourceFile().fileName.replace(/\\/g, "/");

    if (declFile.includes("/node_modules/")) return null;
    if (!declFile.includes(`/${SERVICES_ROOT}/`)) return null;

    // Helper local non exportÃ© â†’ exclure (Â§6)
    if (declFile === currentFile && !localExported.has(sym.getName())) return null;

    if (layer === "db") {
      if (!isDbFile(declFile)) return null;
    } else {
      if (!isDbFile(declFile) && !isActionsFile(declFile)) return null;
    }

    const name = sym.getName();
    const ownerService = declFileToServicePath(declFile);
    // Null si mÃªme service ou non dÃ©ductible
    const isSameService = ownerService === currentServicePath;
    return { name, ownerService: isSameService ? null : ownerService };
  }

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      if (ts.isIdentifier(expr)) {
        const ref = resolveCall(expr);
        if (ref && !calls.has(ref.name)) calls.set(ref.name, ref);
      } else if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression;
        if (
          ts.isPropertyAccessExpression(obj) &&
          ts.isIdentifier(obj.expression) &&
          obj.expression.text === "prisma"
        ) {
          // prisma call â€” skip
        } else {
          const ref = resolveCall(expr.name);
          if (ref && !calls.has(ref.name)) calls.set(ref.name, ref);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  if (fn.body) ts.forEachChild(fn.body, visit);
  return [...calls.values()];
}

// â”€â”€ Assertion orgId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PRISMA_READ_METHODS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "findFirstOrThrow",
  "findUniqueOrThrow",
  "aggregate",
  "count",
  "groupBy",
]);

function findOrgIdAnywhere(node: ts.Node): boolean {
  // Chercher un identifiant ou une propriÃ©tÃ© nommÃ©e d'aprÃ¨s ORG_ID_FIELD
  if (ts.isIdentifier(node) && node.text === ORG_ID_FIELD) return true;
  let found = false;
  ts.forEachChild(node, (c) => { if (!found) found = findOrgIdAnywhere(c); });
  return found;
}

function whereOrgIdStatus(
  callExpr: ts.CallExpression
): "present" | "nested" | "absent" {
  if (!callExpr.arguments.length) return "absent";
  const opts = callExpr.arguments[0];
  if (!ts.isObjectLiteralExpression(opts)) return "absent";

  const whereProp = opts.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === "where"
  ) as ts.PropertyAssignment | undefined;

  if (!whereProp) return "absent";
  const whereVal = whereProp.initializer;
  if (!ts.isObjectLiteralExpression(whereVal)) return "absent";

  // Champ de scope en racine ? â€” gÃ©rer les deux formes : `orgId: x`
  // (PropertyAssignment) et `{ orgId }` shorthand (ShorthandPropertyAssignment)
  const atRoot = whereVal.properties.some(
    (p) =>
      (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === ORG_ID_FIELD) ||
      (ts.isShorthandPropertyAssignment(p) && p.name.text === ORG_ID_FIELD)
  );
  if (atRoot) return "present";

  // Champ de scope quelque part dans toute la structure de l'appel (select/include/relations)
  return findOrgIdAnywhere(opts) ? "nested" : "absent";
}

function checkOrgId(
  fn: ts.FunctionDeclaration,
  fnName: string,
  fileRel: string
): OrgIdIssue[] {
  if (!ORG_ID_CHECK.enabled) return [];
  if (isExemptFn(fnName, fileRel) || !fn.body) return [];
  const field = ORG_ID_FIELD;
  const issues: OrgIdIssue[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const method = node.expression.name.text;
      if (
        PRISMA_READ_METHODS.has(method) &&
        ts.isPropertyAccessExpression(node.expression.expression)
      ) {
        const modelAccess = node.expression.expression;
        if (
          ts.isIdentifier(modelAccess.expression) &&
          modelAccess.expression.text === "prisma"
        ) {
          const model = modelAccess.name.text;

          // Exempter les modÃ¨les globaux (User, etc.)
          if ((ORG_ID_CHECK.globalModels as readonly string[]).includes(model)) {
            ts.forEachChild(node, visit);
            return;
          }

          const isProfileModel = (ORG_ID_CHECK.profileModels as readonly string[]).includes(model);
          const status = whereOrgIdStatus(node);

          if (status === "absent") {
            issues.push({
              fn: fnName,
              kind: "warn",
              message: isProfileModel
                ? ORG_ID_CHECK.messages.absentProfile(model, method, field)
                : ORG_ID_CHECK.messages.absent(model, method, field),
            });
          } else if (status === "nested") {
            issues.push({
              fn: fnName,
              kind: "warn",
              message: isProfileModel
                ? ORG_ID_CHECK.messages.nestedProfile(model, method, field)
                : ORG_ID_CHECK.messages.nested(model, method, field),
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(fn.body, visit);
  return issues;
}

// â”€â”€ Extraction des fns d'un fichier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extractFile(
  sf: ts.SourceFile,
  checker: ts.TypeChecker,
  layer: "db" | "action",
  currentServicePath: string
): ExtractedFn[] {
  const results: ExtractedFn[] = [];
  const fileRel = relPath(sf.fileName);
  const localExp = exportedNames(sf);

  ts.forEachChild(sf, (node) => {
    if (!ts.isFunctionDeclaration(node) || !node.name) return;
    const isExp = node.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword
    );
    if (!isExp) return;

    const name = node.name.text;
    const sig = extractSig(node, sf, checker);
    const outgoing = collectOutgoing(node, layer, sf, checker, localExp, currentServicePath);
    const cache = layer === "db" && node.body ? extractCache(node.body, sf) : undefined;
    const orgIdIssues = checkOrgId(node, name, fileRel);

    const kind: "query" | "mutation" | "server-action" =
      layer === "action"
        ? "server-action"
        : fileRel.includes(".mutations.")
        ? "mutation"
        : "query";

    // Noms seuls pour les champs JSON
    const outgoingNames = outgoing.map((r) => r.name);
    // depsMap : fn cross-service â†’ service propriÃ©taire (ownerService non null)
    const depsMap: Record<string, string> = {};
    for (const ref of outgoing) {
      if (ref.ownerService) depsMap[ref.name] = ref.ownerService;
    }

    results.push({
      name,
      fileRel,
      sig,
      layer,
      kind,
      composes: layer === "db" ? outgoingNames : [],
      calls: layer === "action" ? outgoingNames : [],
      depsMap,
      cache,
      orgIdIssues,
    });
  });

  return results;
}

// â”€â”€ Collecte des fichiers d'un service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ServiceFiles {
  serviceAbs: string;
  apiDir: string;
  rootFiles: string[];
  actionFileSet: Set<string>;
}

/** Collecte les fichiers db/actions d'un service (sans crÃ©er de programme TS). */
function collectServiceFiles(servicePath: string): ServiceFiles | null {
  const serviceAbs = path.join(ROOT, SERVICES_ROOT, servicePath);
  const apiDir = path.join(serviceAbs, ".api");

  if (!fs.existsSync(serviceAbs)) {
    console.error(`  âœ— Service introuvable : ${serviceAbs}`);
    return null;
  }

  const isSourceFile = (f: string) =>
    f.endsWith(".ts") &&
    !f.endsWith(".test.ts") &&
    !f.endsWith(".spec.ts") &&
    f !== "index.ts";

  const rootFiles: string[] = [];
  const dbDir = path.join(serviceAbs, DB_DIR);
  if (fs.existsSync(dbDir)) {
    fs
      .readdirSync(dbDir)
      .filter(isSourceFile)
      .forEach((f) => rootFiles.push(path.join(dbDir, f)));
  }
  // Fallback : <DB_DIR>.ts directement dans le rÃ©pertoire service
  const dbTs = path.join(serviceAbs, `${DB_DIR}.ts`);
  if (!rootFiles.length && fs.existsSync(dbTs)) rootFiles.push(dbTs);

  // Couche action : dossier actions/ (barrel, symÃ©trique Ã  database/) OU actions.ts.
  const actionFileSet = new Set<string>();
  const actionsDir = path.join(serviceAbs, ACTIONS_DIR);
  if (fs.existsSync(actionsDir) && fs.statSync(actionsDir).isDirectory()) {
    fs
      .readdirSync(actionsDir)
      .filter(isSourceFile)
      .forEach((f) => {
        const abs = path.join(actionsDir, f);
        rootFiles.push(abs);
        actionFileSet.add(abs);
      });
  }
  const actionsTs = path.join(serviceAbs, `${ACTIONS_DIR}.ts`);
  if (fs.existsSync(actionsTs)) {
    rootFiles.push(actionsTs);
    actionFileSet.add(actionsTs);
  }

  return { serviceAbs, apiDir, rootFiles, actionFileSet };
}

// â”€â”€ GÃ©nÃ©ration d'un service (programme TS PARTAGÃ‰) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * GÃ©nÃ¨re les index .api/ d'un service Ã  partir d'un `ts.Program` **partagÃ©** par
 * tous les services touchÃ©s. Crucial pour la perf : les libs (lib.es*.d.ts) et
 * `@prisma/client` ne sont parsÃ©es/type-checkÃ©es qu'une seule fois, au lieu d'un
 * Program (et donc d'un re-parse complet) par service.
 */
function generateServiceFromProgram(
  servicePath: string,
  files: ServiceFiles,
  program: ts.Program,
  checker: ts.TypeChecker,
  sha: string,
): boolean {
  const { apiDir, rootFiles, actionFileSet } = files;

  console.log(`\nâ”€â”€ ${servicePath} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`);
  console.log(`  Fichiers : ${rootFiles.map(relPath).join(", ")}`);

  // Extraire toutes les fns
  const allFns: ExtractedFn[] = [];
  const errors: OrgIdIssue[] = [];
  const warns: OrgIdIssue[] = [];

  for (const f of rootFiles) {
    const sf = program.getSourceFile(f);
    if (!sf) { console.warn(`  âš  Impossible de lire : ${relPath(f)}`); continue; }
    const layer: "db" | "action" = actionFileSet.has(f) ? "action" : "db";
    const fns = extractFile(sf, checker, layer, servicePath);
    allFns.push(...fns);
    for (const fn of fns) {
      for (const issue of fn.orgIdIssues) {
        (issue.kind === "error" ? errors : warns).push(issue);
      }
    }
  }

  // Afficher tous les avertissements orgId (non bloquants)
  const allIssues = [...warns, ...errors];
  for (const w of allIssues) {
    console.warn(`  âš  WARN [${w.fn}] ${w.message}`);
  }

  // Construire edges par inversion des arÃªtes sortantes
  const edges: Record<string, string[]> = {};
  for (const fn of allFns) edges[fn.name] = [];
  for (const fn of allFns) {
    const outgoing = [...fn.composes, ...fn.calls];
    for (const target of outgoing) {
      if (!edges[target]) edges[target] = [];
      if (!edges[target].includes(fn.name)) edges[target].push(fn.name);
    }
  }

  // AgrÃ©ger deps cross-service (fn â†’ service propriÃ©taire)
  const deps: Record<string, string> = {};
  for (const fn of allFns) {
    Object.assign(deps, fn.depsMap);
  }

  // Ã‰crire index.json
  const fns: Record<string, { f: string; layer: string; kind: string }> = {};
  for (const fn of allFns) {
    fns[fn.name] = { f: `.api/${fn.name}.json`, layer: fn.layer, kind: fn.kind };
  }

  writeJson(path.join(apiDir, "index.json"), {
    service: servicePath,
    path: `${SERVICES_ROOT}/${servicePath}/`,
    claude_md: "./CLAUDE.md",
    derived_at: sha,
    utils_dir: null,
    fns,
    edges,
    deps, // fn cross-service â†’ service propriÃ©taire, pour --check
  });
  console.log(`  âœ“ index.json  (${allFns.length} fns)`);

  // Ã‰crire les fiches individuelles
  for (const fn of allFns) {
    const fichePath = path.join(apiDir, `${fn.name}.json`);
    const existing = readJsonIfExists<Record<string, unknown>>(fichePath);

    // Champs dÃ©rivÃ©s
    const derived: Record<string, unknown> = {
      name: fn.name,
      file: fn.fileRel,
      sig: fn.sig,
    };
    if (fn.layer === "db") {
      if (fn.cache) derived.cache = fn.cache;
      derived.composes = fn.composes;
    } else {
      derived.calls = fn.calls;
    }

    // Champs manuels : prÃ©server si existants, initialiser vides sinon
    const manual: Record<string, unknown> =
      fn.layer === "db"
        ? {
            rules: existing?.rules ?? [],
            why_ref: existing?.why_ref ?? "",
          }
        : {
            auth: existing?.auth ?? {},
            rules: existing?.rules ?? [],
            why_ref: existing?.why_ref ?? "",
          };

    writeJson(fichePath, { ...derived, ...manual });
    console.log(`  âœ“ ${fn.name}.json`);
  }

  return true;
}

// â”€â”€ Check cross-service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface IndexJson {
  service: string;
  fns: Record<string, { f: string; layer: string; kind: string }>;
  edges: Record<string, string[]>;
  deps?: Record<string, string>; // fn cross-service â†’ service propriÃ©taire
}

interface FicheJson {
  name: string;
  composes?: string[];
  calls?: string[];
}

/** Trouve rÃ©cursivement tous les index.json sous src/services/ */
function findAllIndexFiles(
  servicesDir: string
): Array<{ servicePath: string; indexPath: string; index: IndexJson }> {
  const results: Array<{ servicePath: string; indexPath: string; index: IndexJson }> = [];

  function walk(dir: string): void {
    let names: string[];
    try { names = fs.readdirSync(dir); }
    catch { return; }

    for (const name of names) {
      const fullPath = path.join(dir, name);
      let isDir: boolean;
      try { isDir = fs.statSync(fullPath).isDirectory(); } catch { continue; }
      if (!isDir) continue;
      if (name === "node_modules") continue;

      if (name === ".api") {
        const indexPath = path.join(fullPath, "index.json");
        const index = readJsonIfExists<IndexJson>(indexPath);
        if (index) {
          const servicePath = path.relative(servicesDir, dir).replace(/\\/g, "/");
          results.push({ servicePath, indexPath, index });
        }
        // ne pas descendre dans .api/
      } else {
        walk(fullPath);
      }
    }
  }

  walk(servicesDir);
  return results;
}

type EdgeState =
  | { status: "validated"; service: string; fn: string; ownerService: string }
  | { status: "unverified"; service: string; fn: string; ownerService: string }
  | { status: "dead_reference"; service: string; context: string; fn: string; ownerService: string };

async function checkCrossService(): Promise<boolean> {
  const servicesDir = path.join(ROOT, SERVICES_ROOT);
  const all = findAllIndexFiles(servicesDir);

  if (!all.length) {
    console.log("  Aucun index .api/ trouvÃ©.");
    return true;
  }

  // Table : servicePath â†’ Set<fnName> (uniquement services indexÃ©s)
  const indexedServices = new Map<string, Set<string>>();
  for (const { servicePath, index } of all) {
    indexedServices.set(servicePath, new Set(Object.keys(index.fns)));
  }

  const validated: EdgeState[] = [];
  const unverified: EdgeState[] = [];
  const dead: EdgeState[] = [];

  for (const { servicePath, indexPath, index } of all) {
    const apiDir = path.dirname(indexPath);
    const deps = index.deps ?? {};

    for (const [fnName, ownerService] of Object.entries(deps)) {
      const ownerFns = indexedServices.get(ownerService);

      if (!ownerFns) {
        // Owner non indexÃ© â†’ unverified, non bloquant
        unverified.push({ status: "unverified", service: servicePath, fn: fnName, ownerService });
        continue;
      }

      if (ownerFns.has(fnName)) {
        // Owner indexÃ© + fn prÃ©sente â†’ validated
        validated.push({ status: "validated", service: servicePath, fn: fnName, ownerService });
      } else {
        // Owner indexÃ© + fn absente â†’ dead_reference, bloquant
        let context = "deps";
        for (const [caller, entry] of Object.entries(index.fns)) {
          const fichePath = path.join(apiDir, path.basename(entry.f));
          const fiche = readJsonIfExists<FicheJson>(fichePath);
          if (!fiche) continue;
          if (fiche.composes?.includes(fnName) || fiche.calls?.includes(fnName)) {
            context = caller;
            break;
          }
        }
        dead.push({ status: "dead_reference", service: servicePath, context, fn: fnName, ownerService });
      }
    }
  }

  // Afficher unverified (non bloquant)
  if (unverified.length) {
    console.log(`\n  âš  ${unverified.length} arÃªte(s) non vÃ©rifiable(s) (service cible non indexÃ©) :`);
    for (const u of unverified) {
      console.log(`    [${u.service}] "${u.fn}" â†’ ${u.ownerService} (unverified â€” skip)`);
    }
  }

  if (dead.length) {
    console.error(`\nâœ— ${dead.length} rÃ©fÃ©rence(s) cross-service morte(s) :\n`);
    for (const d of dead) {
      if (d.status !== "dead_reference") continue;
      console.error(`  [${d.service}] ${d.context} â†’ "${d.fn}" (service: ${d.ownerService})`);
      console.error(`    â†’ "${d.fn}" introuvable dans ${d.ownerService}/.api/index.json`);
      console.error(`    â†’ RÃ©gÃ©nÃ©rer: tsx scripts/generate/api/api.ts ${d.service}`);
    }
    return false;
  }

  const totalFns = [...indexedServices.values()].reduce((s, v) => s + v.size, 0);
  console.log(
    `\nâœ“ check cross-service : graphe cohÃ©rent` +
    ` (${totalFns} fns, ${all.length} services indexÃ©s` +
    ` | ${validated.length} validated, ${unverified.length} unverified)`
  );
  return true;
}

// â”€â”€ Point d'entrÃ©e â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Mode --check : valide la cohÃ©rence cross-service, ne gÃ©nÃ¨re rien
  if (args[0] === "--check") {
    console.log("\napi --check");
    const ok = await checkCrossService();
    process.exit(ok ? 0 : 1);
  }

  if (!args.length) {
    console.error("Usage:");
    console.error("  tsx scripts/generate/api/api.ts <service-path> [...]   # gÃ©nÃ©rer");
    console.error("  tsx scripts/generate/api/api.ts --check                 # valider le graphe");
    process.exit(1);
  }

  const sha = getGitSha();
  console.log(`\napi  derived_at=${sha}`);

  // Collecter les fichiers de TOUS les services AVANT de crÃ©er le programme :
  // on ne crÃ©e qu'UN SEUL ts.Program partagÃ© â†’ libs + @prisma/client parsÃ©es une
  // seule fois (le re-parse par service Ã©tait le gros coÃ»t).
  const planned: Array<{ svc: string; files: ServiceFiles }> = [];
  const allRootFiles = new Set<string>();

  for (const svc of args) {
    const files = collectServiceFiles(svc);
    if (!files) process.exit(1);
    if (!files.rootFiles.length) {
      console.warn(`\nâ”€â”€ ${svc} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`);
      console.warn(`  âš  Aucun fichier trouvÃ© pour ${svc}`);
      continue;
    }
    planned.push({ svc, files });
    for (const f of files.rootFiles) allRootFiles.add(f);
  }

  if (!planned.length) {
    console.log("\nâœ“ GÃ©nÃ©ration terminÃ©e (rien Ã  indexer)");
    return;
  }

  const program = makeProgram([...allRootFiles]);
  const checker = program.getTypeChecker();

  for (const { svc, files } of planned) {
    const ok = generateServiceFromProgram(svc, files, program, checker, sha);
    if (!ok) process.exit(1);
  }

  console.log("\nâœ“ GÃ©nÃ©ration terminÃ©e");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});