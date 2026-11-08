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
 * Describes a recursively readonly value without changing function signatures.
 *
 * @typeParam Value - Value whose nested properties become readonly.
 * @public
 */
export type MiaixzDeepReadonly<Value> = Value extends (...arguments_: never[]) => unknown
  ? Value
  : Value extends readonly (infer Item)[]
    ? readonly MiaixzDeepReadonly<Item>[]
    : Value extends object
      ? { readonly [Key in keyof Value]: MiaixzDeepReadonly<Value[Key]> }
      : Value;

/**
 * Supplies a caller-owned error boundary for invalid JSON snapshot values.
 *
 * @public
 */
export interface MiaixzJsonOptions {
  /**
   * Throws the caller's validation error for the supplied path and expectation.
   * A callback that returns at runtime falls back to the default TypeError.
   */
  readonly onInvalid?: (path: string, expectation: string) => never;
}

/**
 * Rejects one invalid value without retaining or exposing the value itself.
 *
 * @param path - Path of the invalid value.
 * @param expectation - Description of the accepted value.
 * @param options - Optional caller-owned validation error callback.
 * @returns This function never returns.
 */
function rejectJsonValue(
  path: string,
  expectation: string,
  options: MiaixzJsonOptions | undefined,
): never {
  options?.onInvalid?.(path, expectation);
  throw new TypeError(`Invalid JSON data at ${path}: expected ${expectation}.`);
}

/**
 * Appends an object key or array index using the snapshot's path notation.
 *
 * @param parent - Parent value path.
 * @param key - Object key or array index.
 * @returns Path of the nested value.
 */
function jsonPath(parent: string, key: number | string): string {
  return typeof key === "number" ? `${parent}[${key}]` : `${parent}.${key}`;
}

/**
 * Copies a JSON value while rejecting cycles only along the active ancestor path.
 *
 * @param input - Value to validate and copy.
 * @param path - Current validation path.
 * @param ancestors - Objects in the active recursion path.
 * @param options - Optional caller-owned validation error callback.
 * @returns Independent JSON value with the original array holes preserved.
 */
function cloneJsonValue(
  input: unknown,
  path: string,
  ancestors: WeakSet<object>,
  options: MiaixzJsonOptions | undefined,
): unknown {
  if (input === null || typeof input === "string" || typeof input === "boolean") {
    return input;
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      rejectJsonValue(path, "a finite JSON number", options);
    }
    return input;
  }

  if (typeof input !== "object") {
    rejectJsonValue(path, "a JSON-compatible value", options);
  }

  if (ancestors.has(input)) {
    rejectJsonValue(path, "an acyclic JSON value", options);
  }
  ancestors.add(input);

  try {
    if (Array.isArray(input)) {
      return input.map((item, index) =>
        cloneJsonValue(item, jsonPath(path, index), ancestors, options),
      );
    }

    const prototype = Object.getPrototypeOf(input) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      rejectJsonValue(path, "a plain JSON object", options);
    }

    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        cloneJsonValue(value, jsonPath(path, key), ancestors, options),
      ]),
    );
  } finally {
    ancestors.delete(input);
  }
}

/**
 * Freezes a snapshot in place, stopping at primitives and already frozen nodes.
 *
 * @param input - Previously validated snapshot to freeze.
 */
function freezeJsonValue(input: unknown): void {
  if (typeof input !== "object" || input === null || Object.isFrozen(input)) {
    return;
  }

  for (const value of Object.values(input)) {
    freezeJsonValue(value);
  }
  Object.freeze(input);
}

/**
 * Determines whether a value is a plain record eligible for recursive merging.
 *
 * @param input - Value to inspect.
 * @returns Whether the value has the ordinary object prototype or no prototype.
 */
function isPlainJsonObject(input: unknown): input is Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(input) as object | null;
  return prototype === Object.prototype || prototype === null;
}

/**
 * Validates and clones finite, acyclic JSON values starting at the path `$`.
 *
 * Object entries retain their existing getter reads; symbol and non-enumerable
 * properties are omitted. Null-prototype records become ordinary object copies.
 * Undefined values are rejected, while shared objects without cycles are copied.
 *
 * @typeParam Value - Type of the input and resulting independent snapshot.
 * @param input - Value to validate and copy.
 * @param options - Optional callback that throws a caller-owned validation error.
 * @returns Independent snapshot retaining the input's value type.
 * @throws TypeError When validation fails without a throwing caller callback.
 * @public
 */
export function cloneMiaixzJsonValue<Value>(input: Value, options?: MiaixzJsonOptions): Value {
  return cloneJsonValue(input, "$", new WeakSet(), options) as Value;
}

/**
 * Freezes a previously cloned JSON snapshot in place and returns the same value.
 *
 * This operation does not validate or clone its input. Primitives, including
 * undefined, are unchanged, and already frozen nodes are not traversed again.
 *
 * @typeParam Value - Type of the snapshot to freeze.
 * @param input - Previously validated snapshot.
 * @returns The same value with a recursively readonly type.
 * @public
 */
export function freezeMiaixzJsonValue<Value>(input: Value): MiaixzDeepReadonly<Value> {
  freezeJsonValue(input);
  return input as MiaixzDeepReadonly<Value>;
}

/**
 * Merges plain JSON records, replacing arrays and all other values with a clone.
 *
 * Each cloned branch starts its validation path at `$`. If either input is not a
 * plain record, only the patch is cloned and validated. Results remain unfrozen.
 * Special property names remain own data properties and never modify the
 * result's prototype.
 *
 * @param base - Existing value used only when both inputs are plain records.
 * @param patch - Replacement value or recursively merged plain record.
 * @param options - Optional callback that throws a caller-owned validation error.
 * @returns Independent merged value without a domain-specific type assertion.
 * @throws TypeError When a cloned branch fails validation without a throwing callback.
 * @public
 */
export function mergeMiaixzJsonValue(
  base: unknown,
  patch: unknown,
  options?: MiaixzJsonOptions,
): unknown {
  if (!isPlainJsonObject(base) || !isPlainJsonObject(patch)) {
    return cloneMiaixzJsonValue(patch, options);
  }

  const result = cloneMiaixzJsonValue(base, options);
  for (const [key, patchValue] of Object.entries(patch)) {
    const value = Object.hasOwn(result, key)
      ? mergeMiaixzJsonValue(result[key], patchValue, options)
      : cloneMiaixzJsonValue(patchValue, options);
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  }
  return result;
}
