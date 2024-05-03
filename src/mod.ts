import * as path from "@std/path";
import ts from "typescript";
export { default as ts } from "typescript";

const DEFAULT_COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  allowJs: true,
  jsx: ts.JsxEmit.Preserve,
};

/**
 * TypeScript transformer type
 */
export type Transformer = ts.TransformerFactory<ts.SourceFile>;
/**
 * Helper method to create a TypeScript transformer function
 */
export function createTransformer(transformer: Transformer): Transformer {
  return transformer;
}

/**
 * Visitor type
 */
export type Visitor = (node: ts.Node) => ts.Node;
/**
 * Helper method to create a TypeScript transformer function
 */
export function createVisitor(fn: Visitor): Visitor {
  return fn;
}

/**
 * Transform files with the supplied TypeScript transformers
 */
export function transformFiles(
  files: Array<{ filePath: string; content: string }>,
  transformers: Transformer[],
  compilerOptions: ts.CompilerOptions = {},
): string[] {
  const sourceFiles: ts.SourceFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const scriptKind = scriptKindFromName(file.filePath);
    const sf = ts.createSourceFile(
      file.filePath,
      file.content,
      ts.ScriptTarget.ESNext,
      true,
      scriptKind,
    );
    sourceFiles.push(sf);
  }

  const result = ts.transform(sourceFiles, transformers, {
    ...DEFAULT_COMPILER_OPTIONS,
    ...compilerOptions,
  });

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
    omitTrailingSemicolon: false,
    removeComments: false,
  });

  return result.transformed.map((sf) => {
    return printer.printNode(ts.EmitHint.SourceFile, sf, sf);
  });
}

/**
 * Transform an input string
 */
export function transform(
  code: string,
  filePath: string,
  transformers: Transformer[],
  compilerOptions: ts.CompilerOptions = {},
): string {
  const result = transformFiles(
    [{ content: code, filePath }],
    transformers,
    compilerOptions,
  );
  return result[0];
}

function scriptKindFromName(name: string): ts.ScriptKind {
  const ext = path.extname(name);
  switch (ext) {
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".js":
      return ts.ScriptKind.JS;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".json":
      return ts.ScriptKind.JSON;
    default:
      return ts.ScriptKind.Unknown;
  }
}
