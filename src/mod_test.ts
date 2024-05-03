import {
  createTransformer,
  createVisitor,
  transform,
  transformFiles,
  ts,
} from "./mod.ts";
import { expect } from "@std/expect";

Deno.test("createVisitor + createTransformer", () => {
  let called = false;
  const visitor = createVisitor((node) => {
    called = true;
    return node;
  });

  const transformer = createTransformer(() => (sourceFile) => {
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  });

  const out = transform("console.log('foo');", "foo.ts", [transformer]);
  expect(out.trim()).toEqual("console.log('foo');");
  expect(called).toEqual(true);
});

Deno.test("transformFiles", () => {
  let outerCallCount = 0;
  let innerCallCount = 0;

  const transformer = createTransformer((context) => {
    const visitor = createVisitor((node) => {
      if (ts.isCallExpression(node)) {
        return ts.factory.createIdentifier("foo");
      }
      return ts.visitEachChild(node, visitor, context);
    });

    outerCallCount++;
    return (sourceFile) => {
      innerCallCount++;
      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  });

  const out = transformFiles([{
    content: "console.log('foo');",
    filePath: "foo.ts",
  }, { content: "console.log('hey')", filePath: "bar.ts" }], [transformer]);
  expect(out.map((str) => str.trim())).toEqual(["foo;", "foo;"]);

  expect(outerCallCount).toEqual(1);
  expect(innerCallCount).toEqual(2);
});

Deno.test("transform", () => {
  const transformer = createTransformer((context) => {
    const visitor = createVisitor((node) => {
      if (ts.isCallExpression(node)) {
        return ts.factory.createIdentifier("foo");
      }
      return ts.visitEachChild(node, visitor, context);
    });

    return (sourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  });

  const out = transform("console.log('foo');", "foo.ts", [transformer]);
  expect(out.trim()).toEqual("foo;");
});

Deno.test("keep comments", () => {
  const transformer = createTransformer((context) => {
    const visitor = createVisitor((node) => {
      if (ts.isCallExpression(node)) {
        return ts.factory.createIdentifier("foo");
      }
      return ts.visitEachChild(node, visitor, context);
    });

    return (sourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  });

  const code = `// comment
foo;
console.log("foo");`;

  const out = transform(code, "foo.ts", [transformer]);
  expect(out.trim()).toEqual(`// comment\nfoo;\nfoo;`);
});
