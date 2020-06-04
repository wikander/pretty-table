import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std/testing/asserts.ts";
import Table from "./pretty-table.ts";

interface F {
  file: Deno.File;
  name: string;
}

async function createFile(): Promise<F> {
  const tempDir = await Deno.makeTempDir();
  const name = tempDir + "/table_output.txt";
  const file = await Deno.open(name, {
    create: true,
    write: true,
  });
  return { file, name };
}

async function readFileContent(f: F): Promise<string> {
  await f.file.close();

  const fileContents = await Deno.readFile(f.name);
  await Deno.remove(f.name);
  const decoder = new TextDecoder();
  return decoder.decode(fileContents);
}

Deno.test("Basic table", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file });

  await t.write([
    ["hello world", "test"],
    ["h", "t"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
    tableText,
`\
hello world test
h           t   \
`);
});

Deno.test("Bordered table", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, border: true });

  await t.write([
    ["hello", "world", "!"],
    ["this", "is", "a"],
    ["pretty", "", "table"],
    ["with", "border", "and"],
    ["", "default", "padding"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
      tableText,
  `\
┏━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━┓
┃ hello  ┃ world   ┃ !       ┃
┣━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┫
┃ this   ┃ is      ┃ a       ┃
┣━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┫
┃ pretty ┃         ┃ table   ┃
┣━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┫
┃ with   ┃ border  ┃ and     ┃
┣━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┫
┃        ┃ default ┃ padding ┃
┗━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┛
`);
});

Deno.test("Bordered table with padding and spacing", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, border: true, padding: 3, spacing: 7 });

  await t.write([
    ["hello", "world", "!"],
    ["this", "is", "a"],
    ["pretty", "", "table"],
    ["with", "border", "and"],
    ["", "default", "padding"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
        tableText,
    `\
┏━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━┓
┃   hello    ┃   world     ┃   !         ┃
┣━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━┫
┃   this     ┃   is        ┃   a         ┃
┣━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━┫
┃   pretty   ┃             ┃   table     ┃
┣━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━┫
┃   with     ┃   border    ┃   and       ┃
┣━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━┫
┃            ┃   default   ┃   padding   ┃
┗━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━┛
`);
});

Deno.test("Bordered table with padding and spacing", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, border: true, innerBorder: false });

  await t.write([
    ["hello", "world", "!"],
    ["this", "is", "a"],
    ["pretty", "", "table"],
    ["with"],
    ["no", "inner", "border"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
          tableText,
      `\
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃ hello   world  !      ┃
┃ this    is     a      ┃
┃ pretty         table  ┃
┃ with                  ┃
┃ no      inner  border ┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛
`);
});

Deno.test("Basic table with spacing", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, spacing: 3 });

  await t.write([
    ["hello", "world", "!"],
    ["this", "is", "a"],
    ["pretty", "", "table"],
    ["without", "border", "and"],
    ["with", "spacing", "3"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
      tableText,
`\
hello     world     !    
this      is        a    
pretty              table
without   border    and  
with      spacing   3    \
`);
});

Deno.test("Basic table with padding", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, padding: 2 });

  await t.write([
    ["hello", "world", "!"],
    ["this", "is", "a"],
    ["pretty", "", "table"],
    ["without", "border", "and"],
    ["with", "padding", "2"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
        tableText,
`\
  hello   world   !      
  this    is      a      
  pretty          table  
  without border  and    
  with    padding 2      \
`);
});

Deno.test("Basic table with padding and spacing", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, padding: 2, spacing: 3 });

  await t.write([
    ["hello", "world", "!"],
    ["this", "is", "a"],
    ["pretty", "", "table"],
    ["without", "border", "and"],
    ["with", "padding", "2"],
    ["with", "spacing", "3"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
          tableText,
  `\
  hello     world     !      
  this      is        a      
  pretty              table  
  without   border    and    
  with      padding   2      
  with      spacing   3      \
`);
});

Deno.test("None string values", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file });

  await t.write([[123, 456]]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
      tableText,
`\
123 456\
`);
});

Deno.test("null value in cell", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file });

  await t.write([
    ["a", "b"],
    [null, "c"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
      tableText,
`\
a b
  c\
`);
});

Deno.test("null value in cell with borders", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, border: true });

  await t.write([
    ["a", "b"],
    [null, "c"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
        tableText,
  `\
┏━━━┳━━━┓
┃ a ┃ b ┃
┣━━━╋━━━┫
┃   ┃ c ┃
┗━━━┻━━━┛
`);
});

Deno.test("undefined value in cell", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file });

  await t.write([
    ["a", "b"],
    [undefined, "c"],
  ]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
      tableText,
`\
a b
  c\
`);
});

Deno.test("Different length of rows", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file, padding: 3 });

  await t.write([["a", "b"], ["c"], ["d", "e", "f"]]);

  const tableText = await readFileContent(f);

  // prettier-ignore
  assertEquals(
        tableText,
  `\
   a b     
   c       
   d e f   \
`);
});

Deno.test("missing value in cell", async () => {
  const f = await createFile();
  const t = new Table({ output: f.file });

  assertThrowsAsync(() => t.write([["a", "b"], ["c"], ["d", "e"]]));
  f.file.close();
});
