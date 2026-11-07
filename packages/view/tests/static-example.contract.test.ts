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
 * Freezes the local packed-package browser acceptance harness.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { posix, resolve } from "node:path";
import { inflateSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { inspectZipArchive, readZipEntry } from "../src/codecs/archive/zip-codec.js";
import { decodeEmf } from "../src/codecs/office/emf-codec.js";
import {
  allElements,
  elementsByLocalName,
  localAttribute,
  parseXmlDocument,
  type XmlDocument,
} from "../src/codecs/xml/xml-codec.js";
import { defaultResourceBudget } from "../src/runtime/resource-budget.js";

const exampleRoot = resolve(process.cwd(), "tests/shell/office");
const fixtureRoot = resolve(process.cwd(), "tests/formats/xlsx");
const publicFixture = resolve(process.cwd(), "../../examples/public/fixtures/system-flow.xlsx");
const fixtureParts = [
  "[Content_Types].xml",
  "_rels/.rels",
  "docProps/app.xml",
  "docProps/core.xml",
  "xl/_rels/workbook.xml.rels",
  "xl/drawings/_rels/drawing1.xml.rels",
  "xl/drawings/_rels/drawing2.xml.rels",
  "xl/drawings/drawing1.xml",
  "xl/drawings/drawing2.xml",
  "xl/media/image1.emf",
  "xl/media/image2.png",
  "xl/media/image3.emf",
  "xl/sharedStrings.xml",
  "xl/styles.xml",
  "xl/theme/theme1.xml",
  "xl/workbook.xml",
  "xl/worksheets/_rels/sheet1.xml.rels",
  "xl/worksheets/_rels/sheet2.xml.rels",
  "xl/worksheets/sheet1.xml",
  "xl/worksheets/sheet2.xml",
] as const;

/**
 * Reviewed asset fingerprints and raw format counts, independently checked against the package.
 */
interface FixtureInventory {
  readonly sha256: string;
  readonly packageParts: readonly string[];
  readonly workbook: { readonly sheetCount: number; readonly sheetNames: readonly string[] };
  readonly drawing: {
    readonly shapeCount: number;
    readonly connectorCount: number;
    readonly groupCount: number;
    readonly customGeometryCount: number;
    readonly picturePlacementCount: number;
    readonly emfPartCount: number;
    readonly mediaPartCount: number;
  };
  readonly rawCoverage: {
    readonly formulaCount: number;
    readonly inlineStringCells: number;
    readonly inlineRichTextCells: number;
    readonly sharedRichTextRuns: number;
    readonly phoneticRuns: number;
    readonly hiddenRowCounts: readonly number[];
    readonly hiddenColumnCounts: readonly number[];
    readonly media: readonly {
      readonly part: string;
      readonly bytes: number;
      readonly sha256: string;
      readonly format: "EMF" | "PNG";
      readonly recordCount?: number;
      readonly descriptionChars?: number;
      readonly size?: readonly number[];
      readonly chunks?: readonly string[];
    }[];
  };
}

/**
 * Finds a required XML member after all archive entries have passed CRC verification.
 *
 * @param documents - Parsed XML package members.
 * @param path - Exact required package member path.
 * @returns Required inert XML document.
 */
function fixtureXml(documents: ReadonlyMap<string, XmlDocument>, path: string): XmlDocument {
  const document = documents.get(path);
  if (document === undefined) throw new Error(`Missing fixture XML: ${path}`);
  return document;
}

/**
 * Accepts only the independently reviewed synthetic labels, numbers, and formula notation.
 *
 * @param text - One decoded XML text node without surrounding whitespace.
 * @returns Whether the text belongs to the neutral fixture vocabulary.
 */
function isNeutralFixtureText(text: string): boolean {
  return (
    [
      "Geometry Atlas",
      "Transform Atlas",
      "Neutral",
      "样例 Δ",
      "中性",
      "zhongxing",
      "/ 样例",
      "Synthetic geometry and style catalogue",
      "Neutral geometry and style atlas",
      "Miaixz synthetic fixture",
      "Miaixz deterministic standard-library generator",
      "Worksheets",
      "2000-01-01T00:00:00Z",
    ].includes(text) ||
    /^-?\d+(?:\.\d+)?$/u.test(text) ||
    /^B\d+\+1$/u.test(text) ||
    /^Sample-[12]-\d{3}$/u.test(text) ||
    /^(?:Shape|Link) \d{3,4}$/u.test(text) ||
    /^'(?:Geometry|Transform) Atlas'!\$A\$1:\$C[GH]\$\d{3}$/u.test(text)
  );
}

describe("View browser acceptance harness", () => {
  it("ships identical synthetic Office fixtures with closed package resources", async () => {
    const [fixture, published, inventorySource] = await Promise.all([
      readFile(resolve(fixtureRoot, "system-flow.fixture.xlsx")),
      readFile(publicFixture),
      readFile(resolve(fixtureRoot, "system-flow.fixture.json"), "utf8"),
    ]);
    const inventory = JSON.parse(inventorySource) as FixtureInventory;
    expect(published.equals(fixture)).toBe(true);
    expect(createHash("sha256").update(fixture).digest("hex")).toBe(inventory.sha256);
    expect(inventory.packageParts).toEqual(fixtureParts);
    const bytes = new Uint8Array(fixture);
    const entries = inspectZipArchive(bytes, { budget: defaultResourceBudget });
    expect(entries.map((entry) => entry.path).sort()).toEqual(fixtureParts);
    expect(entries).toHaveLength(20);
    const parts = new Map<string, Uint8Array>();
    const documents = new Map<string, XmlDocument>();
    for (const entry of entries) {
      const content = await readZipEntry(bytes, entry.path, {
        budget: defaultResourceBudget,
        maxOutputBytes: defaultResourceBudget.maxArchiveEntryBytes,
      });
      parts.set(entry.path, content);
      if (entry.path.endsWith(".xml") || entry.path.endsWith(".rels")) {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(content);
        const document = parseXmlDocument(
          text,
          defaultResourceBudget.maxXmlNodes,
          defaultResourceBudget.maxXmlDepth,
        );
        documents.set(entry.path, document);
        for (const node of [document.documentElement, ...allElements(document)]) {
          if (node.ownText.trim() !== "") {
            expect(isNeutralFixtureText(node.ownText.trim())).toBe(true);
          }
          expect(node.localName).not.toMatch(
            /^(?:externalReference|externalLink|oleObject|oleObjects|hyperlink|hyperlinks|control|controls|vbaProject|printerSettings|connections|queryTable)$/u,
          );
          if (node.localName === "cNvPr") {
            expect(node.attributes.map((attribute) => attribute.localName).sort()).toEqual([
              "id",
              "name",
            ]);
            expect(localAttribute(node, "name")).toMatch(
              /^Atlas (?:(?:Shape|Link) \d{4}|Group \d{2}|Media \d{4})$/u,
            );
          }
        }
      }
    }
    expect(documents.size).toBe(17);

    const relationships = new Map<string, ReadonlySet<string>>();
    const relationshipTypes = new Set([
      "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
      ...[
        "officeDocument",
        "extended-properties",
        "worksheet",
        "styles",
        "theme",
        "sharedStrings",
        "drawing",
        "image",
      ].map(
        (name) => `http://schemas.openxmlformats.org/officeDocument/2006/relationships/${name}`,
      ),
    ]);
    for (const [path, document] of documents) {
      if (!path.endsWith(".rels")) continue;
      const directory = path === "_rels/.rels" ? "" : (path.split("/_rels/")[0] ?? "");
      const ids = new Set<string>();
      for (const relation of document.documentElement.children) {
        expect(relation.localName).toBe("Relationship");
        expect(localAttribute(relation, "TargetMode")).toBeUndefined();
        const id = localAttribute(relation, "Id") ?? "";
        const target = localAttribute(relation, "Target") ?? "";
        expect(id).not.toBe("");
        expect(ids.has(id)).toBe(false);
        ids.add(id);
        expect(target).not.toBe("");
        expect(target).not.toMatch(/^[a-z][a-z\d+.-]*:|^[\\/]|[\\?#]/iu);
        const resolved = posix.normalize(posix.join(directory, target));
        expect(resolved).not.toMatch(/^\.\.(?:\/|$)/u);
        expect(parts.has(resolved)).toBe(true);
        expect(relationshipTypes.has(localAttribute(relation, "Type") ?? "")).toBe(true);
      }
      relationships.set(path, ids);
    }
    expect(relationships.size).toBe(6);
    for (const [path, document] of documents) {
      if (path.endsWith(".rels")) continue;
      const relations = relationships.get(
        posix.join(posix.dirname(path), "_rels", `${posix.basename(path)}.rels`),
      );
      for (const node of [document.documentElement, ...allElements(document)]) {
        for (const attribute of node.attributes) {
          expect(attribute.name).not.toBe("r:link");
          if (attribute.name === "r:id" || attribute.name === "r:embed") {
            expect(relations?.has(attribute.value)).toBe(true);
          }
        }
      }
    }
    const contentTypes = fixtureXml(documents, "[Content_Types].xml").documentElement.children;
    const defaults = new Set(
      contentTypes
        .filter((node) => node.localName === "Default")
        .map((node) => localAttribute(node, "Extension")),
    );
    const overrides = new Set(
      contentTypes
        .filter((node) => node.localName === "Override")
        .map((node) => (localAttribute(node, "PartName") ?? "").replace(/^\//u, "")),
    );
    for (const node of contentTypes) {
      expect(localAttribute(node, "ContentType")).not.toMatch(/macro|vba|oleObject|activeX/iu);
    }
    for (const path of parts.keys()) {
      if (path === "[Content_Types].xml") continue;
      expect(overrides.has(path) || defaults.has(path.split(".").at(-1))).toBe(true);
    }
    for (const path of overrides) expect(parts.has(path)).toBe(true);

    expect(
      Object.fromEntries(
        fixtureXml(documents, "docProps/core.xml").documentElement.children.map((node) => [
          node.localName,
          node.textContent,
        ]),
      ),
    ).toEqual({
      title: "Neutral geometry and style atlas",
      creator: "Miaixz synthetic fixture",
      lastModifiedBy: "Miaixz synthetic fixture",
      created: "2000-01-01T00:00:00Z",
      modified: "2000-01-01T00:00:00Z",
    });
    const app = fixtureXml(documents, "docProps/app.xml");
    expect(app.documentElement.children.map((node) => node.localName)).toEqual([
      "Application",
      "HeadingPairs",
      "TitlesOfParts",
    ]);
    expect(elementsByLocalName(app, "lpstr").map((node) => node.textContent)).toEqual([
      "Worksheets",
      "Geometry Atlas",
      "Transform Atlas",
    ]);
    const workbook = fixtureXml(documents, "xl/workbook.xml");
    expect(inventory.workbook.sheetCount).toBe(2);
    expect(inventory.workbook.sheetNames).toEqual(["Geometry Atlas", "Transform Atlas"]);
    expect(
      elementsByLocalName(workbook, "sheet").map((node) => localAttribute(node, "name")),
    ).toEqual(inventory.workbook.sheetNames);
    const definedNames = elementsByLocalName(workbook, "definedName");
    expect(definedNames.map((node) => localAttribute(node, "name"))).toEqual([
      "_xlnm.Print_Area",
      "_xlnm.Print_Area",
    ]);
    expect(definedNames.map((node) => localAttribute(node, "localSheetId"))).toEqual(["0", "1"]);

    const worksheets = [1, 2].map((index) =>
      fixtureXml(documents, `xl/worksheets/sheet${index}.xml`),
    );
    const drawings = [1, 2].map((index) =>
      fixtureXml(documents, `xl/drawings/drawing${index}.xml`),
    );
    const sumElements = (sources: readonly XmlDocument[], name: string): number =>
      sources.reduce((count, document) => count + elementsByLocalName(document, name).length, 0);
    for (const [name, expected] of [
      ["sp", inventory.drawing.shapeCount],
      ["cxnSp", inventory.drawing.connectorCount],
      ["grpSp", inventory.drawing.groupCount],
      ["custGeom", inventory.drawing.customGeometryCount],
      ["pic", inventory.drawing.picturePlacementCount],
    ] as const) {
      expect(expected).toBeGreaterThan(0);
      expect(sumElements(drawings, name)).toBe(expected);
    }
    expect(sumElements(worksheets, "f")).toBe(inventory.rawCoverage.formulaCount);
    expect(inventory.rawCoverage.formulaCount).toBeGreaterThan(0);
    const cells = worksheets.flatMap((document) => elementsByLocalName(document, "c"));
    const inline = cells.filter((node) => localAttribute(node, "t") === "inlineStr");
    expect(inline).toHaveLength(inventory.rawCoverage.inlineStringCells);
    expect(inline.length).toBeGreaterThan(0);
    expect(inline.filter((node) => elementsByLocalName(node, "r").length > 0)).toHaveLength(
      inventory.rawCoverage.inlineRichTextCells,
    );
    const strings = fixtureXml(documents, "xl/sharedStrings.xml");
    expect(elementsByLocalName(strings, "r")).toHaveLength(
      inventory.rawCoverage.sharedRichTextRuns,
    );
    expect(inventory.rawCoverage.sharedRichTextRuns).toBeGreaterThan(0);
    expect(elementsByLocalName(strings, "rPh")).toHaveLength(inventory.rawCoverage.phoneticRuns);
    expect(inventory.rawCoverage.phoneticRuns).toBeGreaterThan(0);
    for (const [name, expected] of [
      ["row", inventory.rawCoverage.hiddenRowCounts],
      ["col", inventory.rawCoverage.hiddenColumnCounts],
    ] as const) {
      expect(
        worksheets.map(
          (document) =>
            elementsByLocalName(document, name).filter(
              (node) => localAttribute(node, "hidden") === "1",
            ).length,
        ),
      ).toEqual(expected);
      expect(expected.every((count) => count > 0)).toBe(true);
    }

    const mediaPaths = entries
      .map((entry) => entry.path)
      .filter((path) => path.startsWith("xl/media/"));
    expect(inventory.drawing.mediaPartCount).toBe(3);
    expect(inventory.drawing.emfPartCount).toBe(2);
    expect(mediaPaths.sort()).toEqual(
      inventory.rawCoverage.media.map((media) => media.part).sort(),
    );
    for (const media of inventory.rawCoverage.media) {
      const content = parts.get(media.part);
      if (content === undefined) throw new Error(`Missing fixture media: ${media.part}`);
      expect(content.byteLength).toBe(media.bytes);
      expect(createHash("sha256").update(content).digest("hex")).toBe(media.sha256);
      const buffer = Buffer.from(content);
      if (media.format === "EMF") {
        expect(media.part).toMatch(/\.emf$/u);
        expect(buffer.readUInt32LE(0)).toBe(1);
        expect(buffer.readUInt32LE(40)).toBe(0x464d4520);
        expect(buffer.readUInt32LE(48)).toBe(buffer.byteLength);
        expect(buffer.readUInt32LE(52)).toBe(media.recordCount);
        expect(buffer.readUInt32LE(60)).toBe(0);
        expect(buffer.readUInt32LE(64)).toBe(0);
        expect(media.descriptionChars).toBe(0);
        const vector = decodeEmf(content, defaultResourceBudget);
        expect(vector.recordCount).toBe(media.recordCount);
        expect(vector.visible).toBe(true);
        expect(vector.unsupportedRecords).toEqual([]);
      } else {
        expect(media.format).toBe("PNG");
        expect(media.part).toBe("xl/media/image2.png");
        expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        const chunks: string[] = [];
        const payloads: Buffer[] = [];
        let offset = 8;
        while (offset + 12 <= buffer.byteLength) {
          const length = buffer.readUInt32BE(offset);
          const kind = buffer.toString("ascii", offset + 4, offset + 8);
          expect(offset + 12 + length).toBeLessThanOrEqual(buffer.byteLength);
          chunks.push(kind);
          if (kind === "IDAT") payloads.push(buffer.subarray(offset + 8, offset + 8 + length));
          offset += length + 12;
        }
        expect(offset).toBe(buffer.byteLength);
        expect(chunks).toEqual(["IHDR", "IDAT", "IEND"]);
        expect(chunks).toEqual(media.chunks);
        const size = [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
        expect(size).toEqual([128, 96]);
        expect(size).toEqual(media.size);
        const pixels = inflateSync(Buffer.concat(payloads), { maxOutputLength: 96 * 385 });
        expect(pixels.byteLength).toBe(96 * 385);
        const colors = new Set([0x315b78, 0xd9eaf4, 0xd6e8d5, 0xf6e4bd, 0xffffff]);
        for (let row = 0; row < 96; row += 1) {
          expect(pixels[row * 385]).toBe(0);
          for (let column = 0; column < 128; column += 1) {
            expect(colors.has(pixels.readUIntBE(row * 385 + column * 3 + 1, 3))).toBe(true);
          }
        }
      }
    }
  });

  it("loads the packed viewer, styles, worker result, and frozen workbook", async () => {
    const [html, source] = await Promise.all([
      readFile(resolve(exampleRoot, "browser-host.html"), "utf8"),
      readFile(resolve(exampleRoot, "browser-host.tsx"), "utf8"),
    ]);
    expect(html).toContain('<script type="module" src="./browser-host.tsx"></script>');
    for (const token of [
      "OfficeView",
      "../../../dist/index.js",
      "../../../dist/styles.css",
      "../../formats/xlsx/system-flow.fixture.xlsx",
      "__XLSX_PREVIEW_RESULT__",
    ]) {
      expect(source).toContain(token);
    }
  });
});
