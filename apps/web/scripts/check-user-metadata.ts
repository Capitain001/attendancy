import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import * as ts from "typescript";

type MetadataStore = "user_metadata" | "app_metadata";

type Finding = {
  file: string;
  line: number;
  column: number;
  store: MetadataStore;
  key: string;
  message: string;
  operation: "lecture" | "écriture";
};

type WriteSite = {
  file: string;
  line: number;
  method: string;
  store: MetadataStore;
  keys: string[];
  indirectSources: string[];
};

const repositoryRoot = resolve(process.cwd(), "../..");
const metadataTypesPath = resolve(repositoryRoot, "apps/web/src/types/user.ts");
const sourceRoots = [
  resolve(repositoryRoot, "apps/web/src"),
  resolve(repositoryRoot, "apps/desktop/src"),
  resolve(repositoryRoot, "packages/ui/src"),
];

function unwrapExpression(node: ts.Expression): ts.Expression {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    return unwrapExpression(node.expression);
  }
  return node;
}

function readKeySet(
  source: ts.SourceFile,
  declarationName: string,
): Set<string> {
  let declaration: ts.VariableDeclaration | undefined;

  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName
    ) {
      declaration = node;
    }
    ts.forEachChild(node, visit);
  }

  visit(source);

  if (!declaration?.initializer) {
    throw new Error(
      `Déclaration ${declarationName} introuvable dans ${metadataTypesPath}`,
    );
  }

  const initializer = unwrapExpression(declaration.initializer);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(
      `${declarationName} doit être un tableau de clés littérales`,
    );
  }

  return new Set(
    initializer.elements.flatMap((element) =>
      ts.isStringLiteral(element) ? [element.text] : [],
    ),
  );
}

function propertyName(
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (
    node.argumentExpression &&
    ts.isStringLiteralLike(node.argumentExpression)
  ) {
    return node.argumentExpression.text;
  }
  return undefined;
}

function objectProperty(
  object: ts.Expression,
  key: string,
): ts.Expression | undefined {
  const expression = unwrapExpression(object);
  if (!ts.isObjectLiteralExpression(expression)) return undefined;

  const property = expression.properties.find(
    (item) =>
      (ts.isPropertyAssignment(item) ||
        ts.isShorthandPropertyAssignment(item)) &&
      (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) &&
      item.name.text === key,
  );

  if (property && ts.isPropertyAssignment(property)) {
    return property.initializer;
  }
  if (property && ts.isShorthandPropertyAssignment(property)) {
    return property.name;
  }
  return undefined;
}

function callName(node: ts.CallExpression): string | undefined {
  return ts.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : undefined;
}

function metadataStoreFromAccess(node: ts.Node): MetadataStore | undefined {
  if (
    (ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)) &&
    (propertyName(node) === "user_metadata" ||
      propertyName(node) === "app_metadata")
  ) {
    return propertyName(node) as MetadataStore;
  }

  let found: MetadataStore | undefined;
  ts.forEachChild(node, (child) => {
    found ??= metadataStoreFromAccess(child);
  });
  return found;
}

function directMetadataStore(node: ts.Expression): MetadataStore | undefined {
  const expression = unwrapExpression(node);
  if (
    (ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)) &&
    (propertyName(expression) === "user_metadata" ||
      propertyName(expression) === "app_metadata")
  ) {
    return propertyName(expression) as MetadataStore;
  }
  return undefined;
}

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "generated" ||
        entry.name === ".next"
      ) {
        return [];
      }
      return sourceFiles(path);
    }
    return /\.(?:ts|tsx|js|jsx|mts|mjs)$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
      ? [path]
      : [];
  });
}

function classifyKey(
  store: MetadataStore,
  key: string,
  userKeys: Set<string>,
  appKeys: Set<string>,
): string | undefined {
  const belongsToUser = userKeys.has(key);
  const belongsToApp = appKeys.has(key);

  if (!belongsToUser && !belongsToApp) {
    return `clé absente de USER_METADATA_KEYS et APP_METADATA_KEYS`;
  }
  if (belongsToUser && belongsToApp) {
    return `clé déclarée dans les deux ensembles`;
  }
  if (store === "user_metadata" && belongsToApp) {
    return `clé d'accès : lecture attendue dans app_metadata`;
  }
  if (store === "app_metadata" && belongsToUser) {
    return `clé de profil : lecture attendue dans user_metadata`;
  }
  return undefined;
}

function auditFile(
  filePath: string,
  userKeys: Set<string>,
  appKeys: Set<string>,
): { findings: Finding[]; writes: WriteSite[] } {
  const text = readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const aliases = new Map<string, MetadataStore>();
  const findings: Finding[] = [];

  function addFinding(node: ts.Node, store: MetadataStore, key: string) {
    const message = classifyKey(store, key, userKeys, appKeys);
    if (!message) return;

    const position = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    findings.push({
      file: relative(repositoryRoot, filePath).replaceAll("\\", "/"),
      line: position.line + 1,
      column: position.character + 1,
      store,
      key,
      message,
      operation: "lecture",
    });
  }

  function collectAliases(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const store = metadataStoreFromAccess(node.initializer);
      if (store && ts.isIdentifier(node.name)) {
        aliases.set(node.name.text, store);
      } else if (store && ts.isObjectBindingPattern(node.name)) {
        for (const element of node.name.elements) {
          const key = element.propertyName
            ? ts.isIdentifier(element.propertyName) ||
              ts.isStringLiteral(element.propertyName)
              ? element.propertyName.text
              : undefined
            : ts.isIdentifier(element.name)
              ? element.name.text
              : undefined;
          if (key) addFinding(element, store, key);
        }
      }
    }
    ts.forEachChild(node, collectAliases);
  }

  collectAliases(source);

  function inspectReads(node: ts.Node) {
    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const key = propertyName(node);
      const store =
        directMetadataStore(node.expression) ??
        (ts.isIdentifier(node.expression)
          ? aliases.get(node.expression.text)
          : undefined);

      if (store && key) addFinding(node, store, key);
    }
    ts.forEachChild(node, inspectReads);
  }

  inspectReads(source);

  const writes: WriteSite[] = [];

  function addWrite(
    call: ts.CallExpression,
    store: MetadataStore,
    payload: ts.Expression | undefined,
  ) {
    const position = source.getLineAndCharacterOfPosition(
      call.getStart(source),
    );
    const site: WriteSite = {
      file: relative(repositoryRoot, filePath).replaceAll("\\", "/"),
      line: position.line + 1,
      method: callName(call) ?? "appel Auth",
      store,
      keys: [],
      indirectSources: [],
    };

    const expression = payload && unwrapExpression(payload);
    if (expression && ts.isObjectLiteralExpression(expression)) {
      for (const property of expression.properties) {
        if (ts.isSpreadAssignment(property)) {
          site.indirectSources.push(property.expression.getText(source));
          continue;
        }

        const key =
          (ts.isPropertyAssignment(property) ||
            ts.isShorthandPropertyAssignment(property)) &&
          (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
            ? property.name.text
            : undefined;

        if (!key) continue;
        site.keys.push(key);
        const message = classifyKey(store, key, userKeys, appKeys);
        if (message) {
          const keyPosition = source.getLineAndCharacterOfPosition(
            property.getStart(source),
          );
          findings.push({
            file: site.file,
            line: keyPosition.line + 1,
            column: keyPosition.character + 1,
            store,
            key,
            message,
            operation: "écriture",
          });
        }
      }
    } else if (expression) {
      site.indirectSources.push(expression.getText(source));
    } else {
      site.indirectSources.push("payload non résolu");
    }

    writes.push(site);
  }

  function inspectWrites(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const method = callName(node);
      const firstArgument = node.arguments[0];
      const secondArgument = node.arguments[1];

      if (method === "updateUserById" && secondArgument) {
        for (const store of ["user_metadata", "app_metadata"] as const) {
          const payload = objectProperty(secondArgument, store);
          if (payload) addWrite(node, store, payload);
        }
      } else if (method === "updateUser" && firstArgument) {
        const payload = objectProperty(firstArgument, "data");
        if (payload) addWrite(node, "user_metadata", payload);
      } else if (
        method === "signUp" &&
        firstArgument &&
        objectProperty(firstArgument, "options")
      ) {
        const options = objectProperty(firstArgument, "options")!;
        const payload = objectProperty(options, "data");
        if (payload) addWrite(node, "user_metadata", payload);
      } else if (method === "inviteUserByEmail" && secondArgument) {
        const payload = objectProperty(secondArgument, "data");
        if (payload) addWrite(node, "user_metadata", payload);
      } else if (method === "generateLink" && firstArgument) {
        const options = objectProperty(firstArgument, "options");
        const payload = options && objectProperty(options, "data");
        if (payload) addWrite(node, "user_metadata", payload);
      }
    }

    ts.forEachChild(node, inspectWrites);
  }

  inspectWrites(source);
  return { findings, writes };
}

function main() {
  const metadataSource = ts.createSourceFile(
    metadataTypesPath,
    readFileSync(metadataTypesPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const userKeys = readKeySet(metadataSource, "USER_METADATA_KEYS");
  const appKeys = readKeySet(metadataSource, "APP_METADATA_KEYS");
  const overlap = [...userKeys].filter((key) => appKeys.has(key));

  if (overlap.length > 0) {
    throw new Error(
      `Clés présentes dans les deux ensembles : ${overlap.join(", ")}`,
    );
  }

  const audits = sourceRoots
    .flatMap(sourceFiles)
    .map((file) => auditFile(file, userKeys, appKeys));
  const findings = audits
    .flatMap((audit) => audit.findings)
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.column - right.column,
    );
  const writes = audits
    .flatMap((audit) => audit.writes)
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.store.localeCompare(right.store),
    );

  console.log(
    `Audit user_metadata/app_metadata : ${userKeys.size} clés profil, ${appKeys.size} clés d'accès.`,
  );

  console.log(`\nÉcritures Supabase Auth détectées : ${writes.length}.`);
  for (const write of writes) {
    const keys =
      write.keys.length > 0 ? write.keys.join(", ") : "aucune clé inline";
    const indirect =
      write.indirectSources.length > 0
        ? `; sources indirectes à vérifier : ${write.indirectSources.join(", ")}`
        : "";
    console.log(
      `${write.file}:${write.line} ${write.method} → ${write.store} ` +
        `[${keys}]${indirect}`,
    );
  }

  if (findings.length === 0) {
    console.log("\nAucune clé explicitement mal classée ou non déclarée.");
    return;
  }

  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line}:${finding.column} ` +
        `${finding.operation} ${finding.store}.${finding.key} — ${finding.message}`,
    );
  }

  console.error(
    `\n${findings.length} divergence(s) de lecture/écriture à examiner.`,
  );
  process.exitCode = 1;
}

main();
