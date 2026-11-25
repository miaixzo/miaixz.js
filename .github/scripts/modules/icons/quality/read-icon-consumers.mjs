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
 * Reads actual consumers and finite branches in memory without executing application code.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "@babel/parser";
import { loadWorkspaceRepository, requireWorkspace } from "../../../miaixz.mjs";
import { repositoryRoot, loadIconSource } from "../source.mjs";

const workspaceRepository = loadWorkspaceRepository(repositoryRoot);
const uiSourceRoot = resolve(requireWorkspace("@miaixz/ui", workspaceRepository).rootPath, "src");
const defaultConsumerRoots = workspaceRepository.workspaces
  .filter(({ name }) => name !== "@miaixz/icons")
  .map(({ rootPath }) => resolve(rootPath, "src"));

const unknown = Symbol("unresolved expression");
const nonIcon = Symbol("non-icon content");
const absent = Symbol("absent property");

/**
 * Enumerates source files; absent roots cannot silently pass.
 * @param {string} root Explicit source directory.
 * @returns {Promise<string[]>} Sorted source files.
 */
async function sourceFiles(root) {
  if (!(await stat(root)).isDirectory())
    throw new Error("Consumer root is not a directory: " + root);
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.(?:[cm]?[jt]sx?|json)$/u.test(entry.name)) files.push(path);
  }
  return files.sort();
}

/**
 * Traverses actual syntax children, including independently nested JSX.
 * @param {object} node Babel syntax node.
 * @param {Function} callback Node visitor.
 * @returns {void} Visits all nodes.
 */
function visit(node, callback) {
  if (!node || typeof node.type !== "string") return;
  callback(node);
  for (const [key, child] of Object.entries(node)) {
    if (["loc", "start", "end", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => visit(item, callback));
    else if (child && typeof child === "object") visit(child, callback);
  }
}

/**
 * Extracts finite consumer values using lexical bindings, not a string search or compiler cache.
 * @param {{roots?:string[],names?:Iterable<string>}} options Isolated roots and canonical names.
 * @returns {Promise<object>} Read-only names, references, generic consumers and unresolved sites.
 */
export async function readIconConsumers(options = {}) {
  const roots = (options.roots ?? defaultConsumerRoots).map((root) => resolve(root));
  if (!roots.length) throw new Error("At least one consumer source root is required.");
  const names = new Set(options.names ?? (await loadIconSource()).icons.map((icon) => icon.name));
  const paths = [...new Set((await Promise.all(roots.map(sourceFiles))).flat())].sort();
  if (!paths.length) throw new Error("Consumer roots contain no source files.");
  const modules = new Map(),
    contexts = new WeakMap();
  const references = [],
    genericConsumers = [],
    nonIconSymbols = [],
    unresolved = [];
  const seen = new Set();

  /**
   * Loads source and builds scoped bindings without evaluating runtime expressions.
   * @param {string} path Absolute module path.
   * @returns {Promise<object>} Parsed module and lexical root.
   */
  async function load(path) {
    if (modules.has(path)) return modules.get(path);
    const content = await readFile(path, "utf8");
    const module = {
      path,
      exports: new Map(),
      imports: new Map(),
      root: { bindings: new Map(), parent: null },
    };
    modules.set(path, module);
    if (path.endsWith(".json")) {
      module.json = JSON.parse(content);
      return module;
    }
    try {
      module.ast = parse(content, {
        sourceType: "unambiguous",
        plugins: [["typescript", { dts: /\.d\.[cm]?ts$/u.test(path) }], "jsx"],
      });
    } catch (error) {
      throw new Error("Cannot parse consumer source: " + path, { cause: error });
    }
    /**
     * Adds destructured variables with explicit source-property provenance.
     * @param {object} pattern Binding syntax.
     * @param {object} binding Source binding.
     * @param {object} scope Current scope.
     * @param {string[]} keys Destructured property path.
     * @returns {void} Registers bindings.
     */
    function bind(pattern, binding, scope, keys = []) {
      if (!pattern) return;
      if (pattern.type === "Identifier")
        scope.bindings.set(pattern.name, {
          ...binding,
          keys,
          type: pattern.typeAnnotation?.typeAnnotation ?? binding.type,
        });
      else if (pattern.type === "AssignmentPattern")
        bind(pattern.left, { ...binding, fallback: pattern.right }, scope, keys);
      else if (pattern.type === "ObjectPattern")
        for (const property of pattern.properties) {
          if (property.type === "ObjectProperty")
            bind(
              property.value,
              { ...binding, type: pattern.typeAnnotation?.typeAnnotation ?? binding.type },
              scope,
              [...keys, property.key.name ?? property.key.value],
            );
        }
      else if (pattern.type === "ArrayPattern")
        pattern.elements.forEach((item, index) => bind(item, binding, scope, [...keys, index]));
    }
    /**
     * Indexes lexical scopes and exports, including callbacks and imports.
     * @param {object} node Actual syntax.
     * @param {object} scope Parent lexical scope.
     * @param {object} parent Actual parent node.
     * @returns {void} Builds the in-memory symbol index.
     */
    function index(node, scope, parent) {
      if (!node || typeof node.type !== "string") return;
      if (node.type === "FunctionDeclaration" && node.id)
        scope.bindings.set(node.id.name, { node, module, scope });
      if (/Function|Method/u.test(node.type) && (node.params || node.parameters)) {
        scope = { bindings: new Map(), parent: scope };
        for (const [position, parameter] of (node.params ?? node.parameters).entries()) {
          const forwarded =
            parent?.type === "CallExpression" &&
            parent.callee.name === "forwardRef" &&
            position === 0
              ? (parent.typeArguments ?? parent.typeParameters)?.params[1]
              : undefined;
          const collection =
            parent?.type === "CallExpression" &&
            ["map", "flatMap", "forEach", "filter", "find"].includes(
              parent.callee.property?.name,
            ) &&
            position === 0
              ? parent.callee.object
              : undefined;
          bind(
            parameter,
            {
              parameter: true,
              type: parameter.typeAnnotation?.typeAnnotation ?? forwarded,
              collection,
              module,
              scope,
            },
            scope,
          );
        }
      } else if (node.type === "BlockStatement") scope = { bindings: new Map(), parent: scope };
      contexts.set(node, { module, scope, parent });
      if (node.type === "VariableDeclarator") {
        const loop = contexts.get(parent)?.parent;
        bind(
          node.id,
          {
            node: node.init,
            collection: loop?.type === "ForOfStatement" ? loop.right : undefined,
            module,
            scope,
            type: node.id.typeAnnotation?.typeAnnotation,
          },
          scope,
        );
      }
      if (["TSTypeAliasDeclaration", "TSInterfaceDeclaration"].includes(node.type))
        scope.bindings.set(node.id.name, {
          type: node.typeAnnotation ?? node.body,
          declaration: node,
          module,
          scope,
        });
      if (node.type === "ImportDeclaration")
        for (const specifier of node.specifiers) {
          const binding = {
            imported:
              specifier.imported?.name ??
              (specifier.type === "ImportDefaultSpecifier" ? "default" : "*"),
            from: node.source.value,
            module,
            scope,
          };
          scope.bindings.set(specifier.local.name, binding);
          module.imports.set(specifier.local.name, binding);
        }
      if (node.type === "ExportNamedDeclaration") {
        if (node.declaration?.id)
          module.exports.set(node.declaration.id.name, node.declaration.id.name);
        if (node.declaration?.declarations)
          for (const declaration of node.declaration.declarations)
            if (declaration.id.name) module.exports.set(declaration.id.name, declaration.id.name);
        for (const specifier of node.specifiers ?? [])
          module.exports.set(
            specifier.exported.name,
            node.source
              ? { from: node.source.value, imported: specifier.local.name, module }
              : specifier.local.name,
          );
      }
      if (node.type === "ExportDefaultDeclaration")
        module.exports.set("default", { node: node.declaration, module, scope });
      for (const [key, child] of Object.entries(node)) {
        if (["loc", "start", "end", "comments", "tokens"].includes(key)) continue;
        if (Array.isArray(child)) child.forEach((item) => index(item, scope, node));
        else if (child && typeof child === "object") index(child, scope, node);
      }
    }
    index(module.ast, module.root, null);
    return module;
  }
  for (const path of paths) await load(path);

  /**
   * Finds the nearest declaration, preserving shadowed identifiers.
   * @param {string} name Identifier.
   * @param {object} scope Actual lexical scope.
   * @returns {object|undefined} Declared binding.
   */
  function lookup(name, scope) {
    for (let current = scope; current; current = current.parent)
      if (current.bindings.has(name)) return current.bindings.get(name);
  }

  /**
   * Resolves local source imports, including explicit .js-to-.ts and project @/ imports.
   * @param {object} binding Import binding.
   * @param {Set<object>} trail Re-export cycle guard.
   * @returns {Promise<object|undefined>} Actual exported declaration.
   */
  async function imported(binding, trail = new Set()) {
    if (trail.has(binding)) return;
    trail = new Set(trail).add(binding);
    let target;
    if (binding.from.startsWith(".")) target = resolve(dirname(binding.module.path), binding.from);
    else if (binding.from.startsWith("@/")) {
      const root = roots.find((root) => binding.module.path.startsWith(root + "/"));
      if (root) target = resolve(root, binding.from.slice(2));
    } else if (binding.from === "@miaixz/ui" || binding.from.startsWith("@miaixz/ui/"))
      target = resolve(
        uiSourceRoot,
        binding.from.slice("@miaixz/ui".length).replace(/^\//u, "") || "index.ts",
      );
    if (!target) return;
    if (extname(target) && !/\.(?:[cm]?[jt]sx?|json)$/u.test(target)) return;
    const base = /\.[cm]?js$/u.test(target) ? target.slice(0, -extname(target).length) : target;
    const candidates = [
      target,
      ...[".ts", ".tsx", ".mts", ".js", ".jsx", ".json", "/index.ts", "/index.tsx"].map(
        (extension) => base + extension,
      ),
    ];
    let module;
    for (const path of candidates) {
      try {
        if ((await stat(path)).isFile()) {
          module = await load(path);
          break;
        }
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      }
    }
    if (!module) return;
    if (module.json) return { json: module.json, module };
    const exported = module.exports.get(binding.imported);
    const result = typeof exported === "string" ? lookup(exported, module.root) : exported;
    return result?.from ? imported(result, trail) : result;
  }

  /**
   * Resolves declared icon domains; plain string and any are never generic icon domains.
   * @param {object} type Type syntax.
   * @param {object} scope Declaring lexical scope.
   * @param {string[]} keys Member path.
   * @param {Set<object>} trail Type recursion guard.
   * @returns {Promise<boolean>} Proven public icon-name domain.
   */
  async function iconType(type, scope, keys = [], trail = new Set()) {
    if (!type || trail.has(type)) return false;
    trail = new Set(trail).add(type);
    if (type.type === "TSTypeAnnotation") return iconType(type.typeAnnotation, scope, keys, trail);
    if (["TSUnionType", "TSIntersectionType"].includes(type.type)) {
      const parts = type.types.filter(
        (part) => !["TSUndefinedKeyword", "TSNullKeyword", "TSNeverKeyword"].includes(part.type),
      );
      return (
        parts.length > 0 &&
        (type.type === "TSUnionType"
          ? (await Promise.all(parts.map((part) => iconType(part, scope, keys, trail)))).every(
              Boolean,
            )
          : (await Promise.all(parts.map((part) => iconType(part, scope, keys, trail)))).some(
              Boolean,
            ))
      );
    }
    if (type.type === "TSLiteralType") return !keys.length && names.has(type.literal.value);
    if (type.type === "TSArrayType" && keys.length)
      return iconType(type.elementType, scope, keys.slice(1), trail);
    if (type.type === "TSTypeOperator") return iconType(type.typeAnnotation, scope, keys, trail);
    if (["TSTypeLiteral", "TSInterfaceBody"].includes(type.type) && keys.length) {
      const member = (type.members ?? type.body).find(
        (member) => (member.key?.name ?? member.key?.value) === keys[0],
      );
      return iconType(member?.typeAnnotation, scope, keys.slice(1), trail);
    }
    if (type.type === "TSTypeReference") {
      const name = type.typeName.name;
      const binding = lookup(name, scope);
      if (binding?.from === "@miaixz/icons" && binding.imported === "IconName") return !keys.length;
      if (binding?.from === "@miaixz/icons" && binding.imported === "IconProps")
        return keys.length === 1 && keys[0] === "name";
      if (["Array", "ReadonlyArray"].includes(name) && keys.length)
        return iconType(
          (type.typeArguments ?? type.typeParameters)?.params[0],
          scope,
          keys.slice(1),
          trail,
        );
      if (["Pick", "Omit"].includes(name) && keys.length) {
        const selector = (type.typeArguments ?? type.typeParameters)?.params[1];
        const parts = selector?.type === "TSUnionType" ? selector.types : [selector];
        if (parts.some((part) => part?.type !== "TSLiteralType")) return false;
        const included = parts.some((part) => part.literal.value === keys[0]);
        if (name === "Pick" ? !included : included) return false;
      }
      if (
        [
          "Partial",
          "Required",
          "Readonly",
          "Pick",
          "Omit",
          "Extract",
          "Exclude",
          "NonNullable",
        ].includes(name)
      )
        return iconType((type.typeArguments ?? type.typeParameters)?.params[0], scope, keys, trail);
      let resolved = binding;
      if (binding?.from) resolved = await imported(binding);
      if (resolved) {
        if (await iconType(resolved.type, resolved.scope, keys, trail)) return true;
        for (const extension of resolved.declaration?.extends ?? [])
          if (
            await iconType(
              {
                type: "TSTypeReference",
                typeName: extension.expression,
                typeParameters: extension.typeArguments ?? extension.typeParameters,
              },
              resolved.scope,
              keys,
              trail,
            )
          )
            return true;
      }
    }
    return false;
  }

  /**
   * Resolves finite values and typed public parameter provenance without trusting casts.
   * @param {object} node Expression syntax.
   * @param {Set<object>} trail Binding recursion guard.
   * @param {Map<object,any[]>} substitutions Actual argument values scoped to this call.
   * @returns {Promise<any[]>} Finite values or explicit unknown/non-icon/domain sentinels.
   */
  async function values(node, trail = new Set(), substitutions = new Map()) {
    if (!node) return [unknown];
    const context = contexts.get(node);
    if (node.type === "JSXExpressionContainer")
      return values(node.expression, trail, substitutions);
    if (["StringLiteral", "NumericLiteral"].includes(node.type)) return [node.value];
    if (node.type === "NullLiteral" || (node.type === "Identifier" && node.name === "undefined"))
      return [];
    if (["JSXElement", "JSXFragment"].includes(node.type)) return [nonIcon];
    if (
      [
        "TSAsExpression",
        "TSSatisfiesExpression",
        "TSNonNullExpression",
        "TypeCastExpression",
      ].includes(node.type)
    )
      return values(node.expression, trail, substitutions);
    if (node.type === "ConditionalExpression")
      return [
        ...(await values(node.consequent, trail, substitutions)),
        ...(await values(node.alternate, trail, substitutions)),
      ];
    if (node.type === "LogicalExpression")
      return [
        ...(await values(node.left, trail, substitutions)).filter((value) => value !== absent),
        ...(await values(node.right, trail, substitutions)),
      ];
    if (node.type === "TemplateLiteral" && !node.expressions.length)
      return [node.quasis[0].value.cooked];
    if (node.type === "ArrayExpression")
      return [
        (
          await Promise.all(
            node.elements.map((item) =>
              item?.type === "SpreadElement"
                ? values(item.argument, trail, substitutions)
                : values(item, trail, substitutions),
            ),
          )
        ).flat(),
      ];
    if (node.type === "ObjectExpression") {
      const map = new Map();
      for (const property of node.properties) {
        if (property.type === "SpreadElement")
          for (const source of await values(property.argument, trail, substitutions)) {
            if (!(source instanceof Map)) return [unknown];
            for (const [key, value] of source) map.set(key, value);
          }
        else if (property.type === "ObjectProperty") {
          const key = property.computed
            ? (await values(property.key, trail, substitutions))[0]
            : (property.key.name ?? property.key.value);
          map.set(key, await values(property.value, trail, substitutions));
        }
      }
      return [map];
    }
    if (node.type === "Identifier") {
      const binding = lookup(node.name, context?.scope);
      if (substitutions.has(binding)) return substitutions.get(binding);
      if (!binding || trail.has(binding)) return [unknown];
      const next = new Set(trail).add(binding);
      if (binding.from) {
        const target = await imported(binding);
        if (!target) return [unknown];
        if (target.json) return [jsonValue(target.json)];
        return bindingValues(target, next, substitutions);
      }
      return bindingValues(binding, next, substitutions);
    }
    if (["MemberExpression", "OptionalMemberExpression"].includes(node.type)) {
      const keys = node.computed
        ? await values(node.property, trail, substitutions)
        : [node.property.name];
      return members(await values(node.object, trail, substitutions), keys);
    }
    if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
      if (
        node.callee.object?.name === "Object" &&
        node.callee.property?.name === "freeze" &&
        !lookup("Object", context?.scope)
      )
        return values(node.arguments[0], trail, substitutions);
      /**
       * Owned slot properties are final overrides; user slot values cannot replace these names.
       */
      const slotBinding =
        node.callee.type === "Identifier" ? lookup(node.callee.name, context?.scope) : undefined;
      if (
        slotBinding?.imported === "mergeMiaixzSlotProps" &&
        /\/shared\/slots\.js$/u.test(slotBinding.from)
      ) {
        const inputs = await values(node.arguments[0], trail, substitutions);
        return inputs.flatMap((input) => {
          if (!(input instanceof Map)) return [unknown];
          const internal = input.get("internalProps") ?? [];
          const owned = (input.get("ownedProps") ?? []).flat(Infinity);
          return internal.map((map) =>
            map instanceof Map ? new Map([...map].filter(([key]) => owned.includes(key))) : unknown,
          );
        });
      }
      if (["filter", "find", "at"].includes(node.callee.property?.name)) {
        const collection = await values(node.callee.object, trail, substitutions);
        return node.callee.property.name === "filter" ? collection : members(collection, [unknown]);
      }
      const binding =
        node.callee.type === "Identifier" ? lookup(node.callee.name, context?.scope) : undefined;
      const target = binding?.from ? await imported(binding) : binding;
      const fn = target?.node;
      if (!fn || !/Function/u.test(fn.type) || trail.has(fn)) return [unknown];
      const next = new Set(trail).add(fn),
        returns = [],
        callValues = new Map(substitutions);
      const scope = contexts.get(fn).scope;
      for (let index = 0; index < fn.params.length; index++) {
        const parameter = fn.params[index];
        if (parameter.type === "Identifier")
          callValues.set(
            lookup(parameter.name, scope),
            await values(node.arguments[index], trail, substitutions),
          );
      }
      if (fn.body.type !== "BlockStatement") return values(fn.body, next, callValues);
      /**
       * Collects this function's returns but never nested callback returns.
       * @param {object} item Current syntax node.
       * @returns {void} Adds actual return expressions.
       */
      function collect(item) {
        if (!item || typeof item.type !== "string") return;
        if (item !== fn.body && /Function|Method/u.test(item.type)) return;
        if (item.type === "ReturnStatement") returns.push(item.argument);
        else
          for (const child of Object.values(item)) {
            if (Array.isArray(child)) child.forEach(collect);
            else if (child && typeof child === "object") collect(child);
          }
      }
      collect(fn.body);
      return returns.length
        ? (await Promise.all(returns.map((item) => values(item, next, callValues)))).flat()
        : [unknown];
    }
    return [unknown];
  }

  /**
   * Converts imported JSON data into the same finite object representation.
   * @param {any} value Parsed JSON.
   * @returns {any} Finite value representation.
   */
  function jsonValue(value) {
    if (Array.isArray(value)) return value.map(jsonValue);
    if (value && typeof value === "object")
      return new Map(Object.entries(value).map(([key, child]) => [key, [jsonValue(child)]]));
    return value;
  }

  /**
   * Reads literal and typed-public member paths without conflating unknown string domains.
   * @param {any[]} objects Object alternatives.
   * @param {any[]} keys Actual member keys.
   * @returns {Promise<any[]>} Selected alternatives.
   */
  async function members(objects, keys) {
    const result = [];
    for (const object of objects) {
      const dynamic = keys.some((key) => typeof key !== "string" && typeof key !== "number");
      if (object instanceof Map)
        result.push(
          ...(dynamic
            ? [...object.values()].flat()
            : keys.flatMap((key) => object.get(key) ?? [absent])),
        );
      else if (Array.isArray(object))
        result.push(
          ...(dynamic ? object.flat() : keys.flatMap((key) => [object[key] ?? unknown].flat())),
        );
      else if (object?.parameter)
        for (const key of keys) {
          const path = [...object.keys, typeof key === "symbol" ? "*" : key];
          result.push(
            (await iconType(object.type, object.scope, path))
              ? { generic: true }
              : { ...object, keys: path },
          );
        }
      else result.push(unknown);
    }
    return result;
  }

  /**
   * Evaluates a declaration with destructuring and public parameter provenance.
   * @param {object} binding Declared source binding.
   * @param {Set<object>} trail Current cycle guard.
   * @param {Map<object,any[]>} substitutions Actual argument values scoped to this call.
   * @returns {Promise<any[]>} Resolved alternatives.
   */
  async function bindingValues(binding, trail, substitutions = new Map()) {
    if (binding.from) {
      const target = await imported(binding);
      if (!target || trail.has(target)) return [unknown];
      return target ? bindingValues(target, new Set(trail).add(target), substitutions) : [unknown];
    }
    if (binding.collection)
      return members(await values(binding.collection, trail, substitutions), [unknown]);
    if (binding.parameter) {
      if (await iconType(binding.type, binding.scope, binding.keys)) return [{ generic: true }];
      return [{ parameter: true, type: binding.type, scope: binding.scope, keys: binding.keys }];
    }
    let result = await values(binding.node, trail, substitutions);
    for (const key of binding.keys ?? []) result = await members(result, [key]);
    return result;
  }

  /**
   * Records only actual consumption alternatives with their source locations.
   * @param {object} node Actual consumption expression.
   * @param {string} kind Consumption category.
   * @param {boolean} strict Whether unknown values must fail.
   * @param {boolean} recursive Whether this is a complete typed name map.
   * @param {any[]|undefined} supplied Already resolved spread values.
   * @returns {Promise<void>} Adds in-memory diagnostics.
   */
  async function record(node, kind, strict = true, recursive = false, supplied) {
    if (!node) return;
    const module = contexts.get(node)?.module;
    const site = { path: module.path, line: node.loc.start.line, kind };
    const flatten = (value) =>
      Array.isArray(value)
        ? value.flatMap(flatten)
        : recursive && value instanceof Map
          ? [...value.values()].flatMap(flatten)
          : [value];
    for (const value of (supplied ?? (await values(node))).flatMap(flatten)) {
      const key =
        site.path +
        "|" +
        node.start +
        "|" +
        kind +
        "|" +
        (typeof value === "string" ? value : value?.generic ? "generic" : "unknown");
      if (seen.has(key)) continue;
      seen.add(key);
      if (value?.generic) genericConsumers.push(site);
      else if (typeof value === "string" && names.has(value))
        references.push({ ...site, name: value });
      else if (value === nonIcon) nonIconSymbols.push({ ...site, value: "JSX content" });
      else if (strict)
        unresolved.push({
          ...site,
          ...(typeof value === "string" ? { name: value } : {}),
          reason:
            typeof value === "string"
              ? "Unknown icon name."
              : "Cannot resolve the complete icon-name expression.",
        });
      else if (typeof value === "string") nonIconSymbols.push({ ...site, value });
    }
  }

  for (const path of paths) {
    const module = modules.get(path);
    if (!module.ast) continue;
    const components = new Map(),
      factories = new Set();
    for (const [name, binding] of module.imports) {
      if (binding.from === "@miaixz/icons" && binding.imported === "Icon")
        components.set(name, "name");
      if (
        (binding.from === "@miaixz/ui" || /(?:^|\/)icon-button(?:\.js)?$/u.test(binding.from)) &&
        binding.imported === "IconButton"
      )
        components.set(name, "icon");
      if (binding.from === "react" && binding.imported === "createElement") factories.add(name);
      if (binding.from === "react" && ["*", "default"].includes(binding.imported))
        factories.add(name + ".createElement");
    }
    const nodes = [];
    visit(module.ast, (node) => nodes.push(node));
    for (const node of nodes) {
      if (node.type === "JSXOpeningElement" && components.has(node.name.name)) {
        const attribute = components.get(node.name.name);
        let selected = [absent],
          origin = node;
        for (const item of node.attributes) {
          if (item.name?.name === attribute) {
            selected = await values(item.value);
            origin = item.value;
          }
          if (item.type === "JSXSpreadAttribute") {
            const spread = await values(item.argument);
            const alternatives = spread.flatMap((value) =>
              value instanceof Map ? (value.get(attribute) ?? selected) : [unknown],
            );
            selected = alternatives;
            origin = item.argument;
          }
        }
        await record(origin, "jsx", true, false, selected);
      }
      if (
        node.type === "ObjectProperty" &&
        contexts.get(node)?.parent?.type === "ObjectExpression" &&
        ["icon", "iconName"].includes(node.key.name ?? node.key.value)
      ) {
        const alternatives = await values(node.value);
        const textual = alternatives.filter((value) => typeof value === "string");
        const iconLike = textual.some(
          (value) => !/^(?:https?:|data:|\/|\.\/)/u.test(value) && /^[a-z][a-z0-9-]*$/u.test(value),
        );
        await record(node.value, "configuration", iconLike, false, alternatives);
      }
      if (node.type === "VariableDeclarator") {
        let annotation = false;
        visit(node.id.typeAnnotation, (item) => {
          if (item.type === "Identifier" && /IconName$/u.test(item.name)) annotation = true;
        });
        if (annotation) await record(node.init, "typed-map", true, true);
      }
      if (node.type === "ReturnStatement") {
        let parent = contexts.get(node)?.parent;
        while (parent && !/Function|Method/u.test(parent.type))
          parent = contexts.get(parent)?.parent;
        if (parent?.returnType && (await iconType(parent.returnType, contexts.get(parent).scope)))
          await record(node.argument, "typed-return");
      }
      if (node.type === "CallExpression") {
        const factory =
          node.callee.name ?? node.callee.object?.name + "." + node.callee.property?.name;
        if (factories.has(factory) && components.has(node.arguments[0]?.name))
          await record(
            node.arguments[1],
            "create-element",
            true,
            false,
            await members(await values(node.arguments[1]), [
              components.get(node.arguments[0].name),
            ]),
          );
      }
    }
  }
  return {
    names: [...new Set(references.map((item) => item.name))].sort(),
    references,
    genericConsumers,
    nonIconSymbols,
    unresolved,
  };
}

/**
 * Rejects record-writing and silently narrowed modes.
 * @param {string[]} args CLI arguments.
 * @returns {{mode:string}} Read-only mode.
 */
export function parseArguments(args) {
  if (args.length !== 2 || args[0] !== "--mode" || args[1] !== "check")
    throw new Error("Expected --mode check; consumer records are disabled.");
  return { mode: "check" };
}

/**
 * Checks real consumers; unresolved expressions are visible failures, never an empty success.
 * @param {string[]} args CLI arguments.
 * @returns {Promise<object>} Current in-memory scan.
 */
export async function main(args = process.argv.slice(2)) {
  parseArguments(args);
  const result = await readIconConsumers();
  if (result.unresolved.length)
    throw new Error("Unresolved icon consumers: " + JSON.stringify(result.unresolved));
  console.log(
    "Read " +
      result.names.length +
      " finite icon names and " +
      result.genericConsumers.length +
      " typed public consumers. No files written.",
  );
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
