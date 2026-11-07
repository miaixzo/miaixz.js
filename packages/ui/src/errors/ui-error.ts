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
 * Maps every stable UI error code to its sole locale key.
 *
 * @public
 */
export const miaixzUiErrorMessageKeys = Object.freeze({
  UI_ACCESSIBLE_NAME_INVALID: "ui.error.accessible.nameInvalid",
  UI_SLOT_OWNED_PROP_CONFLICT: "ui.error.slot.ownedPropConflict",
  UI_ANCHOR_RENDERER_INVALID: "ui.error.anchor.rendererInvalid",
  UI_ACTION_DUPLICATE_ID: "ui.error.action.duplicateId",
  UI_ACTION_LABEL_VISIBILITY_REQUIRES_ICON: "ui.error.action.labelVisibilityRequiresIcon",
  UI_AVATAR_GROUP_MAX_INVALID: "ui.error.avatarGroup.maxInvalid",
  UI_AVATAR_GROUP_TOTAL_INVALID: "ui.error.avatarGroup.totalInvalid",
  UI_AVATAR_GROUP_SPACING_INVALID: "ui.error.avatarGroup.spacingInvalid",
  UI_FIELD_MULTIPLE_CONTROLS: "ui.error.field.multipleControls",
  UI_FIELD_CONTROL_ID_INVALID: "ui.error.field.controlIdInvalid",
  UI_FIELD_REQUIRED_CONFLICT: "ui.error.field.requiredConflict",
  UI_FIELD_INVALID_CONFLICT: "ui.error.field.invalidConflict",
  UI_FIELD_DISABLED_CONFLICT: "ui.error.field.disabledConflict",
  UI_NUMBER_INPUT_STEP_INVALID: "ui.error.numberInput.stepInvalid",
  UI_NUMBER_INPUT_PRECISION_INVALID: "ui.error.numberInput.precisionInvalid",
  UI_NUMBER_INPUT_RANGE_INVALID: "ui.error.numberInput.rangeInvalid",
  UI_SEGMENTED_ITEMS_EMPTY: "ui.error.segmented.itemsEmpty",
  UI_SEGMENTED_NO_ENABLED_ITEM: "ui.error.segmented.noEnabledItem",
  UI_SEGMENTED_DUPLICATE_VALUE: "ui.error.segmented.duplicateValue",
  UI_SEGMENTED_VALUE_INVALID: "ui.error.segmented.valueInvalid",
  UI_TEXTAREA_ROWS_INVALID: "ui.error.textarea.rowsInvalid",
  UI_TIME_PICKER_STEP_INVALID: "ui.error.timePicker.stepInvalid",
  UI_TIME_PICKER_RANGE_INVALID: "ui.error.timePicker.rangeInvalid",
  UI_RATING_MAX_INVALID: "ui.error.rating.maxInvalid",
  UI_RATING_PRECISION_INVALID: "ui.error.rating.precisionInvalid",
  UI_RATING_VALUE_INVALID: "ui.error.rating.valueInvalid",
  UI_COLLECTION_DUPLICATE_ID: "ui.error.collection.duplicateId",
  UI_COLLECTION_DUPLICATE_VALUE: "ui.error.collection.duplicateValue",
  UI_COLLECTION_TEXT_VALUE_INVALID: "ui.error.collection.textValueInvalid",
  UI_COLLECTION_VISIBLE_LIMIT: "ui.error.collection.visibleLimit",
  UI_SELECT_EMPTY_OPTION_VALUE: "ui.error.select.emptyOptionValue",
  UI_TOOLTIP_TRIGGER_INVALID: "ui.error.tooltip.triggerInvalid",
  UI_TOOLTIP_DELAY_INVALID: "ui.error.tooltip.delayInvalid",
  UI_POPOVER_TRIGGER_INVALID: "ui.error.popover.triggerInvalid",
  UI_POPOVER_OFFSET_INVALID: "ui.error.popover.offsetInvalid",
  UI_DRAWER_WIDTH_INVALID: "ui.error.drawer.widthInvalid",
  UI_DRAWER_INSET_INVALID: "ui.error.drawer.insetInvalid",
  UI_UPLOAD_CONCURRENCY_INVALID: "ui.error.upload.concurrencyInvalid",
  UI_UPLOAD_RETRY_POLICY_INVALID: "ui.error.upload.retryPolicyInvalid",
  UI_UPLOAD_DUPLICATE_FILE_ID: "ui.error.upload.duplicateFileId",
  UI_UPLOAD_FILE_STATE_INVALID: "ui.error.upload.fileStateInvalid",
  UI_LOCALE_UPDATE_FAILED: "ui.error.locale.updateFailed",
  UI_LOCALE_GLOBAL_DUPLICATE: "ui.error.locale.globalDuplicate",
  UI_APPEARANCE_POSITION_INVALID: "ui.error.appearance.positionInvalid",
  UI_PAGINATION_PAGE_COUNT_INVALID: "ui.error.pagination.pageCountInvalid",
  UI_PAGINATION_PAGE_INVALID: "ui.error.pagination.pageInvalid",
  UI_PAGINATION_SIBLING_COUNT_INVALID: "ui.error.pagination.siblingCountInvalid",
  UI_NAVIGATION_DUPLICATE_ID: "ui.error.navigation.duplicateId",
  UI_NAVIGATION_TEXT_VALUE_INVALID: "ui.error.navigation.textValueInvalid",
  UI_TABS_DUPLICATE_VALUE: "ui.error.tabs.duplicateValue",
  UI_TABS_VALUE_INVALID: "ui.error.tabs.valueInvalid",
  UI_PROGRESS_MAX_INVALID: "ui.error.progress.maxInvalid",
  UI_PROGRESS_VALUE_INVALID: "ui.error.progress.valueInvalid",
  UI_DONUT_DUPLICATE_SEGMENT_ID: "ui.error.donut.duplicateSegmentId",
  UI_DONUT_VALUE_INVALID: "ui.error.donut.valueInvalid",
  UI_COLUMNS_SERIES_COUNT_INVALID: "ui.error.columns.seriesCountInvalid",
  UI_COLUMNS_DUPLICATE_SERIES_ID: "ui.error.columns.duplicateSeriesId",
  UI_COLUMNS_VALUE_LENGTH_INVALID: "ui.error.columns.valueLengthInvalid",
  UI_COLUMNS_VALUE_INVALID: "ui.error.columns.valueInvalid",
  UI_COLUMNS_MAXIMUM_INVALID: "ui.error.columns.maximumInvalid",
  UI_HEATMAP_DIMENSIONS_INVALID: "ui.error.heatmap.dimensionsInvalid",
  UI_HEATMAP_LEVEL_INVALID: "ui.error.heatmap.levelInvalid",
  UI_PAGE_LABELLED_BY_INVALID: "ui.error.page.labelledByInvalid",
  UI_PANEL_LABEL_INVALID: "ui.error.panel.labelInvalid",
  UI_TOAST_DURATION_INVALID: "ui.error.toast.durationInvalid",
  UI_TOASTER_MAX_VISIBLE_INVALID: "ui.error.toaster.maxVisibleInvalid",
  UI_TREE_VISIBLE_LIMIT: "ui.error.tree.visibleLimit",
  UI_TREE_TEXT_VALUE_INVALID: "ui.error.tree.textValueInvalid",
  UI_TREE_CONFIG_INVALID: "ui.error.tree.configInvalid",
  UI_STEPS_DUPLICATE_ID: "ui.error.steps.duplicateId",
  UI_TIMELINE_DUPLICATE_ID: "ui.error.timeline.duplicateId",
  UI_GRAPH_DUPLICATE_NODE_ID: "ui.error.graph.duplicateNodeId",
  UI_GRAPH_NODE_POSITION_INVALID: "ui.error.graph.nodePositionInvalid",
  UI_GRAPH_DUPLICATE_EDGE_ID: "ui.error.graph.duplicateEdgeId",
  UI_GRAPH_EDGE_ENDPOINT_MISSING: "ui.error.graph.edgeEndpointMissing",
  UI_CONTROLLED_VALUE_INVALID: "ui.error.controlled.valueInvalid",
  UI_FILE_COUNT_EXCEEDED: "ui.error.file.countExceeded",
  UI_FILE_MAX_FILES_INVALID: "ui.error.file.maxFilesInvalid",
  UI_FILE_MAX_SIZE_INVALID: "ui.error.file.maxSizeInvalid",
  UI_FILE_TOO_LARGE: "ui.error.file.tooLarge",
  UI_FILE_TYPE_NOT_ACCEPTED: "ui.error.file.typeNotAccepted",
  UI_LOCALE_PROVIDER_MISSING: "ui.error.locale.providerMissing",
  UI_OPTIONS_SOURCE_INVALID: "ui.error.options.sourceInvalid",
  UI_SELECTION_LIMIT_INVALID: "ui.error.selection.limitInvalid",
  UI_TABLE_DUPLICATE_COLUMN_ID: "ui.error.table.duplicateColumnId",
  UI_TABLE_DUPLICATE_ROW_ID: "ui.error.table.duplicateRowId",
  UI_THEME_NOT_FOUND: "ui.theme.notFound",
  UI_THEME_LOAD_FAILED: "ui.theme.loadFailed",
  UI_THEME_LOAD_ABORTED: "ui.theme.loadAborted",
  UI_THEME_INVALID: "ui.theme.invalid",
  UI_THEME_TOKEN_UNKNOWN: "ui.theme.tokenUnknown",
  UI_THEME_TOKEN_MISSING: "ui.theme.tokenMissing",
  UI_THEME_GEOMETRY_INVALID: "ui.theme.geometryInvalid",
  UI_THEME_SURFACE_INVALID: "ui.theme.surfaceInvalid",
  UI_THEME_CONTRAST_INVALID: "ui.theme.contrastInvalid",
  UI_THEME_INHERITANCE_INVALID: "ui.theme.inheritanceInvalid",
  UI_THEME_SCHEMA_UNSUPPORTED: "ui.theme.schemaUnsupported",
  UI_THEME_DUPLICATE: "ui.theme.duplicate",
  UI_THEME_FALLBACK_INVALID: "ui.theme.fallbackInvalid",
  UI_THEME_GLOBAL_DUPLICATE: "ui.theme.globalDuplicate",
  UI_THEME_APPLY_FAILED: "ui.theme.applyFailed",
  UI_THEME_PERSIST_FAILED: "ui.theme.persistFailed",
  UI_TOAST_PROVIDER_MISSING: "ui.error.toast.providerMissing",
  UI_TREE_DUPLICATE_ID: "ui.error.tree.duplicateId",
  UI_UPLOAD_PROGRESS_INVALID: "ui.error.upload.progressInvalid",
} as const);

/**
 * Enumerates every stable UI error code.
 *
 * @public
 */
export type MiaixzUiErrorCode = keyof typeof miaixzUiErrorMessageKeys;

/**
 * Maps every development-only warning code to its sole locale key.
 *
 * @public
 */
export const miaixzUiWarningMessageKeys = Object.freeze({
  UI_CONTROLLED_MODE_CHANGED: "ui.warning.controlled.modeChanged",
} as const);

/**
 * Enumerates development-only UI warnings.
 *
 * @public
 */
export type MiaixzUiWarningCode = keyof typeof miaixzUiWarningMessageKeys;

const miaixzUiSensitiveDetailKeys = new Set([
  "accesstoken",
  "account",
  "address",
  "apikey",
  "authorization",
  "body",
  "content",
  "cookie",
  "csrf",
  "data",
  "email",
  "filecontent",
  "filename",
  "filepath",
  "fullname",
  "idcard",
  "key",
  "mobile",
  "name",
  "password",
  "phone",
  "proxyauthorization",
  "realname",
  "refreshtoken",
  "secret",
  "setcookie",
  "token",
  "user",
  "userid",
  "username",
  "xapikey",
  "xcsrftoken",
]);
const miaixzUiErrorMaximumDepth = 8;
const miaixzUiErrorMaximumCollectionSize = 100;
const miaixzUiErrorMaximumStringLength = 1_024;
const miaixzUiRedactedValue = "[REDACTED]";
const miaixzUiTruncatedValue = "[TRUNCATED]";
const miaixzUiCircularValue = "[CIRCULAR]";

/**
 * Describes a non-JSON diagnostic value without retaining its content.
 */
interface MiaixzUiErrorValueSummary {
  /**
   * Contains the safe runtime value category.
   */
  readonly type: string;

  /**
   * Contains the measurable byte size when it can be obtained without reading content.
   */
  readonly bytes?: number;
}

/**
 * Configures a stable UI runtime error.
 *
 * @public
 */
export interface MiaixzUiErrorOptions {
  /**
   * Supplies the stable machine-readable error code.
   */
  readonly code: MiaixzUiErrorCode;

  /**
   * Supplies optional diagnostic metadata that will be bounded and sanitized.
   */
  readonly details?: unknown;

  /**
   * Supplies the original failure for local diagnostics.
   */
  readonly cause?: unknown;
}

/**
 * Reports whether an object is safe to traverse as inert JSON-like metadata.
 *
 * @param value - Object candidate to inspect.
 * @returns Whether the value is an object literal or null-prototype record.
 */
function isPlainUiErrorObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Normalizes a detail key before comparing it with the sensitive-key registry.
 *
 * @param value - Detail key to normalize.
 * @returns Lowercase alphanumeric key without separators.
 */
function normalizeUiErrorDetailKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Truncates diagnostic strings by Unicode code point.
 *
 * @param value - Diagnostic string to constrain.
 * @returns Original string or a safely truncated representation.
 */
function truncateUiErrorString(value: string): string {
  const characters = [...value];
  if (characters.length <= miaixzUiErrorMaximumStringLength) return value;
  return `${characters.slice(0, miaixzUiErrorMaximumStringLength).join("")}${miaixzUiTruncatedValue}`;
}

/**
 * Creates a content-free summary for a non-JSON diagnostic value.
 *
 * @param value - Runtime value whose content must not be retained.
 * @returns Frozen type and optional byte-size metadata.
 */
function summarizeUiErrorValue(value: unknown): Readonly<MiaixzUiErrorValueSummary> {
  let type: string = typeof value;
  let bytes: number | undefined;
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    type = typeof File !== "undefined" && value instanceof File ? "File" : "Blob";
    bytes = value.size;
  } else if (value instanceof ArrayBuffer) {
    type = "ArrayBuffer";
    bytes = value.byteLength;
  } else if (ArrayBuffer.isView(value)) {
    type = "TypedArray";
    bytes = value.byteLength;
  } else if (typeof FormData !== "undefined" && value instanceof FormData) {
    type = "FormData";
  } else if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    type = "URLSearchParams";
    bytes = new TextEncoder().encode(value.toString()).byteLength;
  } else if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
    type = "ReadableStream";
  } else if (value !== null && typeof value === "object") {
    type = "Object";
  }
  return Object.freeze(bytes === undefined ? { type } : { type, bytes });
}

/**
 * Recursively creates bounded, immutable, getter-safe UI error details.
 *
 * @param value - Runtime value to sanitize.
 * @param depth - Current recursive depth.
 * @param ancestors - Objects in the active traversal path.
 * @returns Frozen metadata without recognized sensitive values or file content.
 */
function sanitizeUiErrorDetails(
  value: unknown,
  depth = 0,
  ancestors: ReadonlySet<object> = new Set(),
): unknown {
  if (typeof value === "string") return truncateUiErrorString(value);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (typeof value !== "object") return summarizeUiErrorValue(value);
  if (ancestors.has(value)) return miaixzUiCircularValue;
  if (depth >= miaixzUiErrorMaximumDepth) return miaixzUiTruncatedValue;
  if (!Array.isArray(value) && !isPlainUiErrorObject(value)) {
    return summarizeUiErrorValue(value);
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, miaixzUiErrorMaximumCollectionSize);
    const result: unknown[] = [];
    for (let index = 0; index < limit; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      result.push(
        descriptor && "value" in descriptor
          ? sanitizeUiErrorDetails(descriptor.value, depth + 1, nextAncestors)
          : miaixzUiTruncatedValue,
      );
    }
    if (value.length > miaixzUiErrorMaximumCollectionSize) {
      result[miaixzUiErrorMaximumCollectionSize - 1] = miaixzUiTruncatedValue;
    }
    return Object.freeze(result);
  }

  const result: Record<string, unknown> = {};
  const keys = Object.keys(value);
  const limit = Math.min(keys.length, miaixzUiErrorMaximumCollectionSize);
  for (let index = 0; index < limit; index += 1) {
    const key = keys[index];
    if (key === undefined) continue;
    if (miaixzUiSensitiveDetailKeys.has(normalizeUiErrorDetailKey(key))) {
      result[key] = miaixzUiRedactedValue;
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    result[key] =
      descriptor && "value" in descriptor
        ? sanitizeUiErrorDetails(descriptor.value, depth + 1, nextAncestors)
        : miaixzUiTruncatedValue;
  }
  if (keys.length > miaixzUiErrorMaximumCollectionSize) {
    const lastKey = keys[miaixzUiErrorMaximumCollectionSize - 1];
    if (lastKey !== undefined) result[lastKey] = miaixzUiTruncatedValue;
  }
  return Object.freeze(result);
}

/**
 * Error created by UI runtime contract validation.
 *
 * @public
 */
export class MiaixzUiError extends Error {
  /**
   * Contains the stable machine-readable error code.
   */
  readonly code: MiaixzUiErrorCode;

  /**
   * Contains the stable translation key for the public message.
   */
  readonly messageKey: string;

  /**
   * Contains optional immutable and sanitized diagnostic metadata.
   */
  readonly details?: unknown;

  /**
   * Creates a language-independent UI error.
   *
   * @param options - Stable error metadata and optional cause.
   */
  constructor(options: MiaixzUiErrorOptions) {
    const messageKey = miaixzUiErrorMessageKeys[options.code];
    const safeCause = options.cause instanceof Error ? options.cause : undefined;
    super(
      `[${options.code}] ${messageKey}`,
      safeCause === undefined ? undefined : { cause: safeCause },
    );
    this.name = "MiaixzUiError";
    this.code = options.code;
    this.messageKey = messageKey;
    if (options.details !== undefined) this.details = sanitizeUiErrorDetails(options.details);
  }
}

/**
 * Reports one stable warning in development builds.
 *
 * @param code - Stable warning code.
 * @internal
 */
export function reportMiaixzUiWarning(code: MiaixzUiWarningCode): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[${code}] ${miaixzUiWarningMessageKeys[code]}`);
}
