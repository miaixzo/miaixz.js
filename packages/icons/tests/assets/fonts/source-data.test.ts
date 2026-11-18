/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Exercises isolated icon architecture inputs and immutable output contracts.
 */

import { mkdtemp, readFile, writeFile, rm, readdir, symlink, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
const repositoryRoot = resolve(process.cwd(), "../..");
/**
 * Loads one repository tool without running its CLI.
 *
 * @param name - Repository-relative icon tool path.
 * @returns Imported tool exports.
 */
const importScript = async (name: string) =>
  import(pathToFileURL(resolve(repositoryRoot, ".github/scripts/modules/icons/" + name)).href);
const { createIconFixture, fixtureDesign } = await import(
  pathToFileURL(resolve(process.cwd(), "tests/assets/fonts/create-fixtures.helper.mjs")).href
);
const temporary: string[] = [];
afterEach(async () => {
  for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true });
});
/**
 * Creates a fresh temporary six-master test source.
 *
 * @param records - Complete test icon records.
 * @returns Isolated fixture roots and written files.
 */
const make = async (
  records = [
    {
      name: "alpha",
      codepoint: 0xf0000,
      category: "actions",
      opticalClass: "regular",
      rtl: "none",
    },
  ],
) => {
  const directory = await mkdtemp(resolve(tmpdir(), "miaixz-icon-test-"));
  temporary.push(directory);
  return createIconFixture({
    directory,
    categories: [{ id: "actions", description: "Actions; excludes navigation" }],
    records,
    design: structuredClone(fixtureDesign),
  });
};
/**
 * Mutates an isolated fixture to construct a negative input.
 *
 * @param path - Temporary fixture path.
 * @param change - Exact test mutation.
 * @returns File-write completion.
 */
const edit = async (path: string, change: (value: string) => string) =>
  writeFile(path, change(await readFile(path, "utf8")));
/**
 * Captures fixture bytes for zero-write and determinism assertions.
 *
 * @param root - Isolated fixture root.
 * @returns Relative file paths and their text.
 */
const snapshot = async (root: string): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  /**
   * Captures every fixture file recursively for byte-preservation assertions.
   *
   * @param path - Directory path relative to the isolated fixture root.
   * @returns Promise resolving after all descendant file contents are recorded.
   */
  const walk = async (path: string) => {
    for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
      const p = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await walk(p);
      else result[p] = await readFile(resolve(root, p), "utf8");
    }
  };
  await walk("");
  return result;
};

const {
  loadIconSource,
  readIconRecords,
  canonicalJson,
  unicodeRangeFor,
  hashIconCollection,
  validIconTime,
} = await importScript("source.mjs");
describe("canonical JSON source", () => {
  it("hashes ASCII-sorted unique path/NUL/length/byte inputs and detects a real byte change", async () => {
    const f = await make();
    const files = ["icons.json", "design.json"].map((path) => ({ path }));
    const options = { root: f.assetsRoot, consumerRoot: f.assetsRoot };
    const expected = createHash("sha256");
    for (const { path } of [...files].sort((a, b) => (a.path < b.path ? -1 : 1))) {
      const bytes = await readFile(resolve(f.assetsRoot, path)),
        length = Buffer.alloc(8);
      length.writeBigUInt64BE(BigInt(bytes.length));
      expected
        .update(path)
        .update(Buffer.from([0]))
        .update(length)
        .update(bytes);
    }
    const hash = await hashIconCollection(files, options);
    expect(hash).toBe(expected.digest("hex"));
    expect(await hashIconCollection([...files.reverse(), files[0]], options)).toBe(hash);
    await edit(resolve(f.assetsRoot, "design.json"), (text) => text + " ");
    expect(await hashIconCollection(files, options)).not.toBe(hash);
    await expect(
      hashIconCollection(
        [
          { path: "design-rules.json", bytes: Buffer.from("one") },
          { path: "design-rules.json", bytes: Buffer.from("two") },
        ],
        options,
      ),
    ).rejects.toThrow("Conflicting");
  });
  it("rejects collection paths that are absolute, ambiguous, mismatched or outside both roots", async () => {
    const f = await make(),
      options = { root: f.assetsRoot, consumerRoot: f.assetsRoot };
    for (const path of ["/etc/hosts", "../icons.json", "..\\icons.json", "./icons.json"]) {
      await expect(hashIconCollection([{ path }], options)).rejects.toThrow();
    }
    await expect(
      hashIconCollection(
        [{ path: "icons.json", absolutePath: resolve(f.assetsRoot, "design.json") }],
        options,
      ),
    ).rejects.toThrow("disagrees");
    await symlink(resolve(process.cwd(), "package.json"), resolve(f.assetsRoot, "escape.json"));
    await expect(hashIconCollection([{ path: "escape.json" }], options)).rejects.toThrow("escapes");
  });
  it("accepts only real UTC execution dates, never overflowed calendar values", () => {
    expect(validIconTime("2026-10-06T08:00:00.123Z")).toBe(true);
    expect(validIconTime("2026-10-06T08:00:00Z")).toBe(true);
    for (const value of [null, "2026-02-30T08:00:00Z", "2026-10-06T08:00:00+08:00", "2026-10-06"])
      expect(validIconTime(value)).toBe(false);
  });
  it("loads schema.json without changing its bytes or falling back to the retired filename", async () => {
    const fixture = await make();
    const schemaPath = resolve(fixture.assetsRoot, "schema.json");
    expect(fixture.writtenFiles).toContain("schema.json");
    expect(await readFile(schemaPath, "utf8")).toBe(
      await readFile(resolve(process.cwd(), "src/assets/schema.json"), "utf8"),
    );
    expect(await readdir(resolve(process.cwd(), "src/assets"))).not.toContain("source.schema.json");
    expect((await loadIconSource({ assetsRoot: fixture.assetsRoot })).icons).toHaveLength(1);
    await rename(schemaPath, resolve(fixture.assetsRoot, "source.schema.json"));
    await expect(loadIconSource({ assetsRoot: fixture.assetsRoot })).rejects.toThrow(
      /ENOENT.*schema\.json/u,
    );
  });
  it("accepts new names appended after published codepoints", async () => {
    const records = ["zulu", "alpha"].map((name, index) => ({
      name,
      codepoint: 0xf0000 + index,
      category: "actions",
      opticalClass: "regular",
      rtl: "none",
    }));
    const fixture = await make(records);
    const source = await loadIconSource({ assetsRoot: fixture.assetsRoot });
    expect(source.icons).toEqual(records);
  });
  it("derives dynamic windows and never reads fonts", async () => {
    const records = Array.from({ length: 257 }, (_, i) => ({
      name: "icon-" + String(i).padStart(3, "0"),
      codepoint: 0xf0000 + i,
      category: "actions",
      opticalClass: "regular",
      rtl: "none",
    }));
    const fixture = await make(records);
    await rm(fixture.fontsRoot, { recursive: true });
    const source = await loadIconSource({ assetsRoot: fixture.assetsRoot });
    expect(Object.keys(source)).toEqual([
      "manifest",
      "design",
      "icons",
      "categories",
      "shardPaths",
    ]);
    expect(source.icons).toHaveLength(records.length);
    expect(source.shardPaths).toEqual(["icons/f0000-f00ff.json", "icons/f0100-f01ff.json"]);
    expect(unicodeRangeFor([...source.icons].reverse())).toBe("U+F0000-F0100");
    expect(
      unicodeRangeFor([
        { codepoint: 0xffffd },
        { codepoint: 0xf0002 },
        { codepoint: 0xf0000 },
        { codepoint: 0xf0000 },
      ]),
    ).toBe("U+F0000, U+F0002, U+FFFFD");
  });
  it.each(["tier", "alias", "release", "schemaVersion", "unknown"])(
    "rejects legacy/unknown %s",
    async (key) => {
      const f = await make();
      const p = resolve(f.assetsRoot, "icons/f0000-f00ff.json");
      await edit(p, (text) => {
        const v = JSON.parse(text);
        v.icons[0][key] = "unexpected";
        return JSON.stringify(v, null, 2) + "\n";
      });
      await expect(loadIconSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
    },
  );
  it.each(["name", "category", "opticalClass", "rtl", "codepoint"])(
    "rejects invalid %s",
    async (key) => {
      const f = await make();
      const p = resolve(f.assetsRoot, "icons/f0000-f00ff.json");
      await edit(p, (text) => {
        const v = JSON.parse(text);
        v.icons[0][key] = key === "codepoint" ? 0xeffff : "INVALID";
        return canonicalJson(v, "shard");
      });
      await expect(loadIconSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
    },
  );
  it.each(["BOM", "CRLF", "extra LF", "key order"])("rejects noncanonical %s", async (mode) => {
    const f = await make();
    const p = resolve(f.assetsRoot, "icons.json");
    await edit(p, (text) =>
      mode === "BOM"
        ? "\ufeff" + text
        : mode === "CRLF"
          ? text.replace(/\n/gu, "\r\n")
          : mode === "extra LF"
            ? text + "\n"
            : JSON.stringify(
                { shards: JSON.parse(text).shards, categories: JSON.parse(text).categories },
                null,
                2,
              ) + "\n",
    );
    await expect(loadIconSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
  });
  it("rejects obsolete loader options", async () => {
    await expect(loadIconSource({ validateUfo: true })).rejects.toThrow("Only assetsRoot");
    await expect(readIconRecords({ anything: true })).rejects.toThrow("Only assetsRoot");
  });
  it("raw projection only skips mapping invariants", async () => {
    const f = await make([
      {
        name: "beta",
        codepoint: 0xf0000,
        category: "actions",
        opticalClass: "regular",
        rtl: "mirror",
      },
      {
        name: "alpha",
        codepoint: 0xf0000,
        category: "actions",
        opticalClass: "regular",
        rtl: "none",
      },
    ]);
    expect((await readIconRecords({ assetsRoot: f.assetsRoot })).icons).toHaveLength(2);
    await expect(loadIconSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
    await edit(resolve(f.assetsRoot, "icons/f0000-f00ff.json"), (t) => {
      const v = JSON.parse(t);
      v.icons[1].name = "beta";
      return canonicalJson(v, "shard");
    });
    await expect(readIconRecords({ assetsRoot: f.assetsRoot })).rejects.toThrow(
      "Duplicate icon names",
    );
  });
  it.each(["extra", "duplicate", "empty", "gap"])(
    "rejects invalid shard layout %s",
    async (mode) => {
      const f = await make();
      if (mode === "extra")
        await writeFile(resolve(f.assetsRoot, "icons/f0100-f01ff.json"), '{"icons":[]}\n');
      if (mode === "duplicate")
        await edit(resolve(f.assetsRoot, "icons.json"), (t) => {
          const v = JSON.parse(t);
          v.shards.push(v.shards[0]);
          return canonicalJson(v, "manifest");
        });
      if (mode === "empty")
        await edit(resolve(f.assetsRoot, "icons/f0000-f00ff.json"), () =>
          canonicalJson({ icons: [] }, "shard"),
        );
      if (mode === "gap")
        await edit(resolve(f.assetsRoot, "icons/f0000-f00ff.json"), (t) => {
          const v = JSON.parse(t);
          v.icons[0].codepoint++;
          return canonicalJson(v, "shard");
        });
      await expect(loadIconSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
    },
  );
  it("rejects unused, duplicate or empty category definitions", async () => {
    for (const category of [
      { id: "unused", description: "Unused" },
      { id: "actions", description: "Duplicate" },
      { id: "blank", description: "   " },
    ]) {
      const f = await make();
      await edit(resolve(f.assetsRoot, "icons.json"), (t) => {
        const v = JSON.parse(t);
        v.categories.push(category);
        v.categories.sort((a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : 1));
        return canonicalJson(v, "manifest");
      });
      await expect(loadIconSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
    }
  });
  it("keeps one-word category boundaries and audited semantic assignments", async () => {
    const assetsRoot = resolve(process.cwd(), "src/assets");
    const manifest = JSON.parse(await readFile(resolve(assetsRoot, "icons.json"), "utf8")) as {
      readonly categories: readonly { readonly id: string; readonly description: string }[];
    };
    expect(manifest.categories.every(({ id }) => /^[a-z]+$/u.test(id))).toBe(true);
    expect(
      manifest.categories.every(({ description }) => description.includes("; excludes ")),
    ).toBe(true);
    expect(manifest.categories.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining(["core", "misc", "other"]),
    );

    const source = await loadIconSource();
    const categoryByName = new Map(
      source.icons.map(({ name, category }: { name: string; category: string }) => [
        name,
        category,
      ]),
    );
    expect(
      Object.fromEntries(
        [
          "banana",
          "bird",
          "book",
          "building",
          "cable-car",
          "card-sim",
          "carrot",
          "cloud-backup",
          "mouse-pointer-ban",
          "send-to-back",
        ].map((name) => [name, categoryByName.get(name)]),
      ),
    ).toEqual({
      banana: "food",
      bird: "animals",
      book: "education",
      building: "buildings",
      "cable-car": "transport",
      "card-sim": "devices",
      carrot: "food",
      "cloud-backup": "development",
      "mouse-pointer-ban": "interface",
      "send-to-back": "actions",
    });
  });

  it("keeps project versions out of every source JSON", async () => {
    const assetsRoot = resolve(process.cwd(), "src/assets");
    const source = await loadIconSource();
    const documents = ["icons.json", "design.json", ...source.shardPaths];
    for (const path of documents) {
      const value = JSON.parse(await readFile(resolve(assetsRoot, path), "utf8")) as unknown;
      const text = JSON.stringify(value);
      expect(text).not.toMatch(/"(?:version|release|rulesVersion|schemaVersion|formatVersion)"/u);
    }
    const schema = JSON.parse(await readFile(resolve(assetsRoot, "schema.json"), "utf8"));
    expect(JSON.stringify(schema)).not.toContain("rulesVersion");
    expect(JSON.stringify(schema)).not.toContain("schemaVersion");
  });
});
