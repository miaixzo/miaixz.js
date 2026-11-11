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
 * Loads canonical icon data without generated modules or persistent audit records.
 */
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  loadWorkspaceRepository,
  repositoryRoot as sharedRepositoryRoot,
  requireWorkspace,
} from "../../miaixz.mjs";
import { validateDesignGeometry } from "./fonts/font-geometry.mjs";

/**
 * Absolute repository root derived from this module's location.
 */
export const repositoryRoot = sharedRepositoryRoot;
/**
 * Absolute path to the icons workspace package.
 */
export const packageRoot = requireWorkspace(
  "@miaixz/icons",
  loadWorkspaceRepository(repositoryRoot),
).rootPath;
/**
 * Default root of canonical icon JSON and font-source assets.
 */
export const assetsRoot = resolve(packageRoot, "src/assets");
/**
 * Default directory containing Designspace and UFO font sources.
 */
export const fontsRoot = resolve(assetsRoot, "fonts");
/**
 * First assignable codepoint in Supplementary Private Use Area-A.
 */
export const FIRST_CODEPOINT = 0xf0000;
/**
 * Last assignable codepoint before the plane's two noncharacters.
 */
export const MAX_CODEPOINT = 0xffffd;

/**
 * Measures the published name-to-codepoint table covered by the existing runtimeBytes budget.
 * The separately exported metadata catalog is not part of this table's raw-byte budget.
 * @param {string} distRoot Actual icon package distribution directory.
 * @returns {Promise<{path:string,bytes:number}>} Exact uncompressed table bytes.
 */
export async function measureIconRuntime(distRoot) {
  const path = "values/icons.js",
    bytes = (await stat(resolve(distRoot, path))).size;
  if (bytes <= 0) throw new Error("Published icon runtime table is empty.");
  return { path, bytes };
}

const requirePackage = createRequire(resolve(packageRoot, "package.json"));
const Ajv2020 = requirePackage("ajv/dist/2020").default;
const classNames = ["regular", "wide", "tall", "directional", "compound", "line-symbol"];
const sizeNames = ["indicator", "inline", "control", "navigation", "feature", "display"];
/**
 * Constructs an object in the required source key order.
 * @param {object} value Source object whose fields are projected.
 * @param {string[]} order Required output field sequence.
 * @returns {object} A new object containing only the requested fields in that order.
 */
const keys = (value, order) => Object.fromEntries(order.map((k) => [k, value[k]]));
/**
 * Recursively sorts Schema object keys without reordering arrays.
 * @param {unknown} value JSON value to canonicalize recursively.
 * @returns {unknown} Sorted object or array projection; scalar values remain unchanged.
 */
const sortObject = (value) =>
  Array.isArray(value)
    ? value.map(sortObject)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, sortObject(value[k])]),
        )
      : value;

/**
 * Canonicalizes one source document.
 * @param {any} value JSON value.
 * @param {"schema"|"manifest"|"shard"|"design"} kind Document kind.
 * @returns {string} Canonical UTF-8/LF text.
 */
export function canonicalJson(value, kind) {
  let ordered;
  if (kind === "schema") ordered = sortObject(value);
  else if (kind === "manifest")
    ordered = {
      categories: value.categories.map((c) => keys(c, ["id", "description"])),
      shards: value.shards,
    };
  else if (kind === "shard")
    ordered = {
      icons: value.icons.map((i) =>
        keys(i, ["name", "codepoint", "category", "opticalClass", "rtl"]),
      ),
    };
  else if (kind === "design")
    ordered = {
      font: keys(value.font, ["familyName", "outputFile", "unitsPerEm"]),
      axes: Object.fromEntries(
        ["fill", "opticalSize"].map((k) => [
          k,
          keys(value.axes[k], ["tag", "minimum", "default", "maximum"]),
        ]),
      ),
      sizes: Object.fromEntries(
        sizeNames.map((k) => [k, keys(value.sizes[k], ["pixels", "opticalSize"])]),
      ),
      grid: keys(value.grid, ["safeBounds", "opticalCenter", "lengthTolerance"]),
      opticalClasses: Object.fromEntries(
        classNames.map((k) => [
          k,
          keys(value.opticalClasses[k], ["longestEdge", "centerTolerance"]),
        ]),
      ),
      limits: keys(value.limits, ["fontBytes", "runtimeBytes"]),
      visual: {
        strokeWidths: Object.fromEntries(
          ["compact", "standard", "display"].map((k) => [
            k,
            keys(value.visual.strokeWidths[k], ["target", "tolerance"]),
          ]),
        ),
        frameCornerRadius: keys(value.visual.frameCornerRadius, ["standard"]),
        circleApproximationError: value.visual.circleApproximationError,
        comparison: keys(value.visual.comparison, [
          "alphaThreshold",
          "boundaryPixels",
          "areaRelativeError",
          "centroidPixels",
          "paddingCssPixels",
          "compiledOutlineUnits",
          "subdivisionUnits",
        ]),
      },
    };
  else throw new Error("Unknown JSON document kind: " + kind);
  return JSON.stringify(ordered, null, 2) + "\n";
}

/**
 * Derives the legal shard window.
 * @param {number} codepoint Legal PUA codepoint.
 * @returns {string} Asset-relative shard path.
 */
export function shardPathFor(codepoint) {
  if (!Number.isInteger(codepoint) || codepoint < FIRST_CODEPOINT || codepoint > MAX_CODEPOINT)
    throw new Error("Invalid icon codepoint.");
  const start = FIRST_CODEPOINT + Math.floor((codepoint - FIRST_CODEPOINT) / 256) * 256;
  return (
    "icons/" +
    start.toString(16) +
    "-" +
    Math.min(start + 255, MAX_CODEPOINT).toString(16) +
    ".json"
  );
}
/**
 * Rejects a failed JSON source invariant.
 * @param {unknown} condition Invariant that must hold.
 * @param {string} message Failure diagnostic.
 * @returns {void} Returns normally when the invariant holds; otherwise throws.
 */
function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Reads one JSON file within the real source root.
 * @param {string} root Permitted source root.
 * @param {string} pathname Root-relative JSON document path.
 * @returns {Promise<{value:unknown,text:string}>} Parsed JSON and its original UTF-8 text.
 */
async function readDocument(root, pathname) {
  const file = resolve(root, pathname),
    real = await realpath(file),
    realRoot = await realpath(root);
  requireCondition(real.startsWith(realRoot + sep), pathname + " escapes assetsRoot.");
  const text = await readFile(file, "utf8");
  return { value: JSON.parse(text), text };
}

/**
 * Reads the shared structural projection before optional assignment checks.
 * @param {{assetsRoot?:string}} options Optional canonical JSON source root.
 * @param {boolean} strict Whether to enforce final codepoint and shard assignments.
 * @returns {Promise<object>} Validated design, manifest, categories, and ordered icon records.
 */
async function readProjection(options, strict) {
  if (
    !options ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    Reflect.ownKeys(options).some((k) => k !== "assetsRoot")
  )
    throw new TypeError("Only assetsRoot is a supported source option.");
  const root = resolve(options.assetsRoot ?? assetsRoot);
  const documents = await Promise.all(
    ["schema.json", "icons.json", "design.json"].map((p) => readDocument(root, p)),
  );
  const [schema, manifest, design] = documents.map((d) => d.value);
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  ajv.addSchema(schema);
  /**
   * Checks a JSON document against the selected canonical schema definition.
   *
   * @param kind - Schema definition key such as manifest, design, or shard.
   * @param value - Parsed JSON document being validated.
   * @param label - Source filename used in validation diagnostics.
   * @returns No return value; invalid data or a missing schema definition throws.
   */
  const validate = (kind, value, label) => {
    const fn = ajv.getSchema(schema.$id + "#/$defs/" + kind);
    requireCondition(fn, "Missing schema definition: " + kind);
    if (!fn(value)) throw new Error(label + ": " + ajv.errorsText(fn.errors, { separator: "; " }));
  };
  validate("manifest", manifest, "icons.json");
  validate("design", design, "design.json");
  for (const [i, kind] of ["schema", "manifest", "design"].entries())
    requireCondition(
      documents[i].text === canonicalJson(documents[i].value, kind),
      ["schema.json", "icons.json", "design.json"][i] + " is not canonical JSON.",
    );
  const categories = manifest.categories.map((c) => c.id);
  requireCondition(new Set(categories).size === categories.length, "Duplicate category IDs.");
  requireCondition(
    JSON.stringify(categories) === JSON.stringify([...categories].sort()),
    "Category IDs must use ASCII order.",
  );
  requireCondition(
    manifest.categories.every((c) => c.description.trim().length > 0),
    "Empty category description.",
  );
  for (const axis of Object.values(design.axes))
    requireCondition(
      axis.minimum <= axis.default && axis.default <= axis.maximum,
      "Invalid axis interval/default.",
    );
  for (const [name, size] of Object.entries(design.sizes))
    requireCondition(
      size.opticalSize >= design.axes.opticalSize.minimum &&
        size.opticalSize <= design.axes.opticalSize.maximum,
      name + " opticalSize is outside opsz.",
    );
  validateDesignGeometry(design);
  const disk = (await readdir(resolve(root, "icons"))).map((p) => "icons/" + p).sort();
  requireCondition(
    JSON.stringify(disk) === JSON.stringify([...manifest.shards].sort()),
    "Manifest and disk shard sets differ.",
  );
  const icons = [],
    shardValues = [];
  for (const pathname of manifest.shards) {
    const doc = await readDocument(root, pathname);
    validate("shard", doc.value, pathname);
    requireCondition(
      doc.text === canonicalJson(doc.value, "shard"),
      pathname + " is not canonical JSON.",
    );
    icons.push(...doc.value.icons);
    shardValues.push(doc.value.icons);
  }
  requireCondition(icons.length > 0, "Icon source must not be empty.");
  requireCondition(
    new Set(icons.map((i) => i.name)).size === icons.length,
    "Duplicate icon names.",
  );
  for (const icon of icons)
    requireCondition(
      categories.includes(icon.category),
      icon.name + " references an unknown category.",
    );
  for (const id of categories)
    requireCondition(
      icons.some((i) => i.category === id),
      "Unused category: " + id,
    );
  if (strict) {
    for (const [index, icon] of icons.entries())
      requireCondition(
        icon.codepoint === FIRST_CODEPOINT + index,
        "Invalid continuous codepoint: " + icon.name,
      );
    const expectedPaths = [...new Set(icons.map((i) => shardPathFor(i.codepoint)))];
    requireCondition(
      JSON.stringify(expectedPaths) === JSON.stringify(manifest.shards),
      "Invalid ordered shard windows.",
    );
    for (const [index, records] of shardValues.entries()) {
      requireCondition(records.length > 0 && records.length <= 256, "Empty or oversized shard.");
      requireCondition(
        records.every((i) => shardPathFor(i.codepoint) === manifest.shards[index]),
        "Record is outside declared shard.",
      );
      if (index < shardValues.length - 1)
        requireCondition(records.length === 256, "Non-final shard is not full.");
    }
  }
  return Object.freeze({
    manifest,
    design,
    icons: Object.freeze(icons.map((i) => Object.freeze(i))),
    categories: Object.freeze(categories),
    shardPaths: Object.freeze([...manifest.shards]),
  });
}

/**
 * Validates final JSON and dynamic mapping.
 * @param {{assetsRoot?:string}} options JSON root only.
 * @returns {Promise<any>} Validated JSON projection.
 */
export function loadIconSource(options = {}) {
  return readProjection(options, true);
}

/**
 * Reads final field shapes before repairing stale mappings.
 * @param {{assetsRoot?:string}} options JSON root only.
 * @returns {Promise<any>} Structural JSON projection.
 */
export function readIconRecords(options = {}) {
  return readProjection(options, false);
}

/**
 * Checks a JSON value against a closed definition in the canonical source Schema.
 * @param {unknown} value Candidate data.
 * @param {string} definition Named Schema definition.
 * @param {string} [root] Allowed assets root, also used for isolated fixtures.
 * @returns {Promise<void>} Throws with actual schema diagnostics on failure.
 */
export async function validateIconDocument(value, definition, root = assetsRoot) {
  const { value: schema } = await readDocument(root, "schema.json");
  requireCondition(
    Object.hasOwn(schema.$defs, definition),
    "Unknown source schema definition: " + definition,
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(schema);
  const validate = ajv.compile({ $ref: schema.$id + "#/$defs/" + definition });
  requireCondition(
    validate(value),
    "Invalid " + definition + ": " + ajv.errorsText(validate.errors),
  );
}

/**
 * Hashes a confined collection using path, zero byte, big-endian byte length, and raw bytes.
 * @param {Array<{path:string,absolutePath?:string,bytes?:Buffer}>} files Actual files or the specified virtual rule projection.
 * @param {{root?:string,consumerRoot?:string}} options Two allowed repository roots.
 * @returns {Promise<string>} Collection SHA-256.
 */
export async function hashIconCollection(
  files,
  { root = repositoryRoot, consumerRoot = resolve(root, "../miaixz") } = {},
) {
  const roots = await Promise.all([realpath(root), realpath(consumerRoot)]),
    entries = new Map();
  for (const file of files) {
    requireCondition(
      typeof file.path === "string" &&
        file.path.length > 0 &&
        !file.path.includes("\\") &&
        !isAbsolute(file.path),
      "Invalid collection path.",
    );
    if (file.bytes !== undefined) {
      requireCondition(
        file.path === "design-rules.json" && Buffer.isBuffer(file.bytes),
        "Only the rule projection may be virtual.",
      );
      requireCondition(
        !entries.has(file.path) || entries.get(file.path).equals(file.bytes),
        "Conflicting virtual collection bytes.",
      );
      entries.set(file.path, file.bytes);
      continue;
    }
    const absolute = resolve(file.absolutePath ?? resolve(root, file.path));
    requireCondition(
      relative(root, absolute).split(sep).join("/") === file.path,
      "Collection path disagrees with actual file.",
    );
    const actual = await realpath(absolute);
    requireCondition(
      roots.some((base) => actual.startsWith(base + sep)),
      "Collection symlink escapes allowed roots: " + file.path,
    );
    requireCondition(
      actual.startsWith(roots[0] + sep)
        ? !file.path.split("/").includes("..")
        : file.path.startsWith("../miaixz/") && !file.path.slice(10).split("/").includes(".."),
      "Collection lexical path escapes allowed roots: " + file.path,
    );
    requireCondition(
      (await stat(absolute)).isFile(),
      "Collection input is not a file: " + file.path,
    );
    const bytes = await readFile(absolute);
    requireCondition(
      !entries.has(file.path) || entries.get(file.path).equals(bytes),
      "Conflicting duplicate collection input.",
    );
    entries.set(file.path, bytes);
  }
  const hash = createHash("sha256");
  for (const [path, bytes] of [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(bytes.length));
    hash.update(path, "utf8");
    hash.update(Buffer.from([0]));
    hash.update(length);
    hash.update(bytes);
  }
  return hash.digest("hex");
}

/**
 * Validates real calendar timestamps rather than accepting impossible dates.
 * @param {unknown} value Candidate UTC timestamp.
 * @returns {boolean} Whether the timestamp round-trips to the same real date.
 */
export function validIconTime(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().replace(".000Z", "Z") === value.replace(".000Z", "Z")
  );
}

/**
 * Merges sorted unique codepoints into exact CSS ranges.
 * @param {readonly {codepoint:number}[]} icons Icon records.
 * @returns {string} Uppercase merged Unicode ranges.
 */
export function unicodeRangeFor(icons) {
  const points = [...new Set(icons.map((i) => i.codepoint))].sort((a, b) => a - b);
  requireCondition(points.length > 0, "Cannot derive an empty Unicode range.");
  for (const p of points)
    requireCondition(
      Number.isInteger(p) && p >= FIRST_CODEPOINT && p <= MAX_CODEPOINT,
      "Invalid Unicode-range codepoint.",
    );
  const ranges = [];
  let start = points[0],
    end = start;
  /**
   * Appends the current contiguous codepoint interval to the CSS unicode-range output.
   *
   * @returns New number of emitted intervals.
   */
  const emit = () =>
    ranges.push(
      "U+" +
        start.toString(16).toUpperCase() +
        (start === end ? "" : "-" + end.toString(16).toUpperCase()),
    );
  for (const p of points.slice(1)) {
    if (p === end + 1) end = p;
    else {
      emit();
      start = end = p;
    }
  }
  emit();
  return ranges.join(", ");
}
