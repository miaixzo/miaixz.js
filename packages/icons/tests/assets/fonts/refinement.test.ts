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
 * Checks read-only source scanning and independent in-memory raster quality.
 */
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { chromium, firefox, webkit } from "@playwright/test";
const repositoryRoot = resolve(process.cwd(), "../..");
const refinementBrowsers = { chromium, firefox, webkit } as const;
const requestedRefinementBrowser = process.env.MIAIXZ_REFINEMENT_BROWSER;
if (requestedRefinementBrowser && !(requestedRefinementBrowser in refinementBrowsers)) {
  throw new Error(`Unsupported refinement browser: ${requestedRefinementBrowser}`);
}
const selectedRefinementBrowsers = Object.entries(refinementBrowsers).filter(
  ([browserName]) => !requestedRefinementBrowser || browserName === requestedRefinementBrowser,
);
const runsBrowserRefinement = !process.env.CI || Boolean(requestedRefinementBrowser);

/**
 * Imports a guarded implementation without running its CLI.
 * @param {string} path Repository-relative module path.
 * @returns {Promise<object>} Pure tool exports.
 */
const load = async (path: string) => import(pathToFileURL(resolve(repositoryRoot, path)).href);
const repository = await load(".github/scripts/miaixz.mjs");
const iconRoot = repository.requireWorkspace(
  "@miaixz/icons",
  repository.loadWorkspaceRepository(repositoryRoot),
).rootPath;
/**
 * Imports a helper relative to the discovered Icons test root.
 * @param {string} path Icons test-relative module path.
 * @returns {Promise<object>} Imported helper exports.
 */
const loadIconTest = async (path: string) =>
  import(pathToFileURL(resolve(iconRoot, "tests", path)).href);
const fixture = await loadIconTest("assets/fonts/create-fixtures.helper.mjs");
const visual = await loadIconTest("assets/fonts/render-catalog.helper.mjs");
const comparison = await loadIconTest("assets/fonts/compare-visuals.helper.mjs");
const audit = await load(".github/scripts/modules/icons/quality/audit-icon-refinement.mjs");
const geometryTools = await load(".github/scripts/modules/icons/fonts/font-geometry.mjs");
const interpolationTools = await load(
  ".github/scripts/modules/icons/fonts/interpolate-icon-source.mjs",
);
const fontTools = await load(".github/scripts/modules/icons/fonts/validate-icon-font.mjs");
/**
 * PNG's runtime decoder is loaded through Node's module boundary because it ships no declarations.
 */
const { PNG } = createRequire(import.meta.url)("pngjs");
const sourceTools = await load(".github/scripts/modules/icons/source.mjs");
const designRules = (await sourceTools.loadIconSource()).design;
/**
 * Closed TC01–TC13 actual-name domains. This test never reads design documents at runtime.
 */
const semanticDomains: Record<string, readonly string[]> = {
  TC01: [
    "arrow-big-down",
    "arrow-big-left",
    "arrow-big-right",
    "arrow-big-up",
    "arrow-down",
    "arrow-down-left",
    "arrow-down-right",
    "arrow-left",
    "arrow-left-right",
    "arrow-right",
    "arrow-right-left",
    "arrow-up",
    "arrow-up-left",
    "arrow-up-right",
    "chevron-down",
    "chevron-left",
    "chevron-right",
    "chevron-up",
  ],
  TC02: [
    "arrow-down-from-line",
    "arrow-down-to-dot",
    "arrow-down-to-line",
    "arrow-down-up",
    "arrow-left-from-line",
    "arrow-left-right",
    "arrow-left-to-line",
    "arrow-right-from-line",
    "arrow-right-left",
    "arrow-right-to-line",
    "arrow-up-down",
    "arrow-up-from-dot",
    "arrow-up-from-line",
    "arrow-up-to-line",
    "arrows-up-from-line",
  ],
  TC03: [
    "badge",
    "badge-alert",
    "badge-cent",
    "badge-check",
    "badge-dollar-sign",
    "badge-euro",
    "badge-help",
    "badge-indian-rupee",
    "badge-info",
    "badge-japanese-yen",
    "badge-minus",
    "badge-percent",
    "badge-plus",
    "badge-pound-sterling",
    "badge-russian-ruble",
    "badge-swiss-franc",
    "badge-turkish-lira",
    "badge-x",
    "circle",
    "circle-alert",
    "circle-arrow-down",
    "circle-arrow-left",
    "circle-arrow-out-down-left",
    "circle-arrow-out-down-right",
    "circle-arrow-out-up-left",
    "circle-arrow-out-up-right",
    "circle-arrow-right",
    "circle-arrow-up",
    "circle-check",
    "circle-check-big",
    "circle-chevron-down",
    "circle-chevron-left",
    "circle-chevron-right",
    "circle-chevron-up",
    "circle-dashed",
    "circle-divide",
    "circle-dollar-sign",
    "circle-dot",
    "circle-dot-dashed",
    "circle-ellipsis",
    "circle-equal",
    "circle-euro",
    "circle-fading-arrow-up",
    "circle-fading-plus",
    "circle-gauge",
    "circle-minus",
    "circle-off",
    "circle-parking",
    "circle-parking-off",
    "circle-pause",
    "circle-percent",
    "circle-pile",
    "circle-play",
    "circle-plus",
    "circle-pound-sterling",
    "circle-power",
    "circle-slash",
    "circle-slashed",
    "circle-small",
    "circle-star",
    "circle-stop",
    "circle-user",
    "circle-user-round",
    "circle-x",
    "diamond",
    "diamond-minus",
    "diamond-percent",
    "diamond-plus",
    "octagon",
    "octagon-alert",
    "octagon-minus",
    "octagon-pause",
    "octagon-x",
    "square",
    "square-activity",
    "square-arrow-down",
    "square-arrow-down-left",
    "square-arrow-down-right",
    "square-arrow-left",
    "square-arrow-out-down-left",
    "square-arrow-out-down-right",
    "square-arrow-out-up-left",
    "square-arrow-out-up-right",
    "square-arrow-right",
    "square-arrow-right-enter",
    "square-arrow-right-exit",
    "square-arrow-up",
    "square-arrow-up-left",
    "square-arrow-up-right",
    "square-asterisk",
    "square-bottom-dashed-scissors",
    "square-centerline-dashed-horizontal",
    "square-centerline-dashed-vertical",
    "square-chart-gantt",
    "square-check",
    "square-check-big",
    "square-chevron-down",
    "square-chevron-left",
    "square-chevron-right",
    "square-chevron-up",
    "square-code",
    "square-dashed",
    "square-dashed-bottom",
    "square-dashed-bottom-code",
    "square-dashed-kanban",
    "square-dashed-mouse-pointer",
    "square-dashed-text",
    "square-dashed-top-solid",
    "square-dimensions",
    "square-divide",
    "square-dot",
    "square-equal",
    "square-function",
    "square-kanban",
    "square-library",
    "square-m",
    "square-menu",
    "square-minus",
    "square-mouse-pointer",
    "square-off",
    "square-parking",
    "square-parking-off",
    "square-pause",
    "square-percent",
    "square-pi",
    "square-pilcrow",
    "square-play",
    "square-plus",
    "square-power",
    "square-radical",
    "square-round-corner",
    "square-scissors",
    "square-sigma",
    "square-slash",
    "square-split-horizontal",
    "square-split-vertical",
    "square-square",
    "square-stack",
    "square-star",
    "square-stop",
    "square-terminal",
    "square-text",
    "square-user",
    "square-user-round",
    "square-x",
  ],
  TC04: [
    "badge-alert",
    "badge-check",
    "badge-help",
    "badge-minus",
    "badge-plus",
    "badge-x",
    "battery-plus",
    "calendar-check",
    "calendar-check-outside",
    "calendar-minus",
    "calendar-minus-outside",
    "calendar-off",
    "calendar-plus",
    "calendar-plus-outside",
    "calendar-x",
    "calendar-x-outside",
    "circle-alert",
    "circle-check",
    "circle-check-big",
    "circle-fading-plus",
    "circle-minus",
    "circle-off",
    "circle-parking-off",
    "circle-plus",
    "circle-x",
    "clipboard-check",
    "clipboard-minus",
    "clipboard-plus",
    "clipboard-x",
    "diamond-minus",
    "diamond-plus",
    "file-check",
    "file-check-corner",
    "file-help",
    "file-lock",
    "file-minus",
    "file-minus-corner",
    "file-plus",
    "file-plus-corner",
    "file-x",
    "file-x-corner",
    "folder-check",
    "folder-lock",
    "folder-minus",
    "folder-plus",
    "folder-x",
    "message-circle-check",
    "message-circle-help",
    "message-circle-off",
    "message-circle-plus",
    "message-circle-x",
    "message-square-check",
    "message-square-lock",
    "message-square-off",
    "message-square-plus",
    "message-square-x",
    "octagon-alert",
    "octagon-minus",
    "octagon-x",
    "phone-off",
    "shield-alert",
    "shield-check",
    "shield-help",
    "shield-lock",
    "shield-minus",
    "shield-off",
    "shield-plus",
    "shield-x",
    "square-check",
    "square-check-big",
    "square-minus",
    "square-off",
    "square-parking-off",
    "square-plus",
    "square-x",
    "volume-off",
    "volume-x",
    "wifi-off",
  ],
  TC05: [
    "clipboard",
    "clipboard-check",
    "clipboard-clock",
    "clipboard-copy",
    "clipboard-list",
    "clipboard-minus",
    "clipboard-paste",
    "clipboard-pen",
    "clipboard-pen-line",
    "clipboard-plus",
    "clipboard-type",
    "clipboard-x",
    "file",
    "file-archive",
    "file-axis-3d",
    "file-badge",
    "file-box",
    "file-braces",
    "file-braces-corner",
    "file-chart-column",
    "file-chart-column-increasing",
    "file-chart-line",
    "file-chart-pie",
    "file-check",
    "file-check-corner",
    "file-clock",
    "file-code",
    "file-code-corner",
    "file-cog",
    "file-diff",
    "file-digit",
    "file-down",
    "file-exclamation-point",
    "file-headphone",
    "file-heart",
    "file-help",
    "file-image",
    "file-input",
    "file-key",
    "file-lock",
    "file-minus",
    "file-minus-corner",
    "file-music",
    "file-output",
    "file-pen",
    "file-pen-line",
    "file-play",
    "file-plus",
    "file-plus-corner",
    "file-scan",
    "file-search",
    "file-search-corner",
    "file-signal",
    "file-sliders",
    "file-spreadsheet",
    "file-stack",
    "file-symlink",
    "file-terminal",
    "file-text",
    "file-type",
    "file-type-corner",
    "file-up",
    "file-user",
    "file-video-camera",
    "file-volume",
    "file-x",
    "file-x-corner",
    "files",
    "folder",
    "folder-archive",
    "folder-bookmark",
    "folder-check",
    "folder-clock",
    "folder-closed",
    "folder-code",
    "folder-cog",
    "folder-dot",
    "folder-down",
    "folder-git",
    "folder-git-branch",
    "folder-heart",
    "folder-input",
    "folder-kanban",
    "folder-key",
    "folder-lock",
    "folder-minus",
    "folder-open",
    "folder-open-dot",
    "folder-output",
    "folder-pen",
    "folder-plus",
    "folder-root",
    "folder-search",
    "folder-search-outside",
    "folder-symlink",
    "folder-sync",
    "folder-tree",
    "folder-up",
    "folder-x",
    "folders",
  ],
  TC06: [
    "mail",
    "mail-badge",
    "mail-check",
    "mail-clock",
    "mail-help",
    "mail-minus",
    "mail-open",
    "mail-plus",
    "mail-search",
    "mail-warning",
    "mail-x",
    "message-circle",
    "message-circle-check",
    "message-circle-code",
    "message-circle-dashed",
    "message-circle-heart",
    "message-circle-help",
    "message-circle-more",
    "message-circle-off",
    "message-circle-plus",
    "message-circle-reply",
    "message-circle-warning",
    "message-circle-x",
    "message-square",
    "message-square-check",
    "message-square-code",
    "message-square-dashed",
    "message-square-diff",
    "message-square-dot",
    "message-square-heart",
    "message-square-lock",
    "message-square-more",
    "message-square-off",
    "message-square-plus",
    "message-square-quote",
    "message-square-reply",
    "message-square-share",
    "message-square-text",
    "message-square-warning",
    "message-square-x",
    "messages-square",
    "mic",
    "mic-audio-lines",
    "mic-off",
    "mic-signal",
    "mic-vocal",
    "microwave",
    "phone",
    "phone-call",
    "phone-forwarded",
    "phone-incoming",
    "phone-missed",
    "phone-off",
    "phone-outgoing",
  ],
  TC07: [
    "bolt",
    "command",
    "shield",
    "shield-alert",
    "shield-ban",
    "shield-check",
    "shield-cog",
    "shield-cog-corner",
    "shield-ellipsis",
    "shield-half",
    "shield-help",
    "shield-keyhole",
    "shield-lock",
    "shield-minus",
    "shield-off",
    "shield-plus",
    "shield-user",
    "shield-x",
    "star",
    "star-half",
  ],
  TC08: [
    "alarm-clock",
    "alarm-clock-check",
    "alarm-clock-minus",
    "alarm-clock-off",
    "alarm-clock-plus",
    "calendar",
    "calendar-arrow-down",
    "calendar-arrow-up",
    "calendar-check",
    "calendar-check-outside",
    "calendar-clock",
    "calendar-cog",
    "calendar-date-one",
    "calendar-days",
    "calendar-fold",
    "calendar-heart",
    "calendar-minus",
    "calendar-minus-outside",
    "calendar-off",
    "calendar-plus",
    "calendar-plus-outside",
    "calendar-range",
    "calendar-search",
    "calendar-sync",
    "calendar-x",
    "calendar-x-outside",
    "clock",
    "clock-alert",
    "clock-arrow-down",
    "clock-arrow-left",
    "clock-arrow-right",
    "clock-arrow-up",
    "clock-check",
    "clock-fading",
    "clock-hour-1",
    "clock-hour-10",
    "clock-hour-11",
    "clock-hour-12",
    "clock-hour-2",
    "clock-hour-3",
    "clock-hour-5",
    "clock-hour-6",
    "clock-hour-7",
    "clock-hour-8",
    "clock-hour-9",
    "clock-plus",
  ],
  TC09: [
    "align-center-horizontal",
    "align-center-vertical",
    "align-end-horizontal",
    "align-end-vertical",
    "align-horizontal-distribute-center",
    "align-horizontal-distribute-end",
    "align-horizontal-distribute-start",
    "align-horizontal-justify-center",
    "align-horizontal-justify-end",
    "align-horizontal-justify-start",
    "align-horizontal-space-around",
    "align-horizontal-space-between",
    "align-start-horizontal",
    "align-start-vertical",
    "align-vertical-distribute-center",
    "align-vertical-distribute-end",
    "align-vertical-distribute-start",
    "align-vertical-justify-center",
    "align-vertical-justify-end",
    "align-vertical-justify-start",
    "align-vertical-space-around",
    "align-vertical-space-between",
    "columns",
    "columns-4",
    "columns-settings",
    "grid",
    "grid-2x2",
    "grid-2x2-check",
    "grid-2x2-plus",
    "grid-2x2-x",
    "grid-3x2",
    "layout-dashboard",
    "layout-freeform",
    "layout-grid",
    "layout-list",
    "layout-panel-left",
    "layout-panel-top",
    "layout-template",
    "list",
    "list-check",
    "list-checks",
    "list-chevrons-down-up",
    "list-chevrons-up-down",
    "list-clock",
    "list-collapse",
    "list-end",
    "list-filter",
    "list-filter-plus",
    "list-indent-decrease",
    "list-indent-increase",
    "list-minus",
    "list-music",
    "list-ordered",
    "list-plus",
    "list-restart",
    "list-sort-ascending",
    "list-sort-descending",
    "list-start",
    "list-todo",
    "list-tree",
    "list-video",
    "list-x",
    "panel-bottom",
    "panel-bottom-close",
    "panel-bottom-dashed",
    "panel-bottom-open",
    "panel-left",
    "panel-left-close",
    "panel-left-dashed",
    "panel-left-open",
    "panel-left-right-dashed",
    "panel-right",
    "panel-right-close",
    "panel-right-dashed",
    "panel-right-open",
    "panel-top",
    "panel-top-bottom-dashed",
    "panel-top-close",
    "panel-top-dashed",
    "panel-top-open",
    "table",
    "table-cells-merge",
    "table-cells-split",
    "table-columns-split",
    "table-of-contents",
    "table-properties",
    "table-rows-split",
    "table-split",
  ],
  TC10: [
    "chart-area",
    "chart-bar",
    "chart-bar-big",
    "chart-bar-decreasing",
    "chart-bar-increasing",
    "chart-bar-stacked",
    "chart-candlestick",
    "chart-column",
    "chart-column-big",
    "chart-column-decreasing",
    "chart-column-increasing",
    "chart-column-stacked",
    "chart-gantt",
    "chart-line",
    "chart-network",
    "chart-no-axes-column",
    "chart-no-axes-column-decreasing",
    "chart-no-axes-column-increasing",
    "chart-no-axes-combined",
    "chart-no-axes-gantt",
    "chart-pie",
    "chart-scatter",
    "chart-spline",
    "file-chart-column",
    "file-chart-column-increasing",
    "file-chart-line",
    "file-chart-pie",
    "square-chart-gantt",
  ],
  TC11: [
    "dice-1",
    "dice-2",
    "dice-3",
    "dice-4",
    "dice-5",
    "dice-6",
    "tally-1",
    "tally-2",
    "tally-3",
    "tally-4",
    "tally-5",
  ],
  TC12: [
    "battery",
    "battery-charging",
    "battery-full",
    "battery-low",
    "battery-medium",
    "battery-plus",
    "battery-warning",
    "signal",
    "signal-high",
    "signal-low",
    "signal-medium",
    "signal-zero",
    "volume-high",
    "volume-low",
    "volume-off",
    "volume-x",
    "volume-zero",
    "wifi",
    "wifi-cog",
    "wifi-high",
    "wifi-low",
    "wifi-off",
    "wifi-pen",
    "wifi-sync",
    "wifi-zero",
  ],
  TC13: [
    "copy",
    "copy-check",
    "copy-minus",
    "copy-plus",
    "copy-slash",
    "copy-x",
    "git-branch",
    "git-branch-minus",
    "git-branch-plus",
    "git-commit-horizontal",
    "git-commit-vertical",
    "git-compare",
    "git-compare-arrows",
    "git-fork",
    "git-graph",
    "git-merge",
    "git-merge-conflict",
    "git-pull-request",
    "git-pull-request-arrow",
    "git-pull-request-closed",
    "git-pull-request-create",
    "git-pull-request-create-arrow",
    "git-pull-request-draft",
    "link",
    "link-horizontal",
    "link-horizontal-off",
    "loader",
    "loader-pinwheel",
    "loading",
    "redo-circular",
    "redo-dot",
    "redo-forward",
    "refresh-ccw",
    "refresh-ccw-dot",
    "refresh-cw",
    "refresh-cw-off",
    "rotate-3d",
    "rotate-ccw",
    "rotate-ccw-clock",
    "rotate-ccw-key",
    "rotate-ccw-square",
    "rotate-cw",
    "rotate-cw-fading-clock",
    "rotate-cw-square",
    "undo-back",
    "undo-circular",
    "undo-dot",
  ],
};
/**
 * TC01 directional identities and TC11 counting identities use the same closed domains.
 */
const directionNames = new Set(semanticDomains.TC01);
const countingNames = new Set(semanticDomains.TC11);
const endpointNames = new Set(semanticDomains.TC02);
/**
 * Actual source checks select the union of every closed TC01–TC13 domain.
 * Independent feature fixtures do not substitute for actual source quality.
 */
const activeSemanticNames = new Set(Object.values(semanticDomains).flat());
/**
 * Eight prescribed font-coordinate directions, independent of glyph hashes or file order.
 */
const directions: Record<string, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
  "up-left": [-Math.SQRT1_2, Math.SQRT1_2],
  "up-right": [Math.SQRT1_2, Math.SQRT1_2],
  "down-left": [-Math.SQRT1_2, -Math.SQRT1_2],
  "down-right": [Math.SQRT1_2, -Math.SQRT1_2],
};

/**
 * Measures transverse foreground spans in a prescribed direction, including gaps between arms.
 * @param contours - Actual flattened foreground polygons.
 * @param direction - Unit direction in unchanged font coordinates.
 * @param position - Fractional axial offset from the geometric center.
 * @returns Axial cross-section span relative to the glyph extent.
 */
function directionalSpan(
  contours: number[][][],
  direction: [number, number],
  position: number,
): number {
  const points = contours.flat();
  if (!points.length) return 0;
  const xs = points.map((point) => point[0]!),
    ys = points.map((point) => point[1]!);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const radius = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;
  if (!(radius > 0)) return 0;
  const [dx, dy] = direction;
  const occupied: number[] = [];
  for (let step = -40; step <= 40; step++) {
    const transverse = (step * radius) / 40;
    if (
      sourceInk(
        contours,
        cx + dx * radius * position - dy * transverse,
        cy + dy * radius * position + dx * transverse,
      )
    )
      occupied.push(step / 40);
  }
  return occupied.length ? occupied[occupied.length - 1]! - occupied[0]! : 0;
}

/**
 * Checks arrowhead widening or chevron narrowing rather than inferring direction from bounds.
 * @param name - TC01 actual name.
 * @param contours - Actual flattened foreground polygons.
 * @returns Explicit missing-direction failures.
 */
function directionalFeatures(name: string, contours: number[][][]): string[] {
  const main = name.replace(/^(?:arrow-big-|arrow-|chevron-)/u, "");
  const expected = ["left-right", "right-left", "up-down", "down-up"].includes(main)
    ? main.split("-")
    : [main];
  const failures: string[] = [];
  for (const key of expected) {
    const direction = directions[key];
    if (!direction) throw new Error("Unsupported closed direction: " + name);
    const middle = directionalSpan(contours, direction, 0);
    const forward = Math.max(
      ...[0.3, 0.55, 0.72].map((position) => directionalSpan(contours, direction, position)),
    );
    const backward = Math.max(
      ...[-0.3, -0.55, -0.72].map((position) => directionalSpan(contours, direction, position)),
    );
    const feature = name.startsWith("chevron-") ? backward - forward : forward - middle;
    if (feature < 0.2) failures.push("arrow direction " + key);
  }
  return failures;
}

/**
 * Projects a closed source contour onto a prescribed axis, without guessing its direction.
 * @param contour - Actual flattened contour points.
 * @param axis - Prescribed unit direction.
 * @returns Minimum, maximum and center axial coordinates.
 */
function projectedExtent(contour: number[][], axis: readonly number[]): number[] {
  const values = contour.map((point) => point[0]! * axis[0]! + point[1]! * axis[1]!);
  const minimum = Math.min(...values),
    maximum = Math.max(...values);
  return [minimum, maximum, (minimum + maximum) / 2];
}

/**
 * Checks the closed TC02 arrow domain, including two-ended arrows and endpoint markers.
 * Markers are separated before arrowhead measurements so a terminal line cannot masquerade as a head.
 * @param name - Actual TC02 identity.
 * @param contours - Flattened source polygons.
 * @returns Missing arrow direction, plurality or endpoint failures.
 */
function endpointFeatures(name: string, contours: number[][][]): string[] {
  const suffix = name.replace(/^arrows?-/u, "");
  const marker = /^(up|down|left|right)-(from|to)-(line|dot)$/u.exec(suffix);
  if (!marker) return directionalFeatures("arrow-" + suffix, contours);
  const key = marker[1]!,
    axis = directions[key]!,
    perpendicular = [-axis[1], axis[0]];
  const markerContours = contours.filter((contour) => {
    if (marker[3] === "dot") return circularContour(contour, 25, 80);
    const along = projectedExtent(contour, axis),
      across = projectedExtent(contour, perpendicular);
    return (
      across[1]! - across[0]! >= 160 &&
      along[1]! - along[0]! > 0 &&
      along[1]! - along[0]! <= (across[1]! - across[0]!) / 4
    );
  });
  const arrow = contours.filter((contour) => !markerContours.includes(contour));
  const failures = directionalFeatures("arrow-" + key, arrow);
  if (!arrow.flat().length)
    return [...failures, "arrow body", "endpoint " + marker[2] + " " + marker[3]];
  const extent = projectedExtent(arrow.flat(), axis);
  const matching = markerContours.filter((contour) => {
    const position = projectedExtent(contour, axis)[2]!;
    return marker[2] === "from" ? position <= extent[0]! : position >= extent[1]!;
  });
  if (!matching.length) failures.push("endpoint " + marker[2] + " " + marker[3]);
  if (name === "arrows-up-from-line") {
    const complete = arrow.filter(
      (contour) => directionalFeatures("arrow-up", [contour]).length === 0,
    );
    const rods = symbolRods(arrow);
    const joined = strokeArrowheads(arrow).filter(
      (head) =>
        Math.abs(head.direction[0]!) < 0.1 &&
        head.direction[1]! > 0.9 &&
        rods.some((rod) => {
          const length = Math.hypot(rod.b[0]! - rod.a[0]!, rod.b[1]! - rod.a[1]!);
          return (
            Math.abs(rod.b[0]! - rod.a[0]!) < length * 0.1 &&
            length > rod.width * 2 &&
            Math.abs(head.tip[0]! - (rod.a[0]! + rod.b[0]!) / 2) <= rod.width / 2 &&
            Math.abs(head.tip[1]! - Math.max(rod.a[1]!, rod.b[1]!)) <= rod.width * 2 &&
            lineCapacity(arrow, rod.a, head.tip) >= 1 - 1e-9
          );
        }),
    );
    const candidates = [
      ...complete.map((contour) => projectedExtent(contour, perpendicular)[2]!),
      ...joined.map((head) => head.tip[0]!),
    ];
    const centers = candidates.filter(
      (center, index) =>
        !candidates
          .slice(0, index)
          .some((other) => Math.abs(center - other) <= designRules.grid.lengthTolerance),
    );
    if (centers.length < 2) failures.push("plural upward arrowheads");
  }
  return failures;
}

/**
 * Builds four independently specified reference shapes entirely in memory.
 * The fixture font uses production metrics but never reads release outlines.
 * @returns A small in-memory OpenType font and corresponding analytic SVG paths.
 */
async function nativeReferenceFont(): Promise<{
  bytes: Buffer;
  paths: string[];
  curveErrors: number[];
}> {
  const release = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();
  const result = await fontTools.runFontTool("python3", [
    "-c",
    `
import base64, io, json, sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
release = sys.argv[1]
k = 4 * (2 ** 0.5 - 1) / 3
def circle(pen, radius, clockwise=False):
    import math
    sign = -1 if clockwise else 1
    pen.moveTo((480 + radius, 320))
    for i in range(4):
        a, b = sign * i * math.pi / 2, sign * (i + 1) * math.pi / 2
        pen.curveTo(
            (480 + radius * (math.cos(a) - sign * k * math.sin(a)), 320 + radius * (math.sin(a) + sign * k * math.cos(a))),
            (480 + radius * (math.cos(b) + sign * k * math.sin(b)), 320 + radius * (math.sin(b) - sign * k * math.cos(b))),
            (480 + radius * math.cos(b), 320 + radius * math.sin(b)))
    pen.closePath()
def rectangle(pen, x0, y0, x1, y1):
    pen.moveTo((x0, y0))
    pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
names = ['.notdef', 'circle', 'ring', 'horizontal', 'vertical']
glyphs = {}
for name in names:
    target = TTGlyphPen(None)
    pen = Cu2QuPen(target, max_err=0.05, reverse_direction=False)
    if name in ['circle', 'ring']: circle(pen, 280)
    if name == 'ring': circle(pen, 160, True)
    if name == 'horizontal': rectangle(pen, 130, 280, 830, 360)
    if name == 'vertical': rectangle(pen, 440, -30, 520, 670)
    glyphs[name] = target.glyph()
fb = FontBuilder(960, isTTF=True)
fb.setupGlyphOrder(names)
fb.setupCharacterMap({0xF0000 + i: name for i, name in enumerate(names[1:])})
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics({name: (960, {'.notdef':0, 'circle':200, 'ring':200, 'horizontal':130, 'vertical':440}[name]) for name in names})
fb.setupHorizontalHeader(ascent=800, descent=-160, lineGap=0)
fb.setupNameTable({'familyName':'Miaixz Icons', 'styleName':'Regular', 'uniqueFontIdentifier':'Miaixz Icons;'+release, 'fullName':'Miaixz Icons', 'psName':'MiaixzIconsReference', 'version':'Version '+release,
    'copyright': sys.argv[2], 'licenseDescription': sys.argv[3], 'licenseInfoURL':'https://www.apache.org/licenses/LICENSE-2.0'})
fb.setupOS2(sTypoAscender=800, sTypoDescender=-160, sTypoLineGap=0, usWinAscent=800, usWinDescent=160, sxHeight=480, sCapHeight=640)
fb.setupPost(); fb.setupMaxp()
fb.setupFvar([('FILL',0,0,1,'Fill'), ('opsz',12,24,40,'Optical Size')], [])
from fontTools.ttLib import newTable
from fontTools.ttLib.tables._g_a_s_p import GASP_DOGRAY, GASP_SYMMETRIC_SMOOTHING
gasp = newTable('gasp')
gasp.gaspRange = {65535: GASP_DOGRAY | GASP_SYMMETRIC_SMOOTHING}
fb.font['gasp'] = gasp
fb.font['gvar'] = newTable('gvar')
fb.font['gvar'].variations = {name: [] for name in names}
buffer = io.BytesIO(); fb.save(buffer)
encoded = buffer.getvalue()
compiled = TTFont(io.BytesIO(encoded))
glyphSet = compiled.getGlyphSet()
class ProbePen(BasePen):
    def __init__(self, glyphSet):
        super().__init__(glyphSet); self.contour = 0; self.error = 0
    def _moveTo(self, point): pass
    def _lineTo(self, point): pass
    def _qCurveToOne(self, control, end):
        import math
        start = self._getCurrentPoint()
        radius = 280 if self.contour == 0 else 160
        for i in range(1001):
            t = i / 1000
            x = (1-t)**2 * start[0] + 2*(1-t)*t*control[0] + t*t*end[0]
            y = (1-t)**2 * start[1] + 2*(1-t)*t*control[1] + t*t*end[1]
            self.error = max(self.error, abs(math.hypot(x-480, y-320) - radius))
    def _closePath(self): self.contour += 1
errors = []
for name in ['circle', 'ring']:
    pen = ProbePen(glyphSet); glyphSet[name].draw(pen); errors.append(pen.error)
print(json.dumps({'bytes':base64.b64encode(encoded).decode('ascii'), 'curveErrors':errors}))
`,
    release,
    (await load(".github/scripts/modules/icons/fonts/read-font-source.mjs")).fontCopyright,
    (await load(".github/scripts/modules/icons/fonts/read-font-source.mjs")).fontLicense,
  ]);
  /**
   * Constructs SVG independently from analytic font-unit circle coordinates.
   * @param radius - Analytic circle radius in font units.
   * @param reverse - Whether this contour is the opposing-winding hole.
   * @returns A closed circle path at the production origin.
   */
  function circlePath(radius: number, reverse = false): string {
    const x = 12 + radius / 40;
    const r = radius / 40;
    return `M${x} 12 A${r} ${r} 0 1 ${reverse ? 1 : 0} ${12 - r} 12 A${r} ${r} 0 1 ${reverse ? 1 : 0} ${x} 12Z`;
  }
  const decoded = JSON.parse(result.stdout) as {
    bytes: string;
    curveErrors: number[];
  };
  return {
    bytes: Buffer.from(decoded.bytes, "base64"),
    curveErrors: decoded.curveErrors,
    paths: [
      circlePath(280),
      circlePath(280) + circlePath(160, true),
      "M3.25 11H20.75V13H3.25Z",
      "M11 3.25H13V20.75H11Z",
    ],
  };
}

/**
 * Measures the actual nonzero-winding source ink at an independently specified semantic probe.
 * @param contours - Actual flattened contour polygons.
 * @param x - Probe x in unchanged font units.
 * @param y - Probe y in unchanged font units.
 * @returns Whether the source contains foreground at the probe.
 */
function sourceInk(contours: number[][][], x: number, y: number): boolean {
  let winding = 0;
  for (const contour of contours)
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!;
      if (a[1]! <= y === b[1]! <= y) continue;
      const cross = (b[0]! - a[0]!) * (y - a[1]!) - (x - a[0]!) * (b[1]! - a[1]!);
      if (a[1]! <= y && b[1]! > y && cross > 0) winding++;
      if (a[1]! > y && b[1]! <= y && cross < 0) winding--;
    }
  return winding !== 0;
}

/**
 * Detects a real circular contour, including its curve shape rather than just its bounds.
 * @param contour - Actual flattened closed contour.
 * @param minimumRadius - Minimum frame or dot radius.
 * @param maximumRadius - Maximum frame or dot radius.
 * @returns Whether the entire contour stays within the fixed circular approximation limit.
 */
function circularContour(
  contour: number[][],
  minimumRadius: number,
  maximumRadius: number,
): boolean {
  const xs = contour.map((point) => point[0]!),
    ys = contour.map((point) => point[1]!);
  const center = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const radii = contour.map((point) => Math.hypot(point[0]! - center[0]!, point[1]! - center[1]!));
  /**
   * Vertex radii alone accept inscribed polygons; include each segment's closest radial point.
   */
  const segmentRadii = contour
    .slice(1)
    .map((point, index) => geometryTools.distanceToSegment(center, contour[index], point));
  const maximum = Math.max(...radii);
  const minimum = Math.min(...radii, ...segmentRadii);
  return (
    maximum >= minimumRadius - 1e-9 &&
    maximum <= maximumRadius + 1e-9 &&
    maximum - minimum <= 2 * designRules.visual.circleApproximationError
  );
}

/**
 * Finds the centers of visible circular dots without counting holes or duplicate contours.
 * @param contours - Flattened source contours in font coordinates.
 * @returns Unique centers of actual foreground dots.
 */
function diceDotCenters(contours: number[][][]): number[][] {
  const centers: number[][] = [];
  for (const contour of contours) {
    if (!circularContour(contour, 25, 80)) continue;
    const xs = contour.map((point) => point[0]!),
      ys = contour.map((point) => point[1]!);
    const center = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
    if (!sourceInk(contours, center[0]!, center[1]!)) continue;
    if (!centers.some((other) => Math.hypot(other[0]! - center[0]!, other[1]! - center[1]!) < 1e-6))
      centers.push(center);
  }
  return centers;
}

/**
 * Measures tally strokes through foreground continuity, including merged fifth-stroke outlines.
 * A fifth independent vertical or a horizontal crossbar never satisfies the diagonal rule.
 * @param name - Closed TC11 tally name.
 * @param contours - Flattened source contours in unchanged font coordinates.
 * @returns Missing vertical-count or spanning-diagonal failures.
 */
function tallyFeatures(name: string, contours: number[][][]): string[] {
  const expected = Number(name.slice("tally-".length)),
    points = contours.flat();
  if (!points.length) return ["exact tally vertical count"];
  const xs = points.map((point) => point[0]!),
    ys = points.map((point) => point[1]!);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    height = y1 - y0;
  if (!(x1 > x0 && height > 0)) return ["exact tally vertical count"];
  const runs: number[][] = [];
  for (let step = 0; step < 512; step++) {
    const x = x0 + ((step + 0.5) * (x1 - x0)) / 512;
    const present = Array.from({ length: 9 }, (_, row) =>
      sourceInk(contours, x, y0 + ((row + 1) * height) / 10),
    ).every(Boolean);
    if (!present) continue;
    const previous = runs[runs.length - 1];
    if (previous && previous[1] === step - 1) previous[1] = step;
    else runs.push([step, step]);
  }
  if (runs.length !== (expected === 5 ? 4 : expected)) return ["exact tally vertical count"];
  if (expected !== 5) return [];
  const centers = runs.map(([a, b]) => x0 + (((a! + b!) / 2 + 0.5) * (x1 - x0)) / 512),
    gaps = centers.slice(1).map((x, index) => (x + centers[index]!) / 2);
  let diagonal = false;
  for (let start = 8; start <= 56 && !diagonal; start++)
    for (let end = 8; end <= 56 && !diagonal; end++) {
      if (Math.abs(end - start) < 20) continue;
      diagonal = gaps.every((x) => {
        const fraction = (x - gaps[0]!) / (gaps[gaps.length - 1]! - gaps[0]!);
        return sourceInk(contours, x, y0 + ((start + fraction * (end - start)) * height) / 64);
      });
    }
  return diagonal ? [] : ["fifth diagonal spans four tally strokes"];
}

/**
 * Counts the true radial lobes of a closed contour, not its number of control points.
 * @param contour - Flattened contour around the optical center.
 * @returns Number of distinct radial protrusions, or zero for circles and tiny decorations.
 */
function radialLobes(contour: number[][]): number {
  const radii = radialProfile(contour, [480, 320]);
  const maximum = Math.max(...radii),
    minimum = Math.min(...radii);
  if (maximum < 250 || minimum <= 0 || maximum - minimum < maximum * 0.02) return 0;
  const present = radii.map((radius) => radius > minimum + (maximum - minimum) / 2);
  return present.filter((value, index) => value && !present[(index + 359) % 360]).length;
}

/**
 * Measures exact outer ray intersections about a supplied actual geometric center.
 * @param contour - Original closed polygon.
 * @param center - Actual center, without changing or aligning source coordinates.
 * @returns Three hundred sixty outer radii at one-degree angles.
 */
function radialProfile(contour: number[][], center: readonly number[]): number[] {
  return Array.from({ length: 360 }, (_, degree) => {
    const angle = (degree * Math.PI) / 180,
      dx = Math.cos(angle),
      dy = Math.sin(angle);
    let radius = 0;
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!;
      const ex = b[0]! - a[0]!,
        ey = b[1]! - a[1]!,
        denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-9) continue;
      const ax = a[0]! - center[0]!,
        ay = a[1]! - center[1]!;
      const distance = (ax * ey - ay * ex) / denominator,
        position = (ax * dy - ay * dx) / denominator;
      if (distance > 0 && position >= -1e-9 && position <= 1 + 1e-9)
        radius = Math.max(radius, distance);
    }
    return radius;
  });
}

/**
 * Measures genuine long polygon sides after merging adjacent collinear source subdivisions.
 * Curve subdivisions are too short to be counted as polygon sides.
 * @param contour - Flattened closed polygon or curve.
 * @returns Long side vectors of a full-size frame.
 */
function frameSides(contour: number[][]): number[][] {
  const alongX = projectedExtent(contour, [1, 0]),
    alongY = projectedExtent(contour, [0, 1]);
  const width = alongX[1]! - alongX[0]!,
    height = alongY[1]! - alongY[0]!;
  if (Math.min(width, height) < 500) return [];
  const vectors: number[][] = [];
  for (let index = 0; index < contour.length - 1; index++) {
    const a = contour[index]!,
      b = contour[index + 1]!,
      vector = [b[0]! - a[0]!, b[1]! - a[1]!];
    if (Math.hypot(...vector) < 1e-8) continue;
    const previous = vectors[vectors.length - 1];
    if (
      previous &&
      Math.abs(previous[0]! * vector[1]! - previous[1]! * vector[0]!) < 1e-7 &&
      previous[0]! * vector[0]! + previous[1]! * vector[1]! > 0
    ) {
      previous[0] = previous[0]! + vector[0]!;
      previous[1] = previous[1]! + vector[1]!;
    } else vectors.push(vector);
  }
  if (vectors.length > 1) {
    const first = vectors[0]!,
      last = vectors[vectors.length - 1]!;
    if (
      Math.abs(first[0]! * last[1]! - first[1]! * last[0]!) < 1e-7 &&
      first[0]! * last[0]! + first[1]! * last[1]! > 0
    ) {
      first[0] = first[0]! + last[0]!;
      first[1] = first[1]! + last[1]!;
      vectors.pop();
    }
  }
  return vectors.filter((vector) => Math.hypot(...vector) >= Math.min(width, height) / 8);
}

/**
 * Rejects concave lookalikes even when their raw side count matches a polygon frame.
 * @param contour - Actual flattened contour.
 * @param count - Required number of genuine long sides.
 * @returns Whether every turn has the same nonzero sign and the exact side count.
 */
function convexFrame(contour: number[][], count: number): boolean {
  const sides = frameSides(contour);
  if (sides.length !== count) return false;
  const turns = sides.map((side, index) => {
    const next = sides[(index + 1) % count]!;
    return Math.sign(side[0]! * next[1]! - side[1]! * next[0]!);
  });
  return turns.every((turn) => turn !== 0 && turn === turns[0]);
}

/**
 * Recovers real circular-arc coverage without accepting chords of inscribed polygons.
 * Each segment must respect the configured analytic-circle error, including its nearest point.
 * @param contours - Actual source contours around the unchanged optical center.
 * @returns Angular coverage at each one-degree probe.
 */
function circularArcCoverage(contours: number[][][]): boolean[] {
  const coverage = Array.from({ length: 360 }, () => false),
    center = [480, 320];
  for (const contour of contours)
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!;
      const ra = Math.hypot(a[0]! - 480, a[1]! - 320),
        rb = Math.hypot(b[0]! - 480, b[1]! - 320);
      if (
        Math.min(ra, rb) < 260 ||
        Math.max(ra, rb) > 430 ||
        Math.max(ra, rb) - Math.min(ra, rb, geometryTools.distanceToSegment(center, a, b)) >
          designRules.visual.circleApproximationError
      )
        continue;
      const start = (Math.atan2(a[1]! - 320, a[0]! - 480) * 180) / Math.PI,
        end = (Math.atan2(b[1]! - 320, b[0]! - 480) * 180) / Math.PI;
      const delta = ((end - start + 540) % 360) - 180;
      const lower = Math.min(start, start + delta),
        upper = Math.max(start, start + delta);
      for (let degree = Math.ceil(lower - 1e-9); degree <= Math.floor(upper + 1e-9); degree++)
        coverage[(degree + 720) % 360] = true;
    }
  return coverage;
}

/**
 * Applies TC03's exact extra frame types and four documented circular exceptions.
 * @param name - Actual canonical identity.
 * @param contours - Flattened source contours.
 * @returns Missing frame, angular-spacing or central-dot features.
 */
function extraFrameFeatures(name: string, contours: number[][][]): string[] {
  if (/^diamond(?:-|$)/u.test(name)) {
    const valid = contours.some((contour) => {
      const sides = frameSides(contour);
      return (
        convexFrame(contour, 4) &&
        sides.every(([dx, dy]) => Math.abs(dx!) > 100 && Math.abs(dy!) > 100)
      );
    });
    return valid ? [] : ["four diamond vertices"];
  }
  if (/^octagon(?:-|$)/u.test(name)) {
    const valid = contours.some((contour) => convexFrame(contour, 8));
    return valid ? [] : ["eight convex octagon sides"];
  }
  if (/^badge(?:-|$)/u.test(name))
    return contours.some((contour) => radialLobes(contour) === 8)
      ? []
      : ["eight badge protrusions"];
  if (!["circle-dashed", "circle-dot-dashed", "circle-check-big", "circle-off"].includes(name))
    return [];
  const coverage = circularArcCoverage(contours),
    present = coverage.filter(Boolean).length;
  if (name === "circle-check-big" || name === "circle-off")
    return present >= 180 ? [] : ["circular frame with defined opening"];
  const starts = coverage.flatMap((value, index) =>
    value && !coverage[(index + 359) % 360] ? [index] : [],
  );
  const gaps = starts.map(
    (start, index) => (starts[(index + 1) % starts.length]! - start + 360) % 360,
  );
  const regular =
    starts.length >= 3 &&
    present < 350 &&
    present >= 90 &&
    gaps.every((gap) => Math.abs(gap - 360 / starts.length) <= 2);
  const failures = regular ? [] : ["equally spaced interrupted circular arcs"];
  if (
    name === "circle-dot-dashed" &&
    !diceDotCenters(contours).some(
      ([x, y]) => Math.hypot(x! - 480, y! - 320) <= designRules.grid.lengthTolerance,
    )
  )
    failures.push("central circle dot");
  return failures;
}

/**
 * Recognizes all four actual square-frame sides across continuous or interrupted contours.
 * Rounded corners need no invented sharp vertices, and disconnected dashes remain legitimate sides.
 * @param contours - Complete original frame and content geometry.
 * @param requireSquare - Whether equal side extents are required; rectangular bubbles retain four real sides.
 * @returns Whether a real large four-sided near-square carrier exists.
 */
function squareFrame(contours: number[][][], requireSquare = true): boolean {
  const edges = contours.flatMap((part) =>
    part.slice(1).flatMap((b, index) => {
      const a = part[index]!;
      return Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!) >= 35 ? [{ a, b }] : [];
    }),
  );
  const vertical = edges.filter(
      ({ a, b }) => Math.abs(a[0]! - b[0]!) <= designRules.grid.lengthTolerance,
    ),
    horizontal = edges.filter(
      ({ a, b }) => Math.abs(a[1]! - b[1]!) <= designRules.grid.lengthTolerance,
    );
  const xs = layoutPositions(vertical.map(({ a }) => a[0]!)),
    ys = layoutPositions(horizontal.map(({ a }) => a[1]!));
  /**
   * Measures true collinear edge intervals, merging overlaps rather than counting contour duplicates.
   * @param verticalSide - Whether the side lies on a vertical line.
   * @param position - Fixed side coordinate.
   * @param lower - First endpoint of the side.
   * @param upper - Last endpoint of the side.
   * @returns Whether the side has enough genuine continuous/segmented extent.
   */
  function side(verticalSide: boolean, position: number, lower: number, upper: number): boolean {
    const along = verticalSide ? 1 : 0,
      across = verticalSide ? 0 : 1;
    const intervals = (verticalSide ? vertical : horizontal)
      .filter(({ a }) => Math.abs(a[across]! - position) <= designRules.grid.lengthTolerance)
      .map(({ a, b }) => [
        Math.max(lower, Math.min(a[along]!, b[along]!)),
        Math.min(upper, Math.max(a[along]!, b[along]!)),
      ])
      .filter(([a, b]) => b! > a!)
      .sort((a, b) => a[0]! - b[0]!);
    const merged: number[][] = [];
    for (const interval of intervals) {
      const last = merged.at(-1);
      if (last && interval[0]! <= last[1]! + designRules.grid.lengthTolerance)
        last[1] = Math.max(last[1]!, interval[1]!);
      else merged.push([...interval]);
    }
    const length = merged.reduce((total, [a, b]) => total + b! - a!, 0),
      span = (merged.at(-1)?.[1] ?? lower) - (merged[0]?.[0] ?? lower);
    return (
      span >= (upper - lower) * 0.6 && length >= (upper - lower) * (merged.length >= 2 ? 0.3 : 0.6)
    );
  }
  for (const [index, x0] of xs.entries())
    for (const x1 of xs.slice(index + 1)) {
      if (x1 - x0 < 400) continue;
      for (const [row, y0] of ys.entries())
        for (const y1 of ys.slice(row + 1)) {
          if (
            y1 - y0 < 400 ||
            (requireSquare &&
              Math.abs(x1 - x0 - (y1 - y0)) > designRules.visual.strokeWidths.compact.target)
          )
            continue;
          if (
            side(true, x0, y0, y1) &&
            side(true, x1, y0, y1) &&
            side(false, y0, x0, x1) &&
            side(false, y1, x0, x1)
          )
            return true;
        }
    }
  return false;
}

/**
 * Measures foreground runs on an independent line without counting contour holes as objects.
 * @param contours - Actual flattened source polygons.
 * @param start - First probe point.
 * @param end - Last probe point.
 * @returns Occupied fractional intervals along the line.
 */
function inkRuns(
  contours: number[][][],
  start: readonly number[],
  end: readonly number[],
): number[][] {
  const runs: number[][] = [];
  for (let step = 0; step < 512; step++) {
    const t = (step + 0.5) / 512;
    if (
      !sourceInk(
        contours,
        start[0]! + t * (end[0]! - start[0]!),
        start[1]! + t * (end[1]! - start[1]!),
      )
    )
      continue;
    const previous = runs[runs.length - 1];
    if (previous && previous[1] === step / 512) previous[1] = (step + 1) / 512;
    else runs.push([step / 512, (step + 1) / 512]);
  }
  return runs;
}

/**
 * Checks four unobstructed command loops and a rectangular central connection.
 * Negative space is measured from actual winding, so extra crossbars cannot pass by contour count.
 * @param contours - Actual source polygons.
 * @returns Missing corner-hole or central-connection failures.
 */
function commandFeatures(contours: number[][][]): string[] {
  const points = contours.flat();
  if (!points.length) return ["four open command loops", "rectangular command connection"];
  const bx = projectedExtent(points, [1, 0]),
    by = projectedExtent(points, [0, 1]),
    width = bx[1]! - bx[0]!,
    height = by[1]! - by[0]!,
    cx = bx[2]!,
    cy = by[2]!;
  const holes: number[][] = [];
  for (const contour of contours) {
    const x = projectedExtent(contour, [1, 0]),
      y = projectedExtent(contour, [0, 1]);
    const w = x[1]! - x[0]!,
      h = y[1]! - y[0]!;
    if (
      w < 50 ||
      h < 50 ||
      w > width * 0.4 ||
      h > height * 0.4 ||
      Math.abs(x[2]! - cx) < width * 0.1 ||
      Math.abs(y[2]! - cy) < height * 0.1
    )
      continue;
    const center = [x[2]!, y[2]!];
    if (
      [
        [0, 0],
        [-0.15, 0],
        [0.15, 0],
        [0, -0.15],
        [0, 0.15],
      ].some(([dx, dy]) => sourceInk(contours, center[0]! + dx! * w, center[1]! + dy! * h))
    )
      continue;
    if (!holes.some((other) => Math.hypot(center[0]! - other[0]!, center[1]! - other[1]!) < 1))
      holes.push(center);
  }
  const quadrants = new Set(holes.map(([x, y]) => `${x! < cx}|${y! < cy}`));
  const failures = holes.length === 4 && quadrants.size === 4 ? [] : ["four open command loops"];
  const horizontal = inkRuns(contours, [cx - width * 0.3, cy], [cx + width * 0.3, cy]),
    vertical = inkRuns(contours, [cx, cy - height * 0.3], [cx, cy + height * 0.3]);
  /**
   * Extracts two connection coordinates from hollow or filled central geometry.
   * @param runs - Actual occupied intervals at the central scan.
   * @param center - Font-coordinate scan midpoint.
   * @param extent - Scan length in font units.
   * @returns The two candidate rectangle edges, or an empty result.
   */
  function edges(runs: number[][], center: number, extent: number): number[] {
    if (runs.length === 2) return runs.map(([a, b]) => center + ((a! + b!) / 2 - 0.5) * extent);
    if (runs.length === 1) {
      const [a, b] = runs[0]!,
        margin = (b! - a!) * 0.1;
      return [center + (a! + margin - 0.5) * extent, center + (b! - margin - 0.5) * extent];
    }
    return [];
  }
  const xs = edges(horizontal, cx, width * 0.6),
    ys = edges(vertical, cy, height * 0.6);
  if (
    xs.length !== 2 ||
    ys.length !== 2 ||
    xs[1]! - xs[0]! < width * 0.15 ||
    ys[1]! - ys[0]! < height * 0.15 ||
    xs.some((x) => ys.some((y) => !sourceInk(contours, x, y)))
  )
    failures.push("rectangular command connection");
  return failures;
}

/**
 * Requires a six-sided nut with an open central hole, never a lightning silhouette.
 * @param contours - Actual source polygons.
 * @returns Missing nut exterior or hole failures.
 */
function boltFeatures(contours: number[][][]): string[] {
  const exterior = contours.some((contour) => convexFrame(contour, 6));
  const hole =
    contours.some((contour) => circularContour(contour, 80, 180)) && !sourceInk(contours, 480, 320);
  return [...(exterior ? [] : ["six-sided nut exterior"]), ...(hole ? [] : ["open nut center"])];
}

/**
 * Measures carrier bounds and genuine horizontal/vertical sides from actual point geometry.
 * @param contour - Flattened source contour.
 * @returns Bounds, center and all long axis-aligned edges.
 */
function carrierGeometry(contour: number[][]): {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  horizontal: number[][][];
  vertical: number[][][];
} {
  const x = projectedExtent(contour, [1, 0]),
    y = projectedExtent(contour, [0, 1]),
    horizontal: number[][][] = [],
    vertical: number[][][] = [];
  for (let index = 0; index < contour.length - 1; index++) {
    const a = contour[index]!,
      b = contour[index + 1]!;
    if (
      Math.abs(a[1]! - b[1]!) <= designRules.visual.comparison.subdivisionUnits &&
      Math.abs(a[0]! - b[0]!) >= 100
    )
      horizontal.push([a, b]);
    if (
      Math.abs(a[0]! - b[0]!) <= designRules.visual.comparison.subdivisionUnits &&
      Math.abs(a[1]! - b[1]!) >= 100
    )
      vertical.push([a, b]);
  }
  return {
    x0: x[0]!,
    x1: x[1]!,
    y0: y[0]!,
    y1: y[1]!,
    width: x[1]! - x[0]!,
    height: y[1]! - y[0]!,
    cx: x[2]!,
    cy: y[2]!,
    horizontal,
    vertical,
  };
}

/**
 * Finds miniature folder exteriors by proportionate tab edges, excluding oppositely wound counters.
 * Compound directory trees retain small real folders rather than a fictitious full-size carrier.
 * @param contours - Actual complete foreground contours.
 * @returns Distinct miniature folder exterior bounds.
 */
function miniatureFolderNodes(contours: number[][][]): ReturnType<typeof carrierGeometry>[] {
  const largest = [...contours].sort(
    (a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)),
  )[0];
  if (!largest) return [];
  const minimum =
    2 *
    Math.max(
      ...["compact", "standard", "display"].map(
        (master) => designRules.visual.strokeWidths[master].target,
      ),
    );
  const nodes: ReturnType<typeof carrierGeometry>[] = [];
  for (const contour of contours) {
    const body = carrierGeometry(contour);
    if (
      Math.sign(polygonArea(contour)) !== Math.sign(polygonArea(largest)) ||
      body.width < minimum ||
      body.height < minimum ||
      body.width >= 500 ||
      body.height >= 350
    )
      continue;
    const top = contour.slice(1).flatMap((b, index) => {
      const a = contour[index]!;
      return Math.abs(a[1]! - b[1]!) <= designRules.visual.comparison.subdivisionUnits &&
        Math.abs(a[0]! - b[0]!) >= body.width * 0.1 &&
        a[1]! >= body.y1 - body.height * 0.35
        ? [[a, b]]
        : [];
    });
    if (
      !top.some(([a]) =>
        top.some(
          ([b]) =>
            Math.abs(a![1]! - b![1]!) >= body.height * 0.08 &&
            Math.abs(a![1]! - b![1]!) <= body.height * 0.3,
        ),
      )
    )
      continue;
    if (
      !nodes.some(
        (other) =>
          Math.hypot(other.cx - body.cx, other.cy - body.cy) <= designRules.grid.lengthTolerance,
      )
    )
      nodes.push(body);
  }
  return nodes;
}

/**
 * Proves a hierarchy between spatially separate miniature folder exteriors through actual ink.
 * Merely overlapping child frames cannot substitute for a parent/child connection.
 * @param contours - Complete source foreground, including hollow node frames.
 * @param nodes - Distinct stepped folder exterior bounds.
 * @returns Whether a genuine separated parent and child share a connected ink component.
 */
function connectedFolderNodes(
  contours: number[][][],
  nodes = miniatureFolderNodes(contours),
): boolean {
  return nodes.some((parent, index) =>
    nodes
      .slice(index + 1)
      .some(
        (child) =>
          Math.hypot(parent.cx - child.cx, parent.cy - child.cy) >= 100 &&
          (parent.x1 < child.x0 ||
            child.x1 < parent.x0 ||
            parent.y1 < child.y0 ||
            child.y1 < parent.y0) &&
          connectedEndRegions(contours, parent, child),
      ),
  );
}

/**
 * Identifies folded sheets, stepped folder tabs and clipboards from their actual defining geometry.
 * Multiple sheets/folders require distinct overlapping carriers, not a second hole contour.
 * @param name - Actual TC05 document identity or a TC04 document/state composite.
 * @param contours - Flattened source contours.
 * @returns Explicit missing carrier feature failures.
 */
function documentFeatures(name: string, contours: number[][][]): string[] {
  const base = name.split("-")[0]!;
  if (!["file", "files", "folder", "folders", "clipboard"].includes(base)) return [];
  if (base === "folder" && connectedFolderNodes(contours)) return [];
  const geometry = contours.map(carrierGeometry);
  const carriers: ReturnType<typeof carrierGeometry>[] = [];
  for (const [index, body] of geometry.entries()) {
    const contour = contours[index]!;
    if (base === "file" || base === "files") {
      if (
        body.width < 400 ||
        body.height < 500 ||
        body.horizontal.length < 2 ||
        body.vertical.length < 2
      )
        continue;
      const folded = contours.some((part) =>
        part.slice(1).some((b, i) => {
          const a = part[i]!,
            dx = b[0]! - a[0]!,
            dy = b[1]! - a[1]!;
          return (
            dx * dy < 0 &&
            Math.abs(dx) >= 70 &&
            Math.abs(dy) >= 70 &&
            Math.min(a[0]!, b[0]!) >= body.cx &&
            Math.min(a[1]!, b[1]!) >= body.cy &&
            Math.max(a[0]!, b[0]!) <= body.x1 &&
            Math.max(a[1]!, b[1]!) <= body.y1
          );
        }),
      );
      if (!folded) continue;
    } else if (base === "folder" || base === "folders") {
      if (body.width < 500 || body.height < 350) continue;
      const top = body.horizontal.filter(([a]) => a![1]! >= body.y1 - body.height * 0.35);
      if (
        !top.some(([a]) =>
          top.some(
            ([b]) =>
              Math.abs(a![1]! - b![1]!) >= 40 && Math.abs(a![1]! - b![1]!) <= body.height * 0.3,
          ),
        )
      )
        continue;
    } else {
      if (
        body.width < 400 ||
        body.height < 500 ||
        body.horizontal.length < 2 ||
        body.vertical.length < 2
      )
        continue;
      const clip = geometry.some(
        (candidate) =>
          candidate.width >= 100 &&
          candidate.width <= body.width * 0.65 &&
          candidate.height >= 50 &&
          candidate.height <= body.height * 0.3 &&
          Math.abs(candidate.cx - body.cx) <= body.width * 0.15 &&
          candidate.y0 < body.y1 &&
          candidate.y1 > body.y1,
      );
      if (!clip) continue;
    }
    if (
      !carriers.some(
        (other) =>
          Math.hypot(other.cx - body.cx, other.cy - body.cy) <=
          Math.max(
            ...["compact", "standard", "display"].map(
              (master) =>
                designRules.visual.strokeWidths[master].target +
                designRules.visual.strokeWidths[master].tolerance,
            ),
          ),
      )
    )
      carriers.push(body);
  }
  const required = base === "files" || base === "folders" ? 2 : 1;
  if (carriers.length < required)
    return [
      base === "clipboard"
        ? "clipboard board and top clip"
        : base === "folder" || base === "folders"
          ? "folder tab and body"
          : "paper body and upper-right fold",
    ];
  if (
    required === 2 &&
    !carriers.some((a, index) =>
      carriers
        .slice(index + 1)
        .some(
          (b) =>
            Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) &&
            Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0),
        ),
    )
  )
    return ["overlapping document carriers"];
  return [];
}

/**
 * Checks prescribed document text, scan, image, music, code, tree, archive and open-folder details.
 * Paper edges, folds and folder tabs are removed before payload checks so they cannot substitute for content.
 * @param name - Exact closed TC05 document identity.
 * @param contours - Original complete document polygons.
 * @returns Missing named document-payload features.
 */
function documentDetailFeatures(name: string, contours: number[][][]): string[] {
  const tokens = name.split("-"),
    content = stateContours(name, contours),
    rods = symbolRods(content),
    failures: string[] = [];
  if (tokens.includes("text") && listRows(content).length < 3)
    failures.push("three document text rows");
  if (tokens.includes("scan")) {
    const body = contours
      .map(carrierGeometry)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const corners = content
      .map(carrierGeometry)
      .filter(
        (box) =>
          Math.min(box.width, box.height) >= 70 &&
          Math.max(box.width, box.height) <= 180 &&
          box.horizontal.length >= 1 &&
          box.vertical.length >= 1 &&
          body &&
          Math.abs(box.cx - body.cx) >= body.width * 0.3 &&
          Math.abs(box.cy - body.cy) >= body.height * 0.3,
      );
    if (
      !body ||
      new Set(corners.map((box) => (box.cx < body.cx) + "/" + (box.cy < body.cy))).size !== 4
    )
      failures.push("four document scan corners");
  }
  if (tokens.includes("image")) {
    const frames = chartRectangles(content).filter((box) => box.width >= 200 && box.height >= 150);
    const dots = diceDotCenters(content);
    const peaks = strokeArrowheads(content).filter((head) => head.direction[1]! > 0.8);
    if (
      !frames.some(
        (box) =>
          dots.some(([x, y]) => x! > box.x0 && x! < box.x1 && y! > box.y0 && y! < box.y1) &&
          peaks.some(
            (head) =>
              head.tip[0]! > box.x0 &&
              head.tip[0]! < box.x1 &&
              head.tip[1]! > box.y0 &&
              head.tip[1]! < box.y1,
          ),
      )
    )
      failures.push("document image frame, mountain peak and dot");
  }
  if (tokens.includes("music")) {
    const heads = content
      .map(carrierGeometry)
      .filter(
        (box) =>
          Math.min(box.width, box.height) >= 50 &&
          Math.max(box.width, box.height) <= 140 &&
          sourceInk(content, box.cx, box.cy),
      );
    const stems = rods.filter(
      (rod) =>
        Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance &&
        rod.b[1]! - rod.a[1]! >= 150,
    );
    if (
      !heads.some((head) =>
        stems.some(
          (stem) =>
            Math.abs(stem.a[0]! - head.x1) <= stem.width &&
            stem.a[1]! >= head.y0 &&
            stem.a[1]! <= head.y1 &&
            stem.b[1]! > head.y1 + 100,
        ),
      )
    )
      failures.push("document music note head and rising stem");
  }
  if (tokens.includes("code")) {
    const heads = strokeArrowheads(content);
    if (
      !heads.some(
        (left) =>
          left.direction[0]! < -0.9 &&
          heads.some(
            (right) =>
              right.direction[0]! > 0.9 &&
              right.tip[0]! - left.tip[0]! >= 100 &&
              Math.abs(right.tip[1]! - left.tip[1]!) <= designRules.grid.lengthTolerance,
          ),
      )
    )
      failures.push("two document code brackets");
  }
  if (tokens.includes("tree")) {
    const nodes = chartRectangles(content).filter((box) => box.width <= 180 && box.height <= 180),
      circles = content.filter((part) => circularContour(part, 25, 80)).map(carrierGeometry);
    const all = [...nodes, ...circles].filter(
      (box, index, list) =>
        !list
          .slice(0, index)
          .some(
            (other) =>
              Math.hypot(box.cx - other.cx, box.cy - other.cy) <= designRules.grid.lengthTolerance,
          ),
    );
    if (
      !connectedFolderNodes(contours) &&
      !all.some((parent, index) =>
        all
          .slice(index + 1)
          .some(
            (child) =>
              Math.hypot(parent.cx - child.cx, parent.cy - child.cy) >= 100 &&
              connectedEndRegions(content, parent, child),
          ),
      )
    )
      failures.push("document parent/child nodes and real connection");
  }
  if (tokens.includes("archive")) {
    const boxes = chartRectangles(content);
    const archiveBox = boxes.some(
      (body) =>
        body.width >= 180 &&
        body.height >= 120 &&
        boxes.some(
          (lid) =>
            lid.width > body.width + 30 &&
            lid.height >= 30 &&
            lid.height <= 90 &&
            Math.abs(lid.cx - body.cx) <= designRules.grid.lengthTolerance &&
            lid.y0 <= body.y1 &&
            lid.y1 > body.y1,
        ),
    );
    const teeth = content
      .map(carrierGeometry)
      .filter(
        (box) =>
          box.width >= 20 &&
          box.width <= 90 &&
          box.height >= 20 &&
          box.height <= 70 &&
          sourceInk(content, box.cx, box.cy),
      );
    const zipper = rods.some(
      (spine) =>
        Math.abs(spine.b[0]! - spine.a[0]!) <= designRules.grid.lengthTolerance &&
        spine.b[1]! - spine.a[1]! >= 150 &&
        teeth.some(
          (left) =>
            left.cx < spine.a[0]! &&
            teeth.some(
              (right) =>
                right.cx > spine.a[0]! &&
                Math.abs(left.cy - right.cy) >= 40 &&
                left.x1 >= spine.a[0]! - spine.width &&
                right.x0 <= spine.a[0]! + spine.width &&
                left.cy >= spine.a[1]! &&
                right.cy <= spine.b[1]!,
            ),
        ),
    );
    if (!archiveBox && !zipper) failures.push("archive box with lid or interlocking zipper");
  }
  if (tokens.includes("open") && name.startsWith("folder-")) {
    const flap = contours.some((part) => {
      const box = carrierGeometry(part);
      const slanted = part
        .slice(1)
        .filter(
          (point, index) =>
            Math.abs(point[0]! - part[index]![0]!) >= 40 &&
            Math.abs(point[1]! - part[index]![1]!) >= 100,
        );
      return (
        box.width >= 300 &&
        box.height >= 100 &&
        box.height <= 350 &&
        box.horizontal.length >= 2 &&
        slanted.length >= 2
      );
    });
    if (!flap) failures.push("open-folder projecting front plane");
    /**
     * Tests real foreground because removing the carrier can invert or cancel the isolated dot's winding.
     */
    if (name.endsWith("-dot") && !diceDotCenters(contours).length) failures.push("open-folder dot");
  }
  return failures;
}

/**
 * Measures continuous foreground along a ray by exact flattened-edge intersections.
 * Angular/length sampling cannot turn equal horizontal and vertical hands into unequal lengths.
 * @param contours - Flattened source polygons with their actual winding.
 * @param origin - Actual dial center.
 * @param angle - Prescribed ray angle in radians.
 * @param limit - Maximum distance before the dial frame.
 * @returns Continuous foreground distance from the hub, bounded by the requested limit.
 */
function foregroundRayLength(
  contours: number[][][],
  origin: readonly number[],
  angle: number,
  limit: number,
): number {
  const dx = Math.cos(angle),
    dy = Math.sin(angle),
    cuts = [0, limit];
  for (const contour of contours)
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!,
        ex = b[0]! - a[0]!,
        ey = b[1]! - a[1]!,
        denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-9) continue;
      const ax = a[0]! - origin[0]!,
        ay = a[1]! - origin[1]!,
        distance = (ax * ey - ay * ex) / denominator,
        position = (ax * dy - ay * dx) / denominator;
      if (distance > 0 && distance < limit && position >= 0 && position <= 1) cuts.push(distance);
    }
  cuts.sort((a, b) => a - b);
  let length = 0;
  for (let index = 1; index < cuts.length; index++) {
    const start = cuts[index - 1]!,
      end = cuts[index]!;
    if (end - start < 1e-9) continue;
    const middle = (start + end) / 2;
    if (!sourceInk(contours, origin[0]! + middle * dx, origin[1]! + middle * dy)) break;
    length = end;
  }
  return length;
}

/**
 * Measures exact total foreground capacity on a finite line, including disjoint filled intervals.
 * @param contours - Actual flattened source polygons.
 * @param start - Line start point.
 * @param end - Line end point.
 * @returns Fraction of the line occupied by actual nonzero-winding foreground.
 */
function lineCapacity(
  contours: number[][][],
  start: readonly number[],
  end: readonly number[],
): number {
  const dx = end[0]! - start[0]!,
    dy = end[1]! - start[1]!,
    cuts = lineCuts(contours, start, end);
  let capacity = 0;
  for (let index = 1; index < cuts.length; index++) {
    const first = cuts[index - 1]!,
      last = cuts[index]!,
      middle = (first + last) / 2;
    if (
      last - first > 1e-9 &&
      sourceInk(contours, start[0]! + middle * dx, start[1]! + middle * dy)
    )
      capacity += last - first;
  }
  return capacity;
}

/**
 * Collects exact polygon/line intersection fractions, independent of uniform probe sampling.
 * @param contours - Unmodified source polygons.
 * @param start - First line point.
 * @param end - Last line point.
 * @returns Ordered partition cuts, including both endpoints.
 */
function lineCuts(
  contours: number[][][],
  start: readonly number[],
  end: readonly number[],
): number[] {
  const dx = end[0]! - start[0]!,
    dy = end[1]! - start[1]!,
    cuts = [0, 1];
  for (const contour of contours)
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!,
        ex = b[0]! - a[0]!,
        ey = b[1]! - a[1]!;
      /**
       * Conservative boxes retain the existing endpoint tolerance and round-off margin.
       */
      const margin = (Math.abs(ex) + Math.abs(ey)) * 1e-9 + 1e-7;
      if (
        Math.max(a[0]!, b[0]!) + margin < Math.min(start[0]!, end[0]!) ||
        Math.min(a[0]!, b[0]!) - margin > Math.max(start[0]!, end[0]!) ||
        Math.max(a[1]!, b[1]!) + margin < Math.min(start[1]!, end[1]!) ||
        Math.min(a[1]!, b[1]!) - margin > Math.max(start[1]!, end[1]!)
      )
        continue;
      const denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-9) continue;
      const ax = a[0]! - start[0]!,
        ay = a[1]! - start[1]!,
        position = (ax * ey - ay * ex) / denominator,
        edge = (ax * dy - ay * dx) / denominator;
      if (position > 0 && position < 1 && edge >= -1e-9 && edge <= 1 + 1e-9) cuts.push(position);
    }
  cuts.sort((a, b) => a - b);
  return cuts;
}

/**
 * Fixed TC12 intensity sequences; symbolic states are deliberately outside these domains.
 */
const strengthSeries: Record<string, readonly [string, number][]> = {
  battery: [
    ["battery-low", 1 / 3],
    ["battery-medium", 2 / 3],
    ["battery-full", 1],
  ],
  signal: [
    ["signal-zero", 0],
    ["signal-low", 1],
    ["signal-medium", 2],
    ["signal-high", 3],
    ["signal", 4],
  ],
  wifi: [
    ["wifi-zero", 0],
    ["wifi-low", 1],
    ["wifi-high", 2],
    ["wifi", 3],
  ],
  volume: [
    ["volume-zero", 0],
    ["volume-low", 1],
    ["volume-high", 2],
  ],
};

/**
 * Measures battery capacity, active signal bars or actual Wi-Fi/speaker arcs independently of labels.
 * The result is geometric; names are used only afterward to compare the closed intensity sequence.
 * @param family - Exact battery/signal/wifi/volume carrier family.
 * @param contours - Actual flattened source contours.
 * @returns Measured level and carrier-feature failures.
 */
function measuredStrength(
  family: string,
  contours: number[][][],
): { level: number; failures: string[] } {
  const geometry = contours.map(carrierGeometry);
  if (family === "battery") {
    const originalShell = geometry.find(
      (box) =>
        box.width >= 500 &&
        box.height >= 250 &&
        box.width > box.height &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2,
    );
    if (!originalShell) return { level: NaN, failures: ["battery shell and terminal"] };
    const sides = [...originalShell.horizontal].sort(
      (a, b) => Math.abs(b[1]![0]! - b[0]![0]!) - Math.abs(a[1]![0]! - a[0]![0]!),
    );
    const mainSide = sides.find((a) =>
      sides.some(
        (b) =>
          a !== b &&
          Math.abs(a[0]![1]! - b[0]![1]!) >= 250 &&
          Math.abs(Math.min(a[0]![0]!, a[1]![0]!) - Math.min(b[0]![0]!, b[1]![0]!)) <=
            designRules.grid.lengthTolerance &&
          Math.abs(Math.max(a[0]![0]!, a[1]![0]!) - Math.max(b[0]![0]!, b[1]![0]!)) <=
            designRules.grid.lengthTolerance,
      ),
    );
    const shell = mainSide
      ? {
          ...originalShell,
          x0: Math.min(mainSide[0]![0]!, mainSide[1]![0]!),
          x1: Math.max(mainSide[0]![0]!, mainSide[1]![0]!),
        }
      : { ...originalShell };
    shell.width = shell.x1 - shell.x0;
    shell.cx = (shell.x0 + shell.x1) / 2;
    const terminal =
      geometry.some(
        (box) =>
          box.width >= 40 &&
          box.width <= 120 &&
          box.height >= 80 &&
          box.height < shell.height &&
          box.cy > shell.y0 &&
          box.cy < shell.y1 &&
          (Math.abs(box.x0 - shell.x1) <= designRules.grid.lengthTolerance ||
            Math.abs(box.x1 - shell.x0) <= designRules.grid.lengthTolerance),
      ) ||
      [shell.x0 - 20, shell.x1 + 20].some(
        (x) =>
          sourceInk(contours, x, shell.cy) &&
          !sourceInk(contours, x, shell.cy - shell.height * 0.45) &&
          !sourceInk(contours, x, shell.cy + shell.height * 0.45),
      );
    const interiors = geometry.filter(
      (box) =>
        box.x0 > shell.x0 &&
        box.x1 < shell.x1 &&
        box.y0 > shell.y0 &&
        box.y1 < shell.y1 &&
        Math.abs(box.cx - shell.cx) <= designRules.grid.lengthTolerance &&
        box.height >= shell.height * 0.5,
    );
    const interior = interiors.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!interior) return { level: NaN, failures: ["battery capacity interior"] };
    return {
      level: lineCapacity(contours, [interior.x0, interior.cy], [interior.x1, interior.cy]),
      failures: terminal ? [] : ["battery shell and terminal"],
    };
  }
  if (family === "signal") {
    const bars = geometry
      .filter((box) => box.width >= 100 && box.width <= 200 && box.height >= box.width)
      .sort((a, b) => a.cx - b.cx);
    const unique = bars.filter(
      (box, index) =>
        !bars
          .slice(0, index)
          .some((other) => Math.abs(box.cx - other.cx) <= designRules.grid.lengthTolerance),
    );
    const valid =
      unique.length === 4 &&
      unique.every((box) => Math.abs(box.y0 - unique[0]!.y0) <= designRules.grid.lengthTolerance);
    return {
      level: unique.filter((box) => sourceInk(contours, box.cx, box.cy)).length,
      failures: valid ? [] : ["four signal carrier bars"],
    };
  }
  if (family === "wifi") {
    const dots = diceDotCenters(contours).filter(([x, y]) =>
      geometry.some(
        (box) =>
          Math.abs(box.cx - x!) < 1 &&
          Math.abs(box.cy - y!) < 1 &&
          Math.max(box.width, box.height) <= 160,
      ),
    );
    const base = dots.sort((a, b) => a[1]! - b[1]!)[0];
    if (!base) return { level: NaN, failures: ["wifi base point"] };
    const arcs = geometry.filter(
      (box, index) =>
        contours[index]!.length >= 20 &&
        box.width >= 130 &&
        box.height <= box.width * 0.6 &&
        box.y0 > base[1]! &&
        Math.abs(box.cx - base[0]!) <= designRules.grid.lengthTolerance,
    );
    return { level: arcs.length, failures: [] };
  }
  if (family === "volume") {
    const speaker = geometry.find(
      (box, index) =>
        box.width >= 250 &&
        box.height >= 300 &&
        contours[index]!.slice(1).filter((b, i) => {
          const a = contours[index]![i]!;
          return Math.abs(b[0]! - a[0]!) >= 100 && Math.abs(b[1]! - a[1]!) >= 100;
        }).length >= 2 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 1,
    );
    if (!speaker) return { level: NaN, failures: ["speaker body and flared cone"] };
    const arcs = geometry.filter(
      (box, index) =>
        contours[index]!.length >= 20 &&
        box.height >= 130 &&
        box.width <= box.height * 0.7 &&
        box.x0 > speaker.x1 - designRules.grid.lengthTolerance &&
        Math.abs(box.cy - speaker.cy) <= designRules.grid.lengthTolerance,
    );
    return { level: arcs.length, failures: [] };
  }
  throw new Error("Unsupported closed strength carrier: " + family);
}

/**
 * Checks only the exact TC12 intensity names; charging/off/x and other symbols remain states.
 * @param name - Actual TC12 identity.
 * @param contours - Actual source contours.
 * @returns Missing carrier or incorrect intensity failures.
 */
function strengthFeatures(name: string, contours: number[][][]): string[] {
  const family = name.split("-")[0]!,
    measured = measuredStrength(family, contours),
    expected = strengthSeries[family]?.find(([identity]) => identity === name);
  const failures = [...measured.failures];
  if (
    expected &&
    (!Number.isFinite(measured.level) || Math.abs(measured.level - expected[1]) > 1e-8)
  )
    failures.push("exact " + family + " intensity");
  return failures;
}

/**
 * Rejects missing/repeated levels, swapped/equal neighbors and symbolic states replacing a level.
 * Symbolic names remain valid carrier inputs but never enter the numerical intensity order.
 * @param family - Exact closed TC12 family.
 * @param samples - Actual named source shapes in memory.
 * @returns Closed sequence or measured-intensity failures.
 */
function strengthSequenceFeatures(
  family: string,
  samples: readonly { name: string; contours: number[][][] }[],
): string[] {
  const expected = strengthSeries[family];
  if (!expected) throw new Error("Unsupported strength sequence: " + family);
  const allowed = new Set(semanticDomains.TC12!.filter((name) => name.split("-")[0] === family));
  const seen = new Set<string>(),
    failures: string[] = [];
  for (const sample of samples) {
    if (!allowed.has(sample.name) || seen.has(sample.name))
      failures.push("illegal or duplicate strength identity");
    seen.add(sample.name);
  }
  const levels: number[] = [];
  for (const [name] of expected) {
    const sample = samples.find((entry) => entry.name === name);
    if (!sample) {
      failures.push("missing strength level " + name);
      continue;
    }
    failures.push(...strengthFeatures(name, sample.contours));
    levels.push(measuredStrength(family, sample.contours).level);
  }
  if (
    levels.some(
      (level, index) => !Number.isFinite(level) || (index > 0 && level <= levels[index - 1]!),
    )
  )
    failures.push("strictly increasing strength sequence");
  return failures;
}

/**
 * Identifies an isolated finite closing stripe by actual opposed edges and full-carrier span.
 * Carrier frames and joined symbols do not fit inside one measured finite stroke band.
 * @param contour - One actual flattened closed contour.
 * @param body - Bounds of the complete, unmodified glyph.
 * @returns Whether every point belongs to a genuine full-span descending closing stroke.
 */
function isolatedOffStripe(contour: number[][], body: ReturnType<typeof carrierGeometry>): boolean {
  return symbolRods([contour]).some(
    (rod) =>
      rod.b[0]! - rod.a[0]! >= body.width * 0.65 &&
      rod.a[1]! - rod.b[1]! >= body.height * 0.65 &&
      contour.every(
        (point) =>
          geometryTools.distanceToSegment(point, rod.a, rod.b) <=
          rod.width / 2 + designRules.visual.comparison.subdivisionUnits,
      ),
  );
}

/**
 * Validates same-center clock hands against their actual circular dial, including embedded clocks.
 * Generic clocks have two distinct hand directions/lengths; named twelve o'clock may visually merge.
 * A separately measured closing stripe is not a clock hand; state checks still use the full glyph.
 * @param name - Canonical clock or composite identity.
 * @param inputContours - Actual flattened source contours, including every state overlay.
 * @returns Missing dial, hand, bell or base failures.
 */
function clockFeatures(name: string, inputContours: number[][][]): string[] {
  const body = carrierGeometry(inputContours.flat()),
    contours = name.split("-").includes("off")
      ? inputContours.filter((contour) => !isolatedOffStripe(contour, body))
      : inputContours;
  const hour = /^clock-hour-(\d+)$/u.exec(name),
    alarm = /^alarm-clock(?:-|$)/u.test(name),
    standalone = /^clock(?:-|$)/u.test(name) || alarm;
  const dials = contours.filter((contour) => circularContour(contour, standalone ? 260 : 80, 430));
  const failures: string[] = [];
  let valid = false;
  for (const dial of dials) {
    const box = carrierGeometry(dial),
      radius = box.width / 2,
      cx = box.cx,
      cy = box.cy;
    if (!sourceInk(contours, cx, cy)) continue;
    if (hour) {
      const selected = Number(hour[1]);
      const correct = Array.from({ length: 12 }, (_, index) => index + 1).every((candidate) => {
        const angle = (candidate * Math.PI) / 6,
          ink = sourceInk(
            contours,
            cx + radius * 0.5 * Math.sin(angle),
            cy + radius * 0.5 * Math.cos(angle),
          );
        return ink === (candidate === selected || candidate === 12);
      });
      if (correct) valid = true;
      continue;
    }
    const spokes = Array.from({ length: 360 }, (_, degree) =>
      sourceInk(
        contours,
        cx + radius * 0.5 * Math.cos((degree * Math.PI) / 180),
        cy + radius * 0.5 * Math.sin((degree * Math.PI) / 180),
      ),
    );
    const starts = spokes.flatMap((present, index) =>
      present && !spokes[(index + 359) % 360] ? [index] : [],
    );
    if (starts.length !== 2) continue;
    const lengths = starts.map((start) => {
      let sweep = 0;
      while (sweep < 360 && spokes[(start + sweep) % 360]) sweep++;
      const angle = ((start + (sweep - 1) / 2) * Math.PI) / 180;
      return foregroundRayLength(contours, [cx, cy], angle, radius * 0.8);
    });
    if (
      Math.min(...lengths) >= radius * 0.5 &&
      Math.abs(lengths[0]! - lengths[1]!) > designRules.grid.lengthTolerance
    )
      valid = true;
  }
  if (!dials.length) failures.push("clock dial");
  if (!valid)
    failures.push(
      hour ? "named hour and twelve-o'clock minute hand" : "same-center long and short clock hands",
    );
  if (alarm && dials.length) {
    const dial = carrierGeometry(dials[0]!),
      radius = dial.width / 2;
    const accessories = contours
      .map(carrierGeometry)
      .filter(
        (box) =>
          Math.max(box.width, box.height) >= 60 && Math.max(box.width, box.height) <= radius * 0.75,
      );
    const bells = accessories.filter((box) => box.cy > dial.cy + radius * 0.6);
    if (
      !bells.some((box) => box.cx < dial.cx - radius * 0.3) ||
      !bells.some((box) => box.cx > dial.cx + radius * 0.3)
    )
      failures.push("two alarm bells");
    if (!accessories.some((box) => box.cy < dial.cy - radius * 0.7)) failures.push("alarm base");
  }
  return failures;
}

/**
 * Checks calendar bindings/date page and the fixed clock/days/range variant features.
 * @param name - Canonical calendar identity.
 * @param contours - Flattened source contours.
 * @returns Missing date-page, binding or explicit variant features.
 */
function calendarFeatures(name: string, contours: number[][][]): string[] {
  const geometry = contours.map(carrierGeometry);
  const body = geometry.find(
    (box) =>
      box.width >= 500 &&
      box.height >= 500 &&
      box.horizontal.length >= 2 &&
      box.vertical.length >= 2,
  );
  if (!body) return ["calendar date page and two bindings"];
  const bindings = geometry.filter(
    (box) =>
      box.width >= 40 &&
      box.width <= body.width * 0.2 &&
      box.height >= 80 &&
      box.height <= body.height * 0.35 &&
      box.x0 > body.x0 &&
      box.x1 < body.x1 &&
      box.y0 < body.y1 &&
      box.y1 > body.y1,
  );
  if (
    !bindings.some((a, index) =>
      bindings.slice(index + 1).some((b) => Math.abs(a.cx - b.cx) >= body.width * 0.3),
    )
  )
    return ["calendar date page and two bindings"];
  const failures: string[] = [];
  const positions = geometry.filter(
    (box) =>
      box.width >= 20 &&
      box.width <= 110 &&
      box.height >= 20 &&
      box.height <= 110 &&
      box.x0 > body.x0 &&
      box.x1 < body.x1 &&
      box.y0 > body.y0 &&
      box.y1 < body.y1 - body.height * 0.2,
  );
  if (name === "calendar-days") {
    const xs = new Set(positions.map((box) => Math.round(box.cx))),
      ys = new Set(positions.map((box) => Math.round(box.cy)));
    if (positions.length < 4 || xs.size < 2 || ys.size < 2)
      failures.push("calendar two-row two-column dates");
  }
  if (name === "calendar-range") {
    let range = false;
    for (const first of positions) {
      const row = positions
        .filter((box) => Math.abs(box.cy - first.cy) <= designRules.grid.lengthTolerance)
        .sort((a, b) => a.cx - b.cx);
      if (row.length < 3) continue;
      const runs = inkRuns(contours, [row[0]!.cx, first.cy], [row[row.length - 1]!.cx, first.cy]);
      if (runs.length === 1 && runs[0]![0] === 0 && runs[0]![1] === 1) range = true;
    }
    if (!range) failures.push("calendar three-position connected range");
  }
  if (name === "calendar-clock") failures.push(...clockFeatures(name, contours));
  return failures;
}

/**
 * Calculates the signed area of actual flattened points solely to distinguish exterior/hole contours.
 * @param contour - Closed source polygon.
 * @returns Signed area in squared font units.
 */
function polygonArea(contour: number[][]): number {
  return (
    contour
      .slice(1)
      .reduce(
        (area, point, index) =>
          area + contour[index]![0]! * point[1]! - point[0]! * contour[index]![1]!,
        0,
      ) / 2
  );
}

/**
 * Locates full-size bubble exteriors with a real lower tail, excluding reversed hole contours.
 * @param contours - Actual source contours.
 * @returns Tail-bearing exterior contours only.
 */
function bubbleExteriors(contours: number[][][]): number[][][] {
  const largest = [...contours].sort(
    (a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)),
  )[0];
  if (!largest) return [];
  const sign = Math.sign(polygonArea(largest));
  return contours.filter((contour) => {
    const box = carrierGeometry(contour);
    if (box.width < 500 || box.height < 500 || Math.sign(polygonArea(contour)) !== sign)
      return false;
    const low = contour.filter((point) => point[1]! <= box.y0 + box.height * 0.05);
    const xs = low.map((point) => point[0]!);
    return xs.length > 0 && Math.max(...xs) - Math.min(...xs) < box.width * 0.35;
  });
}

/**
 * Proves two phone end regions share actual foreground connectivity, without contour-count assumptions.
 * Disconnected status symbols do not invalidate a connected handset.
 * @param contours - Actual source contours.
 * @param first - First earpiece's bounds.
 * @param second - Second earpiece's bounds.
 * @returns Whether both end regions touch the same foreground component.
 */
function connectedEndRegions(
  contours: number[][][],
  first: ReturnType<typeof carrierGeometry>,
  second: ReturnType<typeof carrierGeometry>,
): boolean {
  const components = foregroundComponents(contours),
    a = components(first),
    b = components(second);
  return [...a].some((label) => b.has(label));
}

/**
 * Computes the unchanged 64-by-64 connectivity grid once for an immutable graph query.
 * Every neighboring link still requires exact full foreground capacity along its segment.
 * @param contours - Complete original polygons, never modified during the query.
 * @returns A region query over this invocation's foreground component labels.
 */
function foregroundComponents(
  contours: number[][][],
): (box: ReturnType<typeof carrierGeometry>) => Set<number> {
  const bounds = carrierGeometry(contours.flat()),
    labels = new Int32Array(64 * 64),
    ink = new Uint8Array(64 * 64),
    dx = bounds.width / 64,
    dy = bounds.height / 64;
  const edges = contours.flatMap((part) => part.slice(1).map((b, index) => [part[index]!, b]));
  for (let y = 0; y < 64; y++) {
    const py = bounds.y0 + (y + 0.5) * dy,
      crossings = edges.filter(([a, b]) => a![1]! <= py !== b![1]! <= py);
    for (let x = 0; x < 64; x++) {
      const px = bounds.x0 + (x + 0.5) * dx;
      let winding = 0;
      for (const [a, b] of crossings) {
        const cross = (b![0]! - a![0]!) * (py - a![1]!) - (px - a![0]!) * (b![1]! - a![1]!);
        if (a![1]! <= py && cross > 0) winding++;
        if (a![1]! > py && cross < 0) winding--;
      }
      ink[y * 64 + x] = winding !== 0 ? 1 : 0;
    }
  }
  let component = 0;
  for (let index = 0; index < ink.length; index++) {
    if (!ink[index] || labels[index]) continue;
    const queue = [index];
    labels[index] = ++component;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const cell = queue[cursor]!,
        x = cell % 64,
        y = Math.floor(cell / 64);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx! < 0 || nx! >= 64 || ny! < 0 || ny! >= 64) continue;
        const neighbor = ny! * 64 + nx!;
        if (ink[neighbor] && !labels[neighbor]) {
          const from = [bounds.x0 + (x + 0.5) * dx, bounds.y0 + (y + 0.5) * dy],
            to = [bounds.x0 + (nx! + 0.5) * dx, bounds.y0 + (ny! + 0.5) * dy];
          if (lineCapacity(contours, from, to) < 1 - 1e-9) continue;
          labels[neighbor] = component;
          queue.push(neighbor);
        }
      }
    }
  }
  /**
   * Reads component identifiers touching a real earpiece region, including hollow outlines.
   * @param box - Actual or geometrically recovered end region.
   * @returns Nonempty foreground component labels touching that region.
   */
  function components(box: ReturnType<typeof carrierGeometry>): Set<number> {
    const result = new Set<number>();
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const px = bounds.x0 + (x + 0.5) * dx,
          py = bounds.y0 + (y + 0.5) * dy;
        if (px >= box.x0 && px <= box.x1 && py >= box.y0 && py <= box.y1 && labels[y * 64 + x])
          result.add(labels[y * 64 + x]!);
      }
    return result;
  }
  return components;
}

/**
 * Checks the exact TC06 carriers, retaining the envelope/bubble and microphone/microwave distinctions.
 * @param name - Canonical communication identity.
 * @param contours - Flattened source contours.
 * @returns Missing defining carrier features, not a hash- or category-based label guess.
 */
function communicationFeatures(name: string, contours: number[][][]): string[] {
  const geometry = contours.map(carrierGeometry);
  if (name === "message-circle-dashed" || name === "message-square-dashed") {
    if (!contours.length) return ["interrupted bubble border and tail"];
    const body = carrierGeometry(contours.flat());
    const tailArms = symbolRods(contours)
      .filter((rod) => Math.abs(rod.b[1]! - rod.a[1]!) >= 100)
      .map((rod) => ({
        ...rod,
        low: rod.a[1]! < rod.b[1]! ? rod.a : rod.b,
        high: rod.a[1]! < rod.b[1]! ? rod.b : rod.a,
      }));
    const tail = tailArms.some((arm, index) =>
      tailArms
        .slice(index + 1)
        .some(
          (other) =>
            arm.low[1]! <= body.y0 + arm.width * 1.5 &&
            other.low[1]! <= body.y0 + other.width * 1.5 &&
            Math.hypot(arm.low[0]! - other.low[0]!, arm.low[1]! - other.low[1]!) <=
              Math.max(arm.width, other.width) * 1.5 &&
            Math.abs(
              (arm.high[0]! - arm.low[0]!) * (other.high[1]! - other.low[1]!) -
                (arm.high[1]! - arm.low[1]!) * (other.high[0]! - other.low[0]!),
            ) > 1e-9,
        ),
    );
    const interrupted =
      contours.length >= 3 && geometry.every((box) => box.width < 500 || box.height < 500);
    const coverage = circularArcCoverage(contours);
    const circular =
      coverage.filter(Boolean).length >= 90 &&
      [0, 90, 180, 270].every((start) => coverage.slice(start, start + 90).some(Boolean)) &&
      coverage.some((present) => !present);
    const border = name === "message-circle-dashed" ? circular : squareFrame(contours, false);
    return interrupted && tail && border ? [] : ["interrupted bubble border and tail"];
  }
  if (/^mail(?:-|$)/u.test(name)) {
    const body = geometry.find(
      (box) =>
        box.width >= 500 &&
        box.height >= 300 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2,
    );
    if (!body) return ["envelope and folded seal"];
    const lines = contours.flatMap((contour) =>
      contour.slice(1).flatMap((b, index) => {
        const a = contour[index]!,
          low = a[1]! < b[1]! ? a : b,
          high = low === a ? b : a;
        return Math.abs(a[0]! - b[0]!) >= 100 &&
          Math.abs(a[1]! - b[1]!) >= 100 &&
          Math.abs(low[0]! - body.cx) <= body.width * 0.2 &&
          Math.abs(low[1]! - body.cy) <= body.height * 0.25 &&
          high[1]! > body.cy
          ? [[low, high]]
          : [];
      }),
    );
    const seal = lines.some(([a, topA]) =>
      lines.some(
        ([b, topB]) =>
          Math.hypot(a![0]! - b![0]!, a![1]! - b![1]!) <= 160 &&
          (topA![0]! - a![0]!) * (topB![0]! - b![0]!) < 0,
      ),
    );
    return seal ? [] : ["envelope and folded seal"];
  }
  if (/^messages?-square(?:-|$)/u.test(name) || /^message-circle(?:-|$)/u.test(name)) {
    const exteriors = bubbleExteriors(contours);
    const valid = exteriors.filter((contour) =>
      name.startsWith("message-circle")
        ? circularArcCoverage([contour]).filter(Boolean).length >= 270
        : carrierGeometry(contour).horizontal.length >= 2 &&
          carrierGeometry(contour).vertical.length >= 2,
    );
    const distinct = valid.filter(
      (contour, index) =>
        !valid.slice(0, index).some((other) => {
          const a = carrierGeometry(contour),
            b = carrierGeometry(other);
          return Math.hypot(a.cx - b.cx, a.cy - b.cy) < 1;
        }),
    );
    return distinct.length >= (name === "messages-square" ? 2 : 1)
      ? []
      : [
          name === "messages-square"
            ? "two tailed square bubbles"
            : name.startsWith("message-circle")
              ? "circular bubble and tail"
              : "square bubble and tail",
        ];
  }
  if (name === "microwave") {
    const body = geometry.find(
      (box) =>
        box.width >= 500 &&
        box.height >= 350 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2,
    );
    if (!body) return ["microwave box, door and controls"];
    const door = geometry.find(
      (box, index) =>
        polygonArea(contours[index]!) * polygonArea(contours[geometry.indexOf(body)]!) > 0 &&
        box.width >= body.width * 0.4 &&
        box.width <= body.width * 0.8 &&
        box.height >= body.height * 0.5 &&
        box.x0 > body.x0 &&
        box.x1 < body.x1 &&
        box.y0 > body.y0 &&
        box.y1 < body.y1 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2,
    );
    const controls =
      door &&
      geometry.some(
        (box) =>
          box.width >= 20 &&
          box.width <= 130 &&
          box.height >= 20 &&
          box.height <= 130 &&
          box.cx > door.x1 &&
          box.x1 < body.x1 &&
          box.cy > body.y0 &&
          box.cy < body.y1,
      );
    return door && controls ? [] : ["microwave box, door and controls"];
  }
  if (/^mic(?:-|$)/u.test(name)) {
    const head = geometry.find(
      (box, index) =>
        box.width >= 100 &&
        box.width <= 320 &&
        box.height >= 200 &&
        box.width <= box.height * 0.8 &&
        contours[index]!.length >= 20,
    );
    const support =
      head &&
      geometry.some(
        (box, index) =>
          contours[index]!.length >= 20 &&
          box.width >= head.width + 60 &&
          box.height >= head.height * 0.3 &&
          box.y0 < head.y0 &&
          box.y1 <= head.y0 + head.height * 0.5 &&
          Math.abs(box.cx - head.cx) <= designRules.grid.lengthTolerance,
      );
    return head && support ? [] : ["microphone pickup head and support"];
  }
  if (/^phone(?:-|$)/u.test(name)) {
    if (!contours.length) return ["two handset ends and curved connection"];
    const body = carrierGeometry(contours.flat());
    if (body.width < 400 || body.height < 500 || !contours.some((contour) => contour.length >= 20))
      return ["two handset ends and curved connection"];
    const pads = geometry.filter(
      (box) =>
        box.width >= 140 && box.height >= 70 && box.height <= 240 && box.width >= box.height * 1.25,
    );
    for (const part of contours) {
      const box = carrierGeometry(part);
      if (Math.min(box.width, box.height) < 40) continue;
      const scale = 600 / Math.min(box.width, box.height),
        normalized = part.map(([x, y]) => [
          480 + (x! - box.cx) * scale,
          320 + (y! - box.cy) * scale,
        ]);
      if (!convexFrame(normalized, 4)) continue;
      const lengths = frameSides(normalized).map((vector) => Math.hypot(...vector) / scale),
        longer = Math.max(...lengths),
        shorter = Math.min(...lengths);
      if (longer >= 140 && shorter >= 70 && shorter <= 240 && longer >= shorter * 1.25)
        pads.push(box);
    }
    for (const box of geometry)
      for (const [a, b] of box.horizontal) {
        const width = Math.abs(a![0]! - b![0]!);
        if (
          width < 140 ||
          width > body.width * 0.75 ||
          Math.abs(a![1]! - body.cy) < body.height * 0.3
        )
          continue;
        pads.push(
          carrierGeometry([
            [Math.min(a![0]!, b![0]!), a![1]! - 40],
            [Math.max(a![0]!, b![0]!), a![1]! - 40],
            [Math.max(a![0]!, b![0]!), a![1]! + 40],
            [Math.min(a![0]!, b![0]!), a![1]! + 40],
            [Math.min(a![0]!, b![0]!), a![1]! - 40],
          ]),
        );
      }
    const connected = pads.some((a, index) =>
      pads
        .slice(index + 1)
        .some(
          (b) =>
            Math.hypot(a.cx - b.cx, a.cy - b.cy) >= Math.max(body.width, body.height) * 0.5 &&
            connectedEndRegions(contours, a, b),
        ),
    );
    return connected ? [] : ["two handset ends and curved connection"];
  }
  throw new Error("Unsupported closed communication carrier: " + name);
}

/**
 * Checks a heart silhouette's two upper lobes, central notch and narrowing lower point.
 * Outline and carved hearts retain the same visible contour; circles and diamonds fail these features.
 * The shape is identified by its lobes, notch and taper, not an arbitrary payload-size ceiling.
 * @param symbol - Actual isolated payload polygons.
 * @returns Whether a visible original heart contour exists.
 */
function heartFeature(symbol: number[][][]): boolean {
  return symbol.some((part) => {
    const box = carrierGeometry(part);
    if (Math.min(box.width, box.height) < 80) return false;
    const upper = inkRuns(
      [part],
      [box.x0, box.y0 + box.height * 0.8],
      [box.x1, box.y0 + box.height * 0.8],
    );
    const lower = inkRuns(
      [part],
      [box.x0, box.y0 + box.height * 0.1],
      [box.x1, box.y0 + box.height * 0.1],
    );
    return (
      upper.length === 2 &&
      lower.length === 1 &&
      lower[0]![1]! - lower[0]![0]! < 0.4 &&
      !sourceInk([part], box.cx, box.y0 + box.height * 0.9) &&
      sourceInk([part], box.cx, box.y0 + box.height * 0.4) &&
      visibleStateEdge([part], symbol)
    );
  });
}

/**
 * Checks named communication payloads separately from their mail/bubble/handset carrier.
 * Dot/text counts, heart, reply/forward direction and a real additional call arc remain compulsory.
 * @param name - Exact TC06 identity.
 * @param contours - Complete original geometry.
 * @returns Missing prescribed payload features.
 */
function communicationDetailFeatures(name: string, contours: number[][][]): string[] {
  const tokens = name.split("-"),
    content = stateContours(name, contours),
    failures: string[] = [];
  if (tokens.includes("more") && diceDotCenters(content).length !== 3)
    failures.push("three separate message dots");
  if (tokens.includes("text") && listRows(content).length < 2)
    failures.push("two message text rows");
  if (tokens.includes("heart") && !heartFeature(content)) failures.push("message heart payload");
  if (tokens.includes("reply") || tokens.includes("forwarded")) {
    const forward = tokens.includes("forwarded");
    const solidHeads = content.flatMap((part) => {
      if (directionalFeatures("arrow-" + (forward ? "right" : "left"), [part]).length) return [];
      const x = forward
        ? Math.max(...part.map((point) => point[0]!))
        : Math.min(...part.map((point) => point[0]!));
      const tips = part.filter(
        (point) => Math.abs(point[0]! - x) <= designRules.grid.lengthTolerance,
      );
      return [
        {
          tip: [x, tips.reduce((total, point) => total + point[1]!, 0) / tips.length],
          direction: [forward ? 1 : -1, 0],
        },
      ];
    });
    const head = [...strokeArrowheads(content), ...solidHeads].some(
      (arrow) =>
        (forward ? arrow.direction[0]! > 0.9 : arrow.direction[0]! < -0.9) &&
        lineCapacity(
          content,
          [arrow.tip[0]! - arrow.direction[0]! * 60, arrow.tip[1]! - arrow.direction[1]! * 60],
          [arrow.tip[0]! - arrow.direction[0]! * 150, arrow.tip[1]! - arrow.direction[1]! * 150],
        ) >=
          1 - 1e-9,
    );
    if (!head)
      failures.push(forward ? "forwarding right arrow and stem" : "replying left arrow and stem");
  }
  if (name === "phone-call") {
    const body = carrierGeometry(contours.flat());
    if (
      !contours.some((part) => {
        const box = carrierGeometry(part);
        return (
          box.height < body.height * 0.55 && box.width < body.width * 0.75 && openCircularArc(part)
        );
      })
    )
      failures.push("additional phone-call arc");
  }
  if (name === "phone-incoming" || name === "phone-outgoing") {
    const body = carrierGeometry(contours.flat());
    const carrier = contours.filter((part) => {
      const box = carrierGeometry(part);
      return (
        (part.length >= 20 && box.height >= body.height * 0.55) ||
        (box.width >= 140 &&
          box.height >= 70 &&
          box.height <= 240 &&
          Math.abs(box.cy - body.cy) >= body.height * 0.3)
      );
    });
    const markers = contours.filter((part) => !carrier.includes(part));
    const solidHeads = markers.flatMap((part) =>
      Object.entries(directions).flatMap(([key, direction]) => {
        if (directionalFeatures("arrow-" + key, [part]).length) return [];
        const maximum = projectedExtent(part, direction)[1]!,
          tips = part.filter(
            (point) =>
              maximum - point[0]! * direction[0] - point[1]! * direction[1] <=
              designRules.grid.lengthTolerance,
          );
        return [
          {
            tip: [
              tips.reduce((sum, point) => sum + point[0]!, 0) / tips.length,
              tips.reduce((sum, point) => sum + point[1]!, 0) / tips.length,
            ],
            direction,
          },
        ];
      }),
    );
    const distance = (point: number[]): number =>
      sourceInk(carrier, point[0]!, point[1]!)
        ? 0
        : Math.min(
            ...carrier.flatMap((part) =>
              part
                .slice(1)
                .map((end, index) => geometryTools.distanceToSegment(point, part[index], end)),
            ),
          );
    const valid = [...strokeArrowheads(markers), ...solidHeads].some((head) => {
      const behind = [
        head.tip[0]! - head.direction[0]! * 120,
        head.tip[1]! - head.direction[1]! * 120,
      ];
      if (
        lineCapacity(markers, behind, [
          head.tip[0]! - head.direction[0]! * 60,
          head.tip[1]! - head.direction[1]! * 60,
        ]) <
        1 - 1e-9
      )
        return false;
      return name === "phone-incoming"
        ? distance(head.tip) < distance(behind) - designRules.grid.lengthTolerance
        : distance(head.tip) > distance(behind) + designRules.grid.lengthTolerance;
    });
    if (!valid)
      failures.push(
        name === "phone-incoming"
          ? "arrow toward actual handset"
          : "arrow away from actual handset",
      );
  }
  return failures;
}

/**
 * Isolates state geometry from real frames, clipboard clips, calendar bindings and clock hands.
 * Carrier borders must not masquerade as plus/minus/check marks.
 * @param name - Exact composite identity.
 * @param contours - Actual flattened source polygons.
 * @returns Original state contours without rewriting or aligning source coordinates.
 */
function stateContours(name: string, contours: number[][][]): number[][][] {
  const geometry = contours.map(carrierGeometry);
  const closing = name.split("-").includes("off"),
    completeBody = closing ? carrierGeometry(contours.flat()) : undefined;
  const textRows = /^list(?:-|$)/u.test(name) ? listRows(contours) : [];
  const board = geometry.find(
    (box) =>
      box.width >= 400 &&
      box.height >= 400 &&
      box.horizontal.some(([a, b]) => Math.abs(a![0]! - b![0]!) >= box.width * 0.7) &&
      box.vertical.some(([a, b]) => Math.abs(a![1]! - b![1]!) >= box.height * 0.7),
  );
  const largestArea = contours.map(polygonArea).sort((a, b) => Math.abs(b) - Math.abs(a))[0] ?? 0;
  const gridCounter = /^grid-[23]x2(?:-|$)/u.test(name)
    ? geometry
        .map((box, index) => ({ box, index }))
        .filter(
          ({ box, index }) =>
            polygonArea(contours[index]!) * largestArea < 0 &&
            box.width >= 400 &&
            box.height >= 400 &&
            box.horizontal.length >= 2 &&
            box.vertical.length >= 2,
        )
        .sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)[0]
    : undefined;
  const gridSeparators = gridCounter ? layoutSeparators(gridCounter.box, contours) : [];
  const carrier = geometry
    .map((box, index) => ({ box, index }))
    .filter(
      ({ box, index }) =>
        polygonArea(contours[index]!) * largestArea > 0 &&
        box.width >= 400 &&
        box.height >= 400 &&
        (circularContour(contours[index]!, 200, 430) ||
          [4, 5, 6, 7, 8].some((count) => convexFrame(contours[index]!, count)) ||
          [5, 8].includes(radialLobes(contours[index]!)) ||
          circularArcCoverage([contours[index]!]).filter(Boolean).length >= 270 ||
          (box.horizontal.some(([a, b]) => Math.abs(a![0]! - b![0]!) >= box.width * 0.7) &&
            box.vertical.some(([a, b]) => Math.abs(a![1]! - b![1]!) >= box.height * 0.7))),
    );
  const speaker = name.startsWith("volume")
    ? geometry.find(
        (box) =>
          box.width >= 250 &&
          box.height >= 300 &&
          box.horizontal.length >= 2 &&
          box.vertical.length >= 1,
      )
    : undefined;
  const dials = name.includes("clock")
    ? contours.filter((contour) => circularContour(contour, 80, 430)).map(carrierGeometry)
    : [];
  return contours.filter((contour, index) => {
    const box = geometry[index]!;
    if (completeBody && isolatedOffStripe(contour, completeBody)) return true;
    if (
      name.startsWith("folder-open") &&
      box.width >= 300 &&
      box.height >= 100 &&
      box.height <= 350 &&
      box.horizontal.length >= 2 &&
      contour
        .slice(1)
        .filter(
          (point, edge) =>
            Math.abs(point[0]! - contour[edge]![0]!) >= 40 &&
            Math.abs(point[1]! - contour[edge]![1]!) >= 100,
        ).length >= 2
    )
      return false;
    if (
      gridSeparators.some((rod) =>
        Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance
          ? Math.abs(box.cy - rod.a[1]!) <= designRules.grid.lengthTolerance &&
            box.height <= rod.width + designRules.grid.lengthTolerance &&
            box.x0 <= rod.a[0]! + rod.width / 2 &&
            box.x1 >= rod.b[0]! - rod.width / 2
          : Math.abs(box.cx - rod.a[0]!) <= designRules.grid.lengthTolerance &&
            box.width <= rod.width + designRules.grid.lengthTolerance &&
            box.y0 <= rod.a[1]! + rod.width / 2 &&
            box.y1 >= rod.b[1]! - rod.width / 2,
      )
    )
      return false;
    if (
      textRows.some((row) =>
        box.horizontal.some(
          ([a, b]) =>
            Math.abs((a![1]! - row.a[1]!) * 2) <= row.width + designRules.grid.lengthTolerance &&
            Math.min(a![0]!, b![0]!) <= row.a[0]! + designRules.grid.lengthTolerance &&
            Math.max(a![0]!, b![0]!) >= row.b[0]! - designRules.grid.lengthTolerance,
        ),
      )
    )
      return false;
    if (
      /^grid-[23]x2(?:-|$)/u.test(name) &&
      box.width >= 100 &&
      box.height >= 100 &&
      box.horizontal.some(([a, b]) => Math.abs(a![0]! - b![0]!) >= box.width * 0.7) &&
      box.vertical.some(([a, b]) => Math.abs(a![1]! - b![1]!) >= box.height * 0.7)
    )
      return false;
    if (
      carrier.some(
        ({ box: outer, index: outerIndex }) =>
          index !== outerIndex &&
          polygonArea(contours[index]!) * polygonArea(contours[outerIndex]!) < 0 &&
          box.x0 > outer.x0 &&
          box.x1 < outer.x1 &&
          box.y0 > outer.y0 &&
          box.y1 < outer.y1 &&
          box.width >= outer.width * 0.5 &&
          box.height >= outer.height * 0.5,
      )
    )
      return false;
    if (
      speaker &&
      box.x0 >= speaker.x0 &&
      box.x1 <= speaker.x1 &&
      box.y0 >= speaker.y0 &&
      box.y1 <= speaker.y1 &&
      box.vertical.length >= 1 &&
      polygonArea(contour) * largestArea < 0 &&
      box.width >= speaker.width * 0.5 &&
      box.height >= speaker.height * 0.5
    )
      return false;
    if (
      box.width >= 400 &&
      box.height >= 400 &&
      (circularContour(contour, 200, 430) ||
        [4, 5, 6, 7, 8].some((count) => convexFrame(contour, count)) ||
        [5, 8].includes(radialLobes(contour)) ||
        (box.horizontal.some(([a, b]) => Math.abs(a![0]! - b![0]!) >= box.width * 0.7) &&
          box.vertical.some(([a, b]) => Math.abs(a![1]! - b![1]!) >= box.height * 0.7)) ||
        circularArcCoverage([contour]).filter(Boolean).length >= 270)
    )
      return false;
    if (
      board &&
      name.startsWith("clipboard") &&
      box.width >= 100 &&
      box.width <= board.width * 0.65 &&
      box.height >= 50 &&
      box.height <= board.height * 0.3 &&
      Math.abs(box.cx - board.cx) <= board.width * 0.15 &&
      box.y0 < board.y1 &&
      box.y1 > board.y1
    )
      return false;
    if (
      board &&
      name.startsWith("calendar") &&
      box.width <= 100 &&
      box.height >= 80 &&
      box.x0 > board.x0 &&
      box.x1 < board.x1 &&
      box.y0 < board.y1 &&
      box.y1 > board.y1
    )
      return false;
    if (
      dials.some(
        (dial) =>
          (circularContour(contour, 80, 430) &&
            Math.hypot(box.cx - dial.cx, box.cy - dial.cy) <= designRules.grid.lengthTolerance) ||
          (box.x0 >= dial.x0 &&
            box.x1 <= dial.x1 &&
            box.y0 >= dial.y0 &&
            box.y1 <= dial.y1 &&
            sourceInk([contour], dial.cx, dial.cy)),
      )
    )
      return false;
    return true;
  });
}

/**
 * Reconstructs actual straight rods from opposed parallel boundaries, including merged plus/x strokes.
 * All candidate midlines must contain actual foreground; empty gaps never bridge a broken symbol.
 * Mitered joins trim opposed-edge overlap, so that overlap is not the full arm's aspect ratio.
 * @param contours - Actual isolated state polygons.
 * @returns Deduplicated straight centerlines and their measured normal widths.
 */
function symbolRods(contours: number[][][]): { a: number[]; b: number[]; width: number }[] {
  const joined = contours.map((contour) => {
    const points = contour.slice(0, -1),
      orientation = Math.sign(polygonArea(contour));
    return points.some((point, index) => {
      const before = points[(index + points.length - 1) % points.length]!,
        after = points[(index + 1) % points.length]!;
      const ax = point[0]! - before[0]!,
        ay = point[1]! - before[1]!,
        bx = after[0]! - point[0]!,
        by = after[1]! - point[1]!;
      const lengths = Math.hypot(ax, ay) * Math.hypot(bx, by),
        turn = ax * by - ay * bx;
      return lengths > 0 && turn * orientation < 0 && Math.abs(turn) / lengths > 0.1;
    });
  });
  const edges = contours.flatMap((contour, contourIndex) =>
    contour.slice(1).flatMap((b, index) => {
      const a = contour[index]!;
      return Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!) >= 70 ? [{ a, b, contourIndex }] : [];
    }),
  );
  const rods: { a: number[]; b: number[]; width: number }[] = [];
  for (const [index, first] of edges.entries()) {
    const length = Math.hypot(first.b[0]! - first.a[0]!, first.b[1]! - first.a[1]!),
      ux = (first.b[0]! - first.a[0]!) / length,
      uy = (first.b[1]! - first.a[1]!) / length,
      normal = [-uy, ux];
    for (const second of edges.slice(index + 1)) {
      const sx = second.b[0]! - second.a[0]!,
        sy = second.b[1]! - second.a[1]!;
      if (Math.abs(ux * sy - uy * sx) > designRules.visual.comparison.subdivisionUnits) continue;
      const a = projectedExtent([first.a, first.b], [ux, uy]),
        b = projectedExtent([second.a, second.b], [ux, uy]),
        lower = Math.max(a[0]!, b[0]!),
        upper = Math.min(a[1]!, b[1]!),
        na = first.a[0]! * normal[0]! + first.a[1]! * normal[1]!,
        nb = second.a[0]! * normal[0]! + second.a[1]! * normal[1]!,
        width = Math.abs(na - nb);
      if (
        width < designRules.visual.strokeWidths.display.target / 4 ||
        width > designRules.visual.strokeWidths.compact.target * 2 ||
        upper - lower < 70 ||
        (upper - lower < width * 1.2 &&
          !(first.contourIndex === second.contourIndex && joined[first.contourIndex]))
      )
        continue;
      const offset = (na + nb) / 2;
      const points = [lower, upper].map((distance) => [
        distance * ux + offset * normal[0]!,
        distance * uy + offset * normal[1]!,
      ]);
      if (lineCapacity(contours, points[0]!, points[1]!) < 1 - 1e-9) continue;
      if (
        ![0.2, 0.5, 0.8].every((t) => {
          const center = [
            points[0]![0]! + t * (points[1]![0]! - points[0]![0]!),
            points[0]![1]! + t * (points[1]![1]! - points[0]![1]!),
          ];
          const half = width / 2 - designRules.visual.comparison.subdivisionUnits;
          return (
            lineCapacity(
              contours,
              [center[0]! - half * normal[0]!, center[1]! - half * normal[1]!],
              [center[0]! + half * normal[0]!, center[1]! + half * normal[1]!],
            ) >=
            1 - 1e-9
          );
        })
      )
        continue;
      if (
        points[0]![0]! > points[1]![0]! ||
        (Math.abs(points[0]![0]! - points[1]![0]!) < 1e-8 && points[0]![1]! > points[1]![1]!)
      )
        points.reverse();
      rods.push({ a: points[0]!, b: points[1]!, width });
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < rods.length; i++)
      for (let j = i + 1; j < rods.length; j++) {
        const first = rods[i]!,
          second = rods[j]!,
          length = Math.hypot(first.b[0]! - first.a[0]!, first.b[1]! - first.a[1]!),
          axis = [(first.b[0]! - first.a[0]!) / length, (first.b[1]! - first.a[1]!) / length],
          normal = [-axis[1]!, axis[0]!];
        const a = projectedExtent([first.a, first.b], axis),
          b = projectedExtent([second.a, second.b], axis),
          offsetA = projectedExtent([first.a, first.b], normal),
          offsetB = projectedExtent([second.a, second.b], normal),
          gap = Math.max(a[0]!, b[0]!) - Math.min(a[1]!, b[1]!);
        if (
          Math.abs(offsetA[2]! - offsetB[2]!) > designRules.grid.lengthTolerance ||
          Math.abs(offsetB[1]! - offsetB[0]!) > designRules.grid.lengthTolerance ||
          gap > Math.max(first.width, second.width) * 1.5
        )
          continue;
        const lower = Math.min(a[0]!, b[0]!),
          upper = Math.max(a[1]!, b[1]!),
          offset = (offsetA[2]! + offsetB[2]!) / 2;
        const mergedStart = [
            lower * axis[0]! + offset * normal[0]!,
            lower * axis[1]! + offset * normal[1]!,
          ],
          mergedEnd = [
            upper * axis[0]! + offset * normal[0]!,
            upper * axis[1]! + offset * normal[1]!,
          ];
        if (lineCapacity(contours, mergedStart, mergedEnd) < 1 - 1e-9) continue;
        rods[i] = {
          a: [lower * axis[0]! + offset * normal[0]!, lower * axis[1]! + offset * normal[1]!],
          b: [upper * axis[0]! + offset * normal[0]!, upper * axis[1]! + offset * normal[1]!],
          width: (first.width + second.width) / 2,
        };
        rods.splice(j, 1);
        changed = true;
        break outer;
      }
  }
  return rods;
}

/**
 * Computes a proper interior intersection between two actual straight symbol rods.
 * @param first - First measured rod.
 * @param second - Second measured rod.
 * @returns Whether both rods extend beyond their intersection, rather than only sharing an end.
 */
function crossingRods(
  first: ReturnType<typeof symbolRods>[number],
  second: ReturnType<typeof symbolRods>[number],
): boolean {
  const ax = first.b[0]! - first.a[0]!,
    ay = first.b[1]! - first.a[1]!,
    bx = second.b[0]! - second.a[0]!,
    by = second.b[1]! - second.a[1]!,
    denominator = ax * by - ay * bx;
  if (Math.abs(denominator) < 1e-9) return false;
  const dx = second.a[0]! - first.a[0]!,
    dy = second.a[1]! - first.a[1]!,
    t = (dx * by - dy * bx) / denominator,
    u = (dx * ay - dy * ax) / denominator;
  const margin = Math.max(first.width, second.width) / 2 + designRules.grid.lengthTolerance;
  const firstLength = Math.hypot(ax, ay),
    secondLength = Math.hypot(bx, by);
  return (
    t * firstLength > margin &&
    (1 - t) * firstLength > margin &&
    u * secondLength > margin &&
    (1 - u) * secondLength > margin
  );
}

/**
 * Checks actual stroke contact, including a T endpoint which is not a proper interior crossing.
 * @param first - First measured rod.
 * @param second - Second measured rod.
 * @returns Whether the measured finite strokes intersect or overlap at an endpoint.
 */
function touchingRods(
  first: ReturnType<typeof symbolRods>[number],
  second: ReturnType<typeof symbolRods>[number],
): boolean {
  return (
    crossingRods(first, second) ||
    [first.a, first.b].some(
      (point) =>
        geometryTools.distanceToSegment(point, second.a, second.b) <=
        (first.width + second.width) / 2,
    ) ||
    [second.a, second.b].some(
      (point) =>
        geometryTools.distanceToSegment(point, first.a, first.b) <=
        (first.width + second.width) / 2,
    )
  );
}

/**
 * Checks whether a state edge changes actual composite ink instead of being hidden in a filled body.
 * @param symbol - Isolated state contours.
 * @param complete - Unmodified actual carrier/state contours.
 * @returns Whether at least one real state boundary remains visible in the composite.
 */
function visibleStateEdge(symbol: number[][][], complete: number[][][]): boolean {
  for (const contour of symbol)
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!,
        length = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!);
      if (length < designRules.visual.comparison.subdivisionUnits) continue;
      const nx = (-(b[1]! - a[1]!) / length) * designRules.grid.lengthTolerance,
        ny = ((b[0]! - a[0]!) / length) * designRules.grid.lengthTolerance;
      const cuts = [
        ...lineCuts(complete, [a[0]! + nx, a[1]! + ny], [b[0]! + nx, b[1]! + ny]),
        ...lineCuts(complete, [a[0]! - nx, a[1]! - ny], [b[0]! - nx, b[1]! - ny]),
      ].sort((left, right) => left - right);
      for (let interval = 1; interval < cuts.length; interval++) {
        if (cuts[interval]! - cuts[interval - 1]! <= 1e-9) continue;
        const t = (cuts[interval]! + cuts[interval - 1]!) / 2,
          x = a[0]! + (b[0]! - a[0]!) * t,
          y = a[1]! + (b[1]! - a[1]!) * t;
        if (
          sourceInk(symbol, x + nx, y + ny) !== sourceInk(symbol, x - nx, y - ny) &&
          sourceInk(complete, x + nx, y + ny) !== sourceInk(complete, x - nx, y - ny)
        )
          return true;
      }
    }
  return false;
}

/**
 * Checks independently defined question hooks and closed/open lock carriers.
 * @param token - Requested curved state identity.
 * @param symbol - Isolated state polygons.
 * @returns Whether all visible defining state features exist.
 */
function curvedState(token: string, symbol: number[][][]): boolean {
  const geometry = symbol.map(carrierGeometry);
  if (token === "help" || token === "question") {
    const dots = diceDotCenters(symbol);
    return geometry.some((box, index) => {
      if (symbol[index]!.length < 20 || box.width < 120 || box.height < 160) return false;
      const dot = dots.find(
        ([x, y]) => Math.abs(x! - box.cx) <= box.width * 0.3 && y! < box.y0 - 15,
      );
      if (!dot) return false;
      const upper = box.y0 + box.height * 0.65;
      const runs = inkRuns([symbol[index]!], [box.x0, upper], [box.x1, upper]);
      const lower = inkRuns([symbol[index]!], [box.x0, box.y0 + 20], [box.x1, box.y0 + 20]);
      return (
        runs.length === 2 &&
        lower.length === 1 &&
        Math.abs((lower[0]![0]! + lower[0]![1]!) / 2 - (dot[0]! - box.x0) / box.width) <= 0.15
      );
    });
  }
  if (token === "lock" || token === "unlock") {
    /**
     * Uses the secondary body's own side scale instead of the full-size carrier's boundary filter.
     */
    const bodies = symbol.map((part, index) => {
      const box = geometry[index]!,
        minimumSide = Math.min(box.width, box.height) * 0.2,
        horizontal: number[][][] = [],
        vertical: number[][][] = [];
      for (let edge = 1; edge < part.length; edge++) {
        const a = part[edge - 1]!,
          b = part[edge]!;
        if (
          Math.abs(a[1]! - b[1]!) <= designRules.visual.comparison.subdivisionUnits &&
          Math.abs(a[0]! - b[0]!) >= minimumSide
        )
          horizontal.push([a, b]);
        if (
          Math.abs(a[0]! - b[0]!) <= designRules.visual.comparison.subdivisionUnits &&
          Math.abs(a[1]! - b[1]!) >= minimumSide
        )
          vertical.push([a, b]);
      }
      return { ...box, horizontal, vertical };
    });
    const candidates = bodies.filter(
      (box) =>
        box.width >= 160 &&
        box.width <= 380 &&
        box.height >= 100 &&
        box.height <= 300 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2,
    );
    if (!candidates.length) {
      for (const box of bodies)
        for (const [index, [a, b]] of box.vertical.entries())
          for (const [c, d] of box.vertical.slice(index + 1)) {
            const x0 = Math.min(a![0]!, c![0]!),
              x1 = Math.max(a![0]!, c![0]!),
              y0 = Math.min(a![1]!, b![1]!),
              y1 = Math.max(a![1]!, b![1]!);
            if (
              x1 - x0 >= 160 &&
              x1 - x0 <= 380 &&
              y1 - y0 >= 100 &&
              y1 - y0 <= 300 &&
              Math.abs(y0 - Math.min(c![1]!, d![1]!)) <= designRules.grid.lengthTolerance &&
              Math.abs(y1 - Math.max(c![1]!, d![1]!)) <= designRules.grid.lengthTolerance
            )
              candidates.push(
                carrierGeometry([
                  [x0, y0],
                  [x1, y0],
                  [x1, y1],
                  [x0, y1],
                  [x0, y0],
                ]),
              );
          }
    }
    /**
     * A document fold can resemble a small box; a lock also requires its own attached shackle.
     */
    return candidates.some((body) =>
      geometry.some(
        (box, index) =>
          symbol[index]!.length >= 20 &&
          box.width >= body.width * 0.45 &&
          box.width <= body.width &&
          box.y1 > body.y1 + 80 &&
          box.y0 <= body.y1 + 20 &&
          Math.abs(box.cx - body.cx) <= body.width * 0.25 &&
          sourceInk(symbol, box.cx, box.y1 - 20) &&
          !sourceInk(symbol, box.cx, body.y1 + 20) &&
          inkRuns(symbol, [box.x0, body.y1 + 20], [box.x1, body.y1 + 20]).length ===
            (token === "lock" ? 2 : 1),
      ),
    );
  }
  return false;
}

/**
 * Checks right-facing play triangles, paired pause strokes and a true open-ring power symbol.
 * The enclosing frame is already removed; its sides cannot serve as pause strokes or a power stem.
 * @param token - Exact play, pause or power state.
 * @param symbol - Original isolated marker polygons.
 * @returns Whether the defining state geometry is present.
 */
function mediaState(token: string, symbol: number[][][]): boolean {
  const rods = symbolRods(symbol);
  if (token === "play")
    return symbol.some((part) => {
      const box = carrierGeometry(part);
      if (Math.min(box.width, box.height) < 80) return false;
      const scale = 600 / Math.min(box.width, box.height);
      const normalized = part.map(([x, y]) => [
        480 + (x! - box.cx) * scale,
        320 + (y! - box.cy) * scale,
      ]);
      return (
        convexFrame(normalized, 3) &&
        box.vertical.some(
          ([a, b]) =>
            Math.abs(a![0]! - box.x0) <= designRules.grid.lengthTolerance &&
            Math.abs(a![1]! - b![1]!) >= box.height * 0.6,
        )
      );
    });
  const vertical = rods.filter(
    (rod) =>
      Math.abs(rod.a[0]! - rod.b[0]!) <= designRules.grid.lengthTolerance &&
      rod.b[1]! - rod.a[1]! >= 100,
  );
  if (token === "pause")
    return vertical.some((a, index) =>
      vertical
        .slice(index + 1)
        .some(
          (b) =>
            Math.abs(a.a[0]! - b.a[0]!) > (a.width + b.width) / 2 &&
            Math.abs(a.a[1]! - b.a[1]!) <= designRules.grid.lengthTolerance &&
            Math.abs(a.b[1]! - b.b[1]!) <= designRules.grid.lengthTolerance,
        ),
    );
  if (token === "power")
    return symbol.some((part) => {
      const arc = openCircularArc(part);
      if (
        !arc ||
        arc.start[1]! <= arc.center[1]! + arc.radius * 0.3 ||
        arc.end[1]! <= arc.center[1]! + arc.radius * 0.3 ||
        (arc.start[0]! - arc.center[0]!) * (arc.end[0]! - arc.center[0]!) >= 0
      )
        return false;
      return vertical.some(
        (stem) =>
          Math.abs(stem.a[0]! - arc.center[0]!) <= designRules.grid.lengthTolerance &&
          stem.a[1]! < arc.center[1]! + arc.radius * 0.5 &&
          stem.b[1]! > arc.center[1]! + arc.radius,
      );
    });
  throw new Error("Unsupported media state: " + token);
}

/**
 * Checks toothed gears with an open hub, and pen shafts joined to a genuine projecting nib.
 * Radial protrusions alone do not turn a holed star into a gear; plain diagonal sticks are not pens.
 * @param token - Exact cog or pen state.
 * @param symbol - Original isolated marker polygons.
 * @returns Whether all necessary editing-state features exist.
 */
function editingState(token: string, symbol: number[][][]): boolean {
  if (token === "cog")
    return gitNodes(symbol).some((hub) =>
      symbol.some((part) => {
        const radii = radialProfile(part, [hub.cx, hub.cy]),
          maximum = Math.max(...radii),
          minimum = Math.min(...radii);
        if (minimum <= 0 || maximum - minimum < maximum * 0.05) return false;
        const crests = radii.map((radius) => radius >= maximum * 0.97),
          starts = crests.flatMap((present, index) =>
            present && !crests[(index + 359) % 360] ? [index] : [],
          );
        return (
          starts.length >= 5 &&
          starts.every((start) => [0, 1, 2].every((offset) => crests[(start + offset) % 360]))
        );
      }),
    );
  if (token === "pen")
    return symbolRods(symbol).some((shaft) => {
      const length = Math.hypot(shaft.b[0]! - shaft.a[0]!, shaft.b[1]! - shaft.a[1]!);
      if (length < 150) return false;
      const axis = [(shaft.b[0]! - shaft.a[0]!) / length, (shaft.b[1]! - shaft.a[1]!) / length],
        extent = projectedExtent([shaft.a, shaft.b], axis);
      return symbol.some((part) => {
        const box = carrierGeometry(part);
        if (Math.min(box.width, box.height) < 40) return false;
        const scale = 600 / Math.min(box.width, box.height),
          normalized = part.map(([x, y]) => [
            480 + (x! - box.cx) * scale,
            320 + (y! - box.cy) * scale,
          ]);
        if (!convexFrame(normalized, 3) && !convexFrame(normalized, 5)) return false;
        const nib = projectedExtent(part, axis);
        const across = projectedExtent(part, [-axis[1]!, axis[0]!]);
        if (across[1]! - across[0]! > shaft.width * 1.5) return false;
        return [false, true].some((forward) => {
          const join = forward ? shaft.b : shaft.a,
            tip = forward ? nib[1]! : nib[0]!,
            end = forward ? extent[1]! : extent[0]!;
          return (
            (forward ? tip - end : end - tip) >
              shaft.width / 2 + designRules.grid.lengthTolerance &&
            part.some(
              (point) =>
                geometryTools.distanceToSegment(point, shaft.a, shaft.b) <= shaft.width &&
                Math.hypot(point[0]! - join[0]!, point[1]! - join[1]!) <= shaft.width * 1.5,
            )
          );
        });
      });
    });
  throw new Error("Unsupported editing state: " + token);
}

/**
 * Checks charging lightning and sync's paired update paths as symbols, never intensity levels.
 * A convex six-sided nut is not lightning, and one generic rotating arrow is not a paired update.
 * @param token - Exact charging or sync token.
 * @param symbol - Original isolated state geometry.
 * @returns Whether the necessary symbolic-state structure exists.
 */
function utilityState(token: string, symbol: number[][][]): boolean {
  if (token === "sync")
    return (
      rotationFeatures("refresh-cw", symbol).length === 0 ||
      rotationFeatures("refresh-ccw", symbol).length === 0
    );
  if (token === "charging")
    return symbol.some((part) => {
      const box = carrierGeometry(part);
      if (box.height <= box.width || box.height < 100) return false;
      const scale = 600 / Math.min(box.width, box.height),
        normalized = part.map(([x, y]) => [
          480 + (x! - box.cx) * scale,
          320 + (y! - box.cy) * scale,
        ]);
      const sides = frameSides(normalized);
      if (sides.length !== 6) return false;
      const turns = sides.map((side, index) => {
        const next = sides[(index + 1) % sides.length]!;
        return Math.sign(side[0]! * next[1]! - side[1]! * next[0]!);
      });
      return (
        turns.every(Boolean) &&
        Math.min(
          turns.filter((turn) => turn > 0).length,
          turns.filter((turn) => turn < 0).length,
        ) === 2 &&
        visibleStateEdge([part], symbol)
      );
    });
  throw new Error("Unsupported utility state: " + token);
}

/**
 * Applies TC04's straight and curved state primitives without carrier-border substitution.
 * @param name - Canonical composite identity.
 * @param contours - Actual carrier plus state source polygons.
 * @returns Missing basic state geometry or complete occlusion failures.
 */
function basicStateFeatures(name: string, contours: number[][][]): string[] {
  const requested = name
    .split("-")
    .map((token) => (token === "warning" ? "alert" : token))
    .filter((token) =>
      [
        "check",
        "x",
        "plus",
        "minus",
        "off",
        "alert",
        "help",
        "question",
        "lock",
        "unlock",
        "play",
        "pause",
        "power",
        "cog",
        "pen",
        "charging",
        "sync",
      ].includes(token),
    );
  if (!requested.length) return [];
  const symbol = stateContours(name, contours),
    rods = symbolRods(symbol),
    dotCenters = diceDotCenters(symbol),
    failures: string[] = [];
  const horizontal = rods.filter(
      (rod) => Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance,
    ),
    vertical = rods.filter(
      (rod) => Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance,
    ),
    descending = rods.filter((rod) => rod.b[0]! - rod.a[0]! >= 40 && rod.b[1]! - rod.a[1]! <= -40),
    ascending = rods.filter((rod) => rod.b[0]! - rod.a[0]! >= 40 && rod.b[1]! - rod.a[1]! >= 40);
  for (const token of requested) {
    let valid = false;
    if (token === "minus")
      valid = horizontal.some((a) => !vertical.some((b) => touchingRods(a, b)));
    if (token === "plus") valid = horizontal.some((a) => vertical.some((b) => crossingRods(a, b)));
    if (token === "x") valid = descending.some((a) => ascending.some((b) => crossingRods(a, b)));
    if (token === "check")
      valid = descending.some((a) =>
        ascending.some(
          (b) =>
            Math.hypot(a.b[0]! - b.a[0]!, a.b[1]! - b.a[1]!) <= Math.max(a.width, b.width) * 1.5 &&
            Math.hypot(b.b[0]! - b.a[0]!, b.b[1]! - b.a[1]!) >
              Math.hypot(a.b[0]! - a.a[0]!, a.b[1]! - a.a[1]!) * 1.15,
        ),
      );
    if (token === "alert")
      valid = vertical.some((rod) =>
        dotCenters.some(
          ([x, y]) => Math.abs(x! - rod.a[0]!) <= rod.width / 2 && y! < rod.a[1]! - rod.width / 2,
        ),
      );
    if (token === "off" && contours.flat().length) {
      const body = carrierGeometry(contours.flat());
      valid = descending.some(
        (rod) =>
          Math.abs(rod.b[0]! - rod.a[0]!) >= body.width * 0.65 &&
          Math.abs(rod.b[1]! - rod.a[1]!) >= body.height * 0.65,
      );
    }
    if (["help", "question", "lock", "unlock"].includes(token)) valid = curvedState(token, symbol);
    if (["play", "pause", "power"].includes(token)) valid = mediaState(token, symbol);
    if (["cog", "pen"].includes(token)) valid = editingState(token, symbol);
    if (["charging", "sync"].includes(token)) valid = utilityState(token, symbol);
    if (!valid) failures.push("state " + token);
  }
  if (!failures.length && !visibleStateEdge(symbol, contours))
    failures.push("visible state boundary");
  return failures;
}

/**
 * Finds actual axis-aligned rectangular objects without treating nested counters as extra bars.
 * Rounded-corner subdivisions may coexist with genuine horizontal and vertical sides.
 * @param contours - Unmodified chart polygons.
 * @returns Distinct rectangular extents; foreground and hollow rectangles are both valid objects.
 */
function chartRectangles(contours: number[][][]): ReturnType<typeof carrierGeometry>[] {
  const boxes = contours.flatMap((contour) => {
    const box = carrierGeometry(contour);
    let horizontal = 0,
      vertical = 0;
    for (let index = 0; index < contour.length - 1; index++) {
      const a = contour[index]!,
        b = contour[index + 1]!;
      if (
        Math.abs(a[1]! - b[1]!) <= designRules.visual.comparison.subdivisionUnits &&
        Math.abs(a[0]! - b[0]!) >= 15
      )
        horizontal++;
      if (
        Math.abs(a[0]! - b[0]!) <= designRules.visual.comparison.subdivisionUnits &&
        Math.abs(a[1]! - b[1]!) >= 15
      )
        vertical++;
    }
    return horizontal >= 2 && vertical >= 2 && box.width >= 40 && box.height >= 40 ? [box] : [];
  });
  return boxes.filter(
    (box, index) =>
      !boxes.some(
        (outer, other) =>
          index !== other &&
          outer.width > box.width &&
          outer.height > box.height &&
          outer.x0 <= box.x0 &&
          outer.x1 >= box.x1 &&
          outer.y0 <= box.y0 &&
          outer.y1 >= box.y1,
      ),
  );
}

/**
 * Checks chart types, reading-order trends, stacking and forbidden coordinate axes.
 * Document/frame semantics are checked separately on the same original input.
 * @param name - Exact TC10 identity or a prescribed composite chart identity.
 * @param contours - Original flattened source geometry.
 * @returns Missing chart feature failures, independent of name hashes/categories.
 */
function chartFeatures(name: string, contours: number[][][]): string[] {
  const bare = name.replace(/^(?:file|square)-/u, "");
  let shape = contours;
  if (/^(?:file|square)-/u.test(name)) {
    const candidates = contours
      .map((part, index) => ({
        box: carrierGeometry(part),
        index,
        area: polygonArea(part),
      }))
      .filter(
        ({ box }) =>
          box.width >= 400 &&
          box.height >= 500 &&
          box.horizontal.length >= 2 &&
          box.vertical.length >= 2,
      )
      .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
    const carrier = candidates[0];
    if (carrier)
      shape = contours.filter((part, index) => {
        if (index === carrier.index) return false;
        const box = carrierGeometry(part),
          outer = carrier.box;
        return !(
          polygonArea(part) * carrier.area < 0 &&
          box.x0 > outer.x0 &&
          box.x1 < outer.x1 &&
          box.y0 > outer.y0 &&
          box.y1 < outer.y1 &&
          box.width >= outer.width * 0.5 &&
          box.height >= outer.height * 0.5
        );
      });
  }
  const failures: string[] = [],
    boxes = chartRectangles(shape),
    rods = symbolRods(shape);
  const horizontal = rods.filter(
      (rod) => Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance,
    ),
    vertical = rods.filter(
      (rod) => Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance,
    );
  const axes = horizontal.some((a) =>
    vertical.some(
      (b) =>
        Math.hypot(a.a[0]! - b.a[0]!, a.a[1]! - b.a[1]!) <= Math.max(a.width, b.width) &&
        a.b[0]! - a.a[0]! >= 400 &&
        b.b[1]! - b.a[1]! >= 400,
    ),
  );
  if (bare.includes("no-axes") && axes) failures.push("chart has no coordinate axes");
  const increasing = bare.includes("increasing"),
    decreasing = bare.includes("decreasing"),
    stacked = bare.includes("stacked");
  if (bare.includes("column") || bare.includes("bar") || bare.includes("combined")) {
    const columns = !bare.includes("bar");
    const selected = boxes.filter((box) => (columns ? box.width <= 180 : box.height <= 180));
    const groups: ReturnType<typeof carrierGeometry>[][] = [];
    for (const box of selected) {
      const group = groups.find(
        (parts) =>
          Math.abs((columns ? parts[0]!.cx : parts[0]!.cy) - (columns ? box.cx : box.cy)) <=
          designRules.grid.lengthTolerance,
      );
      if (group) group.push(box);
      else groups.push([box]);
    }
    groups.sort((a, b) => (columns ? a[0]!.cx - b[0]!.cx : b[0]!.cy - a[0]!.cy));
    if (groups.length < 3)
      failures.push(columns ? "at least three chart columns" : "at least three chart bars");
    if (stacked && groups.some((group) => group.length < 2))
      failures.push("at least two stacked segments per bar");
    const levels = groups.map((group) =>
      columns
        ? Math.max(...group.map((box) => box.y1)) - Math.min(...group.map((box) => box.y0))
        : Math.max(...group.map((box) => box.x1)) - Math.min(...group.map((box) => box.x0)),
    );
    if (
      (increasing || decreasing) &&
      levels.some(
        (level, index) =>
          index > 0 && (increasing ? level <= levels[index - 1]! : level >= levels[index - 1]!),
      )
    )
      failures.push("strict chart reading-order trend");
  }
  if (/(?:^|-)line(?:-|$)|combined/u.test(bare)) {
    const oblique = rods.filter(
      (rod) => Math.abs(rod.b[0]! - rod.a[0]!) >= 40 && Math.abs(rod.b[1]! - rod.a[1]!) >= 40,
    );
    const joined = oblique.some((a) =>
      oblique.some(
        (b) =>
          a !== b &&
          Math.hypot(a.b[0]! - b.a[0]!, a.b[1]! - b.a[1]!) <= Math.max(a.width, b.width) * 1.5 &&
          Math.abs(
            (a.b[0]! - a.a[0]!) * (b.b[1]! - b.a[1]!) - (a.b[1]! - a.a[1]!) * (b.b[0]! - b.a[0]!),
          ) > designRules.grid.lengthTolerance,
      ),
    );
    if (!joined) failures.push("connected chart polyline");
  }
  if (bare.includes("spline")) {
    const curved = shape.some((part) => {
      const box = carrierGeometry(part);
      if (part.length < 20 || box.width < 200 || box.height < 150 || circularContour(part, 25, 430))
        return false;
      let turns = 0;
      for (let index = 1; index < part.length - 1; index++) {
        const a = part[index - 1]!,
          b = part[index]!,
          c = part[index + 1]!,
          ax = b[0]! - a[0]!,
          ay = b[1]! - a[1]!,
          bx = c[0]! - b[0]!,
          by = c[1]! - b[1]!,
          lengths = Math.hypot(ax, ay) * Math.hypot(bx, by);
        if (
          b[0]! > box.x0 + box.width * 0.15 &&
          b[0]! < box.x1 - box.width * 0.15 &&
          lengths > 0 &&
          Math.abs(ax * by - ay * bx) / lengths > 1e-4 &&
          Math.hypot(ax, ay) < 40 &&
          Math.hypot(bx, by) < 40
        )
          turns++;
      }
      return turns >= 16;
    });
    if (!curved) failures.push("smooth chart spline");
  }
  if (bare.includes("area")) {
    const area = shape.some((part) => {
      const box = carrierGeometry(part);
      return (
        box.width >= 300 &&
        box.height >= 200 &&
        Math.abs(polygonArea(part)) >= box.width * box.height * 0.25 &&
        box.horizontal.some(
          ([a, b]) =>
            Math.abs(a![0]! - b![0]!) >= box.width * 0.7 &&
            Math.abs(a![1]! - box.y0) <= designRules.grid.lengthTolerance,
        )
      );
    });
    if (!area) failures.push("closed chart area above baseline");
  }
  if (bare.includes("pie")) {
    const circles = shape.filter((part) => circularContour(part, 80, 430));
    const sector = shape.some(
      (part) =>
        part.length >= 20 &&
        part
          .slice(1)
          .filter(
            (b, index) => Math.hypot(b[0]! - part[index]![0]!, b[1]! - part[index]![1]!) >= 100,
          ).length >= 2 &&
        Math.abs(polygonArea(part)) >= 5000 &&
        visibleStateEdge([part], shape),
    );
    const radial = rods.some((rod) =>
      circles.some((circle) => {
        const box = carrierGeometry(circle),
          length = Math.hypot(rod.b[0]! - rod.a[0]!, rod.b[1]! - rod.a[1]!),
          nx = -(rod.b[1]! - rod.a[1]!) / length,
          ny = (rod.b[0]! - rod.a[0]!) / length,
          x = (rod.a[0]! + rod.b[0]!) / 2,
          y = (rod.a[1]! + rod.b[1]!) / 2;
        return (
          (Math.hypot(rod.a[0]! - box.cx, rod.a[1]! - box.cy) <= rod.width ||
            Math.hypot(rod.b[0]! - box.cx, rod.b[1]! - box.cy) <= rod.width) &&
          [1, -1].some(
            (side) =>
              sourceInk(
                shape,
                x + nx * (rod.width / 2 - 2) * side,
                y + ny * (rod.width / 2 - 2) * side,
              ) !==
              sourceInk(
                shape,
                x + nx * (rod.width / 2 + 2) * side,
                y + ny * (rod.width / 2 + 2) * side,
              ),
          )
        );
      }),
    );
    if (!circles.length || (!sector && !radial)) failures.push("circular pie and visible sector");
  }
  if (bare.includes("scatter") && diceDotCenters(shape).length < 2)
    failures.push("separate chart scatter points");
  if (bare.includes("candlestick")) {
    const bodies = boxes.filter(
      (box) => box.width >= 80 && box.width <= 180 && box.height >= 100 && box.height <= 400,
    );
    const stems = bodies.filter((box) =>
      vertical.some(
        (rod) =>
          Math.abs(rod.a[0]! - box.cx) <= designRules.grid.lengthTolerance &&
          rod.a[1]! < box.y0 &&
          rod.b[1]! > box.y1,
      ),
    );
    if (!bodies.length || stems.length !== bodies.length)
      failures.push("candlestick bodies with projecting wicks");
  }
  if (bare.includes("gantt")) {
    const bars = boxes.filter((box) => box.width >= 150 && box.height <= 120);
    if (
      bars.length < 2 ||
      new Set(bars.map((box) => box.cy)).size < 2 ||
      new Set(bars.map((box) => box.x0)).size < 2 ||
      new Set(bars.map((box) => box.width)).size < 2
    )
      failures.push("row-separated gantt ranges with distinct starts and lengths");
  }
  if (bare.includes("network")) {
    const nodes = diceDotCenters(shape),
      edges = rods.filter(
        (rod) =>
          nodes.some(([x, y]) => Math.hypot(rod.a[0]! - x!, rod.a[1]! - y!) <= 90) &&
          nodes.some(([x, y]) => Math.hypot(rod.b[0]! - x!, rod.b[1]! - y!) <= 90),
      );
    if (nodes.length < 2 || !edges.length) failures.push("chart nodes and connecting edges");
  }
  return failures;
}

/**
 * Finds visible rectangular layout regions, not contour duplicates or an enclosing carrier.
 * Both separate tiles and counters cut into one connected grid remain legitimate regions.
 * @param contours - Actual layout polygons.
 * @returns Distinct non-enclosing region extents.
 */
function layoutRegions(contours: number[][][]): ReturnType<typeof carrierGeometry>[] {
  const all = contours
    .map((part) => ({ part, box: carrierGeometry(part) }))
    .filter(
      ({ part, box }) =>
        box.width >= 100 &&
        box.height >= 100 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2 &&
        visibleStateEdge([part], contours),
    );
  const tiles = all.filter(
    ({ box }, index) =>
      !all.some(
        ({ box: inner }, other) =>
          index !== other &&
          inner.width < box.width - designRules.grid.lengthTolerance &&
          inner.height < box.height - designRules.grid.lengthTolerance &&
          inner.x0 > box.x0 &&
          inner.x1 < box.x1 &&
          inner.y0 > box.y0 &&
          inner.y1 < box.y1,
      ),
  );
  const distinct = tiles.filter(
    ({ box }, index) =>
      !tiles
        .slice(0, index)
        .some(
          ({ box: other }) =>
            Math.hypot(box.cx - other.cx, box.cy - other.cy) <= designRules.grid.lengthTolerance,
        ),
  );
  const exterior = contours.map(polygonArea).sort((a, b) => Math.abs(b) - Math.abs(a))[0] ?? 0;
  return distinct.flatMap(({ box, part }) =>
    polygonArea(part) * exterior < 0 ? partitionedLayoutRegion(box, contours) : [box],
  );
}

/**
 * Finds axis dividers whose two ends genuinely meet a counter boundary or another divider.
 * Floating status marks are not promoted to cell boundaries.
 * @param box - Actual enclosing counter bounds.
 * @param contours - Original complete foreground geometry.
 * @returns Actual anchored straight separator centerlines.
 */
function layoutSeparators(
  box: ReturnType<typeof carrierGeometry>,
  contours: number[][][],
): ReturnType<typeof symbolRods> {
  const rods = symbolRods(contours).filter((rod) => {
    const vertical = Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance,
      horizontal = Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance;
    return vertical
      ? rod.a[0]! > box.x0 + rod.width / 2 &&
          rod.a[0]! < box.x1 - rod.width / 2 &&
          rod.b[1]! - rod.a[1]! >= box.height / 4
      : horizontal &&
          rod.a[1]! > box.y0 + rod.width / 2 &&
          rod.a[1]! < box.y1 - rod.width / 2 &&
          rod.b[0]! - rod.a[0]! >= box.width / 4;
  });
  const separators = rods.filter((rod) => {
    const vertical = Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance;
    return [rod.a, rod.b].every((point) => {
      const position = vertical ? point[1]! : point[0]!,
        lower = vertical ? box.y0 : box.x0,
        upper = vertical ? box.y1 : box.x1;
      if (Math.abs(position - lower) <= rod.width || Math.abs(position - upper) <= rod.width)
        return true;
      return rods.some((other) => {
        const otherVertical =
          Math.abs(other.b[0]! - other.a[0]!) <= designRules.grid.lengthTolerance;
        return (
          otherVertical !== vertical &&
          geometryTools.distanceToSegment(point, other.a, other.b) <=
            Math.max(rod.width, other.width) / 2
        );
      });
    });
  });
  return separators;
}

/**
 * Recovers actual empty cells when one counter is divided by independently drawn straight rods.
 * Partial separators are respected by exact foreground continuity, preserving merged cells.
 * @param box - Actual enclosing counter bounds.
 * @param contours - Original complete foreground geometry.
 * @returns Real connected counter regions; the original extent is retained without valid dividers.
 */
function partitionedLayoutRegion(
  box: ReturnType<typeof carrierGeometry>,
  contours: number[][][],
): ReturnType<typeof carrierGeometry>[] {
  const separators = layoutSeparators(box, contours);
  if (!separators.length) return [box];
  const xs = layoutPositions([
    box.x0,
    box.x1,
    ...separators.flatMap((rod) =>
      Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance
        ? [rod.a[0]! - rod.width / 2, rod.a[0]! + rod.width / 2]
        : [],
    ),
  ]).filter((x) => x >= box.x0 && x <= box.x1);
  const ys = layoutPositions([
    box.y0,
    box.y1,
    ...separators.flatMap((rod) =>
      Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance
        ? [rod.a[1]! - rod.width / 2, rod.a[1]! + rod.width / 2]
        : [],
    ),
  ]).filter((y) => y >= box.y0 && y <= box.y1);
  const width = xs.length - 1,
    height = ys.length - 1,
    labels: number[] = Array.from({ length: width * height }, (_, index) => {
      const x = index % width,
        y = Math.floor(index / width);
      return sourceInk(contours, (xs[x]! + xs[x + 1]!) / 2, (ys[y]! + ys[y + 1]!) / 2) ? -1 : 0;
    });
  const regions: ReturnType<typeof carrierGeometry>[] = [];
  let component = 0;
  for (let seed = 0; seed < labels.length; seed++) {
    if (labels[seed] !== 0) continue;
    component++;
    const queue = [seed];
    labels[seed] = component;
    let x0 = Infinity,
      x1 = -Infinity,
      y0 = Infinity,
      y1 = -Infinity;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor]!,
        x = index % width,
        y = Math.floor(index / width),
        center = [(xs[x]! + xs[x + 1]!) / 2, (ys[y]! + ys[y + 1]!) / 2];
      x0 = Math.min(x0, xs[x]!);
      x1 = Math.max(x1, xs[x + 1]!);
      y0 = Math.min(y0, ys[y]!);
      y1 = Math.max(y1, ys[y + 1]!);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx! < 0 || ny! < 0 || nx! >= width || ny! >= height) continue;
        const next = ny! * width + nx!;
        if (labels[next] !== 0) continue;
        const target = [(xs[nx!]! + xs[nx! + 1]!) / 2, (ys[ny!]! + ys[ny! + 1]!) / 2];
        if (lineCapacity(contours, center, target) > 0) continue;
        labels[next] = component;
        queue.push(next);
      }
    }
    if (x1 - x0 >= 100 && y1 - y0 >= 100)
      regions.push(
        carrierGeometry([
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
          [x0, y0],
        ]),
      );
  }
  return regions.length ? regions : [box];
}

/**
 * Clusters exact region coordinates by the existing design tolerance.
 * @param values - Actual center coordinates; inputs remain unchanged.
 * @returns Ascending representative positions, without count-based relabeling.
 */
function layoutPositions(values: number[]): number[] {
  const positions: number[] = [];
  for (const value of [...values].sort((a, b) => a - b))
    if (
      !positions.some((existing) => Math.abs(value - existing) <= designRules.grid.lengthTolerance)
    )
      positions.push(value);
  return positions;
}

/**
 * Checks the explicit TC09 grid/column counts and nonregular freeform subdivisions.
 * Other TC09 subfamilies have separate checks and are not silently accepted by this helper.
 * @param name - Closed grid, column or freeform identity.
 * @param contours - Actual source layout geometry.
 * @returns Explicit missing/count/regularity failures.
 */
function gridLayoutFeatures(name: string, contours: number[][][]): string[] {
  const state = /-(?:check|plus|x)$/u.test(name) ? stateContours(name, contours) : [];
  const regions = layoutRegions(contours.filter((part) => !state.includes(part))),
    columns = layoutPositions(regions.map((box) => box.cx)),
    rows = layoutPositions(regions.map((box) => box.cy));
  if (name === "layout-freeform") {
    const frame = contours
      .map(carrierGeometry)
      .some(
        (box) =>
          box.width >= 500 &&
          box.height >= 500 &&
          box.horizontal.length >= 2 &&
          box.vertical.length >= 2 &&
          regions.every(
            (region) =>
              region.x0 > box.x0 && region.x1 < box.x1 && region.y0 > box.y0 && region.y1 < box.y1,
          ),
      );
    const dimensions = new Set(
      regions.map((box) => Math.round(box.width) + "/" + Math.round(box.height)),
    );
    return frame &&
      regions.length >= 3 &&
      dimensions.size >= 3 &&
      (regions.length !== columns.length * rows.length ||
        !regions.every(
          (box) =>
            Math.abs(box.width - regions[0]!.width) <= designRules.grid.lengthTolerance &&
            Math.abs(box.height - regions[0]!.height) <= designRules.grid.lengthTolerance,
        ))
      ? []
      : ["three different nonregular freeform regions"];
  }
  const columnOnly = name === "columns" || name === "columns-4" || name === "columns-settings";
  const wantedColumns = columnOnly ? (name === "columns-4" ? 4 : 2) : name === "grid-3x2" ? 3 : 2;
  const wantedRows = columnOnly ? 1 : 2;
  const exact = columnOnly || /^grid-[23]x2(?:-|$)/u.test(name);
  if (
    columns.length < wantedColumns ||
    rows.length < wantedRows ||
    (exact && (columns.length !== wantedColumns || rows.length !== wantedRows)) ||
    regions.length !== columns.length * rows.length
  )
    return ["exact layout row/column structure"];
  const regular = regions.every(
    (box) =>
      Math.abs(box.width - regions[0]!.width) <= designRules.grid.lengthTolerance &&
      Math.abs(box.height - regions[0]!.height) <= designRules.grid.lengthTolerance,
  );
  if (!regular) return ["regular layout cell dimensions"];
  if (
    [columns, rows].some((positions) =>
      positions.some(
        (value, index) =>
          index >= 2 &&
          Math.abs(value - positions[index - 1]! - (positions[1]! - positions[0]!)) >
            designRules.grid.lengthTolerance,
      ),
    )
  )
    return ["regular layout cell spacing"];
  const expected = columnOnly
    ? ["columns", "columns-4", "columns-settings"]
    : [
        "grid",
        "grid-2x2",
        "grid-2x2-check",
        "grid-2x2-plus",
        "grid-2x2-x",
        "grid-3x2",
        "layout-grid",
      ];
  if (!expected.includes(name)) throw new Error("Unsupported explicit grid layout: " + name);
  return [];
}

/**
 * Checks TC09 panel sides, genuine dashed separators and open/close arrow directions.
 * Opening moves away from the named panel; closing points toward that panel.
 * @param name - Exact panel identity from the closed TC09 table.
 * @param contours - Original carrier, separators and arrow polygons.
 * @returns Missing frame, side, dash or direction failures.
 */
function panelFeatures(name: string, contours: number[][][]): string[] {
  const frame = contours
    .map(carrierGeometry)
    .filter(
      (box) =>
        box.width >= 500 &&
        box.height >= 500 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2,
    )
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!frame) return ["panel outer frame"];
  const tokens = name.replace(/^layout-/u, "").split("-"),
    sides = tokens.filter((token) => ["left", "right", "top", "bottom"].includes(token));
  if (!sides.length) throw new Error("Unsupported closed panel identity: " + name);
  const rods = symbolRods(contours),
    failures: string[] = [];
  for (const side of sides) {
    const vertical = side === "left" || side === "right",
      extent = vertical ? frame.height : frame.width;
    const candidates = rods.filter((rod) => {
      const coordinate = vertical ? rod.a[0]! : rod.a[1]!,
        center = vertical ? frame.cx : frame.cy;
      const orthogonal = vertical
        ? Math.abs(rod.b[0]! - rod.a[0]!)
        : Math.abs(rod.b[1]! - rod.a[1]!);
      const lower = vertical ? frame.x0 : frame.y0,
        upper = vertical ? frame.x1 : frame.y1;
      return (
        orthogonal <= designRules.grid.lengthTolerance &&
        coordinate > lower + rod.width &&
        coordinate < upper - rod.width &&
        (side === "left" || side === "bottom" ? coordinate < center : coordinate > center)
      );
    });
    const positions = layoutPositions(candidates.map((rod) => (vertical ? rod.a[0]! : rod.a[1]!)));
    const separator = positions.some((position) => {
      const matching = candidates.filter(
        (rod) =>
          Math.abs((vertical ? rod.a[0]! : rod.a[1]!) - position) <=
          designRules.grid.lengthTolerance,
      );
      const spans = matching
        .map((rod) => projectedExtent([rod.a, rod.b], vertical ? [0, 1] : [1, 0]))
        .sort((a, b) => a[0]! - b[0]!);
      if (!spans.length || spans.at(-1)![1]! - spans[0]![0]! < extent * 0.5) return false;
      const gap = spans.some(
        (span, index) =>
          index > 0 && span[0]! - spans[index - 1]![1]! > designRules.grid.lengthTolerance,
      );
      return tokens.includes("dashed")
        ? spans.length >= 2 && gap
        : spans.some((span) => span[1]! - span[0]! >= extent * 0.5);
    });
    if (!separator)
      failures.push(
        "panel " + side + (tokens.includes("dashed") ? " dashed separator" : " separator"),
      );
  }
  if (tokens.includes("open") || tokens.includes("close")) {
    const toward: Record<string, string> = {
        left: "left",
        right: "right",
        top: "up",
        bottom: "down",
      },
      opposite: Record<string, string> = {
        left: "right",
        right: "left",
        up: "down",
        down: "up",
      };
    const direction = tokens.includes("open") ? opposite[toward[sides[0]!]!]! : toward[sides[0]!]!;
    if (!contours.some((part) => directionalFeatures("arrow-" + direction, [part]).length === 0))
      failures.push("panel arrow " + direction);
  }
  return failures;
}

/**
 * Identifies actual horizontal text rows, excluding enclosing frame edges and action marks.
 * A row group shares a text start rather than borrowing a left-hand minus/check marker.
 * @param contours - Original list polygons.
 * @returns Reading-order row rods with their measured widths.
 */
function listRows(contours: number[][][]): ReturnType<typeof symbolRods> {
  const content = stateContours("layout-list", contours),
    rods = symbolRods(content).filter(
      (rod) =>
        Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance &&
        rod.b[0]! - rod.a[0]! >= 150,
    );
  const groups = rods.map((rod) =>
    rods.filter((other) => Math.abs(rod.a[0]! - other.a[0]!) <= designRules.grid.lengthTolerance),
  );
  const regular = groups.sort((a, b) => b.length - a.length)[0] ?? [];
  const parent = rods.filter(
    (rod) =>
      !regular.includes(rod) &&
      rod.a[0]! < (regular[0]?.a[0] ?? Infinity) &&
      rod.b[0]! >= (regular[0]?.a[0] ?? Infinity),
  );
  return [...regular, ...parent]
    .filter(
      (rod, index, all) =>
        !all
          .slice(0, index)
          .some((other) => Math.abs(rod.a[1]! - other.a[1]!) <= designRules.grid.lengthTolerance),
    )
    .sort((a, b) => b.a[1]! - a.a[1]!);
}

/**
 * Counts real check junctions without counting an X, arrow or duplicate stroke as a check.
 * @param contours - Original independently isolated marker geometry.
 * @returns Distinct positions of visible short-to-long check connections.
 */
function checkJunctions(contours: number[][][]): number[][] {
  const rods = symbolRods(contours),
    positions: number[][] = [];
  for (const a of rods)
    for (const b of rods) {
      if (
        a.b[0]! - a.a[0]! < 40 ||
        a.b[1]! - a.a[1]! > -40 ||
        b.b[0]! - b.a[0]! < 40 ||
        b.b[1]! - b.a[1]! < 40 ||
        Math.hypot(a.b[0]! - b.a[0]!, a.b[1]! - b.a[1]!) > Math.max(a.width, b.width) * 1.5 ||
        Math.hypot(b.b[0]! - b.a[0]!, b.b[1]! - b.a[1]!) <=
          Math.hypot(a.b[0]! - a.a[0]!, a.b[1]! - a.a[1]!) * 1.15
      )
        continue;
      const point = [(a.b[0]! + b.a[0]!) / 2, (a.b[1]! + b.a[1]!) / 2];
      if (
        !positions.some(
          ([x, y]) =>
            Math.hypot(x! - point[0]!, y! - point[1]!) <= designRules.grid.lengthTolerance,
        )
      )
        positions.push(point);
    }
  return positions;
}

/**
 * Recognizes the structural profiles of ordered-list 1/2/3 labels, not a filename/hash.
 * Probes distinguish narrow one, a two turning to the lower left and two right-hand three lobes.
 * @param contours - Actual polygons belonging to one label.
 * @param number - Required label value, one through three.
 * @returns Whether the actual profile expresses the requested digit.
 */
function orderedDigit(contours: number[][][], number: number): boolean {
  if (!contours.flat().length) return false;
  const box = carrierGeometry(contours.flat());
  if (box.width <= 0 || box.height <= 0) return false;
  const ink = (x: number, y: number) =>
    sourceInk(contours, box.x0 + box.width * x, box.y0 + box.height * y);
  if (number === 1)
    return box.width < box.height * 0.5 && [0.25, 0.5, 0.75].every((y) => ink(0.5, y));
  if (number === 2)
    return (
      box.width >= box.height * 0.5 &&
      ink(0.85, 0.75) &&
      ink(0.15, 0.25) &&
      !ink(0.85, 0.25) &&
      ink(0.5, 0.05) &&
      ink(0.5, 0.95)
    );
  if (number === 3)
    return (
      box.width >= box.height * 0.5 &&
      ink(0.85, 0.75) &&
      ink(0.85, 0.25) &&
      !ink(0.15, 0.25) &&
      ink(0.5, 0.05) &&
      ink(0.5, 0.5) &&
      ink(0.5, 0.95)
    );
  throw new Error("Unsupported ordered-list digit.");
}

/**
 * Checks TC09 list rows and the prescribed ordered/check/tree/sort/indent distinctions.
 * Row geometry and state/clock add-ons remain separate checks on the same composite.
 * @param name - Exact list or layout-list/contents identity.
 * @param contours - Original source polygons.
 * @returns Missing text rows or defining list-action failures.
 */
function listFeatures(name: string, contours: number[][][]): string[] {
  const rows = listRows(contours),
    failures: string[] = [];
  if (rows.length < 3) return ["at least three horizontal list rows"];
  const left = Math.min(...rows.map((rod) => rod.a[0]!));
  const marks = contours.filter(
    (part) => carrierGeometry(part).x1 < left - designRules.grid.lengthTolerance,
  );
  if (name === "list-ordered") {
    const distance = Math.min(
      ...rows.slice(1).map((rod, index) => Math.abs(rod.a[1]! - rows[index]!.a[1]!)),
    );
    for (let index = 0; index < 3; index++) {
      const label = marks.filter(
        (part) => Math.abs(carrierGeometry(part).cy - rows[index]!.a[1]!) < distance * 0.45,
      );
      if (!orderedDigit(label, index + 1)) failures.push("ordered list digit " + (index + 1));
    }
  }
  if (name === "list-check" || name === "list-checks") {
    if (checkJunctions(marks).length < (name === "list-checks" ? 2 : 1))
      failures.push("list check markers");
  }
  if (name === "list-tree") {
    const rods = symbolRods(stateContours("layout-list", contours));
    const connected = rows.some((parent) =>
      rows.some(
        (child) =>
          child !== parent &&
          child.a[0]! > parent.a[0]! + designRules.grid.lengthTolerance &&
          parent.a[1]! > child.a[1]! &&
          rods.some(
            (rod) =>
              Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance &&
              rod.a[0]! >= parent.a[0]! &&
              rod.a[0]! <= child.a[0]! + designRules.grid.lengthTolerance &&
              rod.a[1]! <= child.a[1]! &&
              rod.b[1]! >= parent.a[1]! &&
              rods.some(
                (branch) =>
                  Math.abs(branch.b[1]! - branch.a[1]!) <= designRules.grid.lengthTolerance &&
                  Math.abs(branch.a[1]! - child.a[1]!) <= designRules.grid.lengthTolerance &&
                  branch.a[0]! <= rod.a[0]! + designRules.grid.lengthTolerance &&
                  branch.b[0]! >= child.a[0]! - designRules.grid.lengthTolerance,
              ),
          ),
      ),
    );
    if (!connected) failures.push("indented parent/child rows with a connecting branch");
  }
  const key =
    name === "list-sort-ascending"
      ? "up"
      : name === "list-sort-descending"
        ? "down"
        : name === "list-indent-increase"
          ? "right"
          : name === "list-indent-decrease"
            ? "left"
            : null;
  if (key && !marks.some((part) => directionalFeatures("arrow-" + key, [part]).length === 0))
    failures.push("list action arrow " + key);
  return failures;
}

/**
 * Checks real table rows/columns and an actual full transverse gap for row/column separation.
 * Merge/split edge changes are additionally compared with the current table subject, never history.
 * @param name - Closed table identity, excluding the full-phrase table-of-contents list.
 * @param contours - Original table source geometry.
 * @returns Missing matrix or split-axis failures.
 */
function tableFeatures(name: string, contours: number[][][]): string[] {
  const regions = layoutRegions(contours),
    failures: string[] = [];
  const rows = layoutPositions(regions.map((box) => box.y0)),
    columns = layoutPositions(regions.map((box) => box.x0));
  if (
    rows.length < 2 ||
    columns.length < 2 ||
    regions.length < (name === "table-cells-merge" ? 3 : 4)
  )
    return ["at least two table rows and columns"];
  const bounds = carrierGeometry(contours.flat());
  for (const axis of name === "table-split"
    ? ["horizontal", "vertical"]
    : name === "table-rows-split"
      ? ["horizontal"]
      : name === "table-columns-split"
        ? ["vertical"]
        : []) {
    const vertical = axis === "vertical",
      centers = layoutPositions(regions.map((box) => (vertical ? box.cx : box.cy)));
    const edges = layoutPositions(
      regions.flatMap((box) => (vertical ? [box.x0, box.x1] : [box.y0, box.y1])),
    );
    const positions = edges
      .slice(1)
      .map((edge, index) => (edges[index]! + edge) / 2)
      .filter((coordinate) => coordinate > centers[0]! && coordinate < centers.at(-1)!);
    const gap = positions.some(
      (coordinate) =>
        lineCapacity(
          contours,
          vertical
            ? [coordinate, bounds.y0 + designRules.grid.lengthTolerance]
            : [bounds.x0 + designRules.grid.lengthTolerance, coordinate],
          vertical
            ? [coordinate, bounds.y1 - designRules.grid.lengthTolerance]
            : [bounds.x1 - designRules.grid.lengthTolerance, coordinate],
        ) === 0,
    );
    if (!gap) failures.push("table " + axis + " separating gap");
  }
  return failures;
}

/**
 * Verifies changed internal cell boundaries against the same current table family subject.
 * These in-memory comparisons are not a historical baseline or an execution record.
 * @param base - Current plain table source polygons.
 * @param changed - Current merge/split source polygons.
 * @param operation - Required internal-edge action.
 * @returns Missing removed/added internal boundary failures.
 */
function tableMutationFeatures(
  base: number[][][],
  changed: number[][][],
  operation: "merge" | "split",
): string[] {
  const reference = layoutRegions(base),
    actual = layoutRegions(changed);
  const failures = [
    ...tableFeatures("table", base),
    ...tableFeatures("table-cells-" + operation, changed),
  ];
  /**
   * Anchored partial dividers remain real edges even when the resulting cell is narrow.
   * An isolated state mark cannot qualify: both divider ends must meet a boundary.
   * @param parts - Complete unchanged table contours.
   * @returns Counter-anchored internal dividers only.
   */
  const dividers = (parts: number[][][]) => {
    const exterior = parts.map(polygonArea).sort((a, b) => Math.abs(b) - Math.abs(a))[0] ?? 0;
    return parts.flatMap((part) => {
      const box = carrierGeometry(part);
      return box.width >= 500 && box.height >= 500 && polygonArea(part) * exterior < 0
        ? layoutSeparators(box, parts)
        : [];
    });
  };
  const changedEdge = (operation === "merge" ? dividers(base) : dividers(changed)).some(
    (rod) => lineCapacity(operation === "merge" ? changed : base, rod.a, rod.b) < 1 - 1e-9,
  );
  if (
    !changedEdge &&
    (operation === "merge" ? actual.length >= reference.length : actual.length <= reference.length)
  )
    failures.push(
      operation === "merge"
        ? "removed merged-cell internal edge"
        : "added split-cell internal edge",
    );
  return failures;
}

/**
 * Checks alignment baselines, named start/end/center anchors and true equal-axis distribution.
 * Space-around/between additionally use real enclosing end guides, not object-count changes.
 * @param name - Exact closed TC09 align identity.
 * @param contours - Original object rectangles and reference-guide geometry.
 * @returns Explicit baseline, anchor, count or spacing failures.
 */
function alignmentFeatures(name: string, contours: number[][][]): string[] {
  const horizontal = name.includes("horizontal"),
    tokens = name.split("-"),
    anchor = tokens.find((token) => ["start", "end", "center"].includes(token)) ?? "center";
  const objects = chartRectangles(contours).filter(
    (box) =>
      !(
        Math.max(box.width, box.height) >= 600 &&
        Math.min(box.width, box.height) <= designRules.visual.strokeWidths.compact.target * 2
      ),
  );
  const guides = symbolRods(contours).filter((rod) =>
    horizontal
      ? Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance &&
        rod.b[1]! - rod.a[1]! >= 600
      : Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance &&
        rod.b[0]! - rod.a[0]! >= 600,
  );
  const positions = objects
    .map((box) =>
      horizontal
        ? anchor === "start"
          ? box.x0
          : anchor === "end"
            ? box.x1
            : box.cx
        : anchor === "start"
          ? box.y1
          : anchor === "end"
            ? box.y0
            : box.cy,
    )
    .sort((a, b) => (horizontal ? a - b : b - a));
  if (objects.length < (tokens.includes("distribute") || tokens.includes("space") ? 3 : 2))
    return ["alignment object count"];
  if (
    (tokens.includes("distribute") || tokens.includes("space")) &&
    objects.some(
      (box) =>
        Math.abs((horizontal ? box.cy : box.cx) - (horizontal ? objects[0]!.cy : objects[0]!.cx)) >
        designRules.grid.lengthTolerance,
    )
  )
    return ["objects on the same named axis"];
  if (tokens.includes("distribute")) {
    const step = Math.abs(positions[1]! - positions[0]!);
    return step > designRules.grid.lengthTolerance &&
      positions
        .slice(2)
        .every(
          (position, index) =>
            Math.abs(Math.abs(position - positions[index + 1]!) - step) <=
            designRules.grid.lengthTolerance,
        )
      ? []
      : ["equal named-axis anchor spacing"];
  }
  if (tokens.includes("space")) {
    const boundaries = layoutPositions(guides.map((rod) => (horizontal ? rod.a[0]! : rod.a[1]!)));
    if (boundaries.length !== 2) return ["two spacing end guides"];
    const sorted = [...objects].sort((a, b) => (horizontal ? a.x0 - b.x0 : a.y0 - b.y0));
    const starts = sorted.map((box) => (horizontal ? box.x0 : box.y0)),
      ends = sorted.map((box) => (horizontal ? box.x1 : box.y1));
    const gaps = starts.slice(1).map((start, index) => start - ends[index]!);
    const left = starts[0]! - boundaries[0]!,
      right = boundaries[1]! - ends.at(-1)!,
      gap = gaps[0]!;
    const expectedEdge = tokens.includes("around") ? gap / 2 : 0;
    return gap > 0 &&
      gaps.every((space) => Math.abs(space - gap) <= designRules.grid.lengthTolerance) &&
      Math.abs(left - expectedEdge) <= designRules.grid.lengthTolerance &&
      Math.abs(right - expectedEdge) <= designRules.grid.lengthTolerance
      ? []
      : ["equal around/between spaces"];
  }
  const coordinate = positions[0]!;
  if (
    positions.some((position) => Math.abs(position - coordinate) > designRules.grid.lengthTolerance)
  )
    return ["same named alignment anchor"];
  const baseline = guides.some((rod) => {
    const location = horizontal ? rod.a[0]! : rod.a[1]!;
    return anchor === "center"
      ? Math.abs(location - coordinate) <= designRules.grid.lengthTolerance
      : anchor === "start"
        ? horizontal
          ? location < coordinate
          : location > coordinate
        : horizontal
          ? location > coordinate
          : location < coordinate;
  });
  return baseline ? [] : ["named-side alignment baseline"];
}

/**
 * Dispatches every closed TC09 family without treating a generic box as a valid layout.
 * Dashboard/template require real multiple sections; only the template additionally needs a page frame.
 * Exact counts, positions and list distinctions remain in their dedicated feature checks.
 * @param name - Actual identity in the complete closed TC09 domain.
 * @param contours - Original layout geometry.
 * @returns Missing carrier or explicitly defined layout-feature failures.
 */
function layoutFeatures(name: string, contours: number[][][]): string[] {
  if (!semanticDomains.TC09!.includes(name))
    throw new Error("Unknown closed layout identity: " + name);
  if (name.startsWith("align-")) return alignmentFeatures(name, contours);
  if (/^(?:panel-|layout-panel-)/u.test(name)) return panelFeatures(name, contours);
  if (/^list(?:-|$)/u.test(name) || name === "layout-list" || name === "table-of-contents")
    return listFeatures(name, contours);
  if (/^table(?:-|$)/u.test(name)) return tableFeatures(name, contours);
  if (name === "layout-dashboard" || name === "layout-template") {
    const regions = layoutRegions(contours);
    if (regions.length < 2) return ["multiple real layout sections"];
    const frame = contours
      .map(carrierGeometry)
      .some(
        (box) =>
          box.width >= 500 &&
          box.height >= 500 &&
          box.horizontal.length >= 2 &&
          box.vertical.length >= 2 &&
          regions.every(
            (region) =>
              region.x0 > box.x0 && region.x1 < box.x1 && region.y0 > box.y0 && region.y1 < box.y1,
          ),
      );
    return name === "layout-template" && !frame ? ["template page frame"] : [];
  }
  return gridLayoutFeatures(name, contours);
}

/**
 * Fits a true circular arc's center from separated boundary samples, not from its partial bounds.
 * Straight lines, closed rings and faceted polygons do not become loaders by point duplication.
 * @param contour - One actual closed annular sector polygon.
 * @returns Arc center, radius and nonzero angular sweep, or null when no true open arc exists.
 */
function openCircularArc(contour: number[][]): {
  center: number[];
  radius: number;
  sweep: number;
  start: number[];
  end: number[];
} | null {
  if (contour.length < 20) return null;
  const unique = contour.slice(0, -1),
    total = unique.length,
    stride = Math.max(1, Math.floor(total / 64)),
    spacing = Math.max(4, Math.floor(total / 20));
  const runs: {
    center: number[];
    radius: number;
    sweep: number;
    start: number[];
    end: number[];
  }[] = [];
  for (let start = 0; start < total; start += stride) {
    const a = unique[start]!,
      b = unique[(start + spacing) % total]!,
      c = unique[(start + spacing * 2) % total]!;
    const determinant =
      2 * (a[0]! * (b[1]! - c[1]!) + b[0]! * (c[1]! - a[1]!) + c[0]! * (a[1]! - b[1]!));
    if (Math.abs(determinant) < 1e-9) continue;
    const aa = a[0]! ** 2 + a[1]! ** 2,
      bb = b[0]! ** 2 + b[1]! ** 2,
      cc = c[0]! ** 2 + c[1]! ** 2;
    const center = [
      (aa * (b[1]! - c[1]!) + bb * (c[1]! - a[1]!) + cc * (a[1]! - b[1]!)) / determinant,
      (aa * (c[0]! - b[0]!) + bb * (a[0]! - c[0]!) + cc * (b[0]! - a[0]!)) / determinant,
    ];
    const radius = Math.hypot(a[0]! - center[0]!, a[1]! - center[1]!);
    if (radius < 80 || radius > 430) continue;
    let sweep = 0;
    let end = a;
    for (let step = 1; step <= total; step++) {
      const previous = unique[(start + step - 1) % total]!,
        point = unique[(start + step) % total]!;
      if (
        Math.abs(Math.hypot(point[0]! - center[0]!, point[1]! - center[1]!) - radius) >
          designRules.visual.circleApproximationError ||
        radius - geometryTools.distanceToSegment(center, previous, point) >
          designRules.visual.circleApproximationError
      )
        break;
      const ax = previous[0]! - center[0]!,
        ay = previous[1]! - center[1]!,
        bx = point[0]! - center[0]!,
        by = point[1]! - center[1]!;
      sweep += Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
      end = point;
    }
    const degrees = Math.abs((sweep * 180) / Math.PI);
    if (degrees >= 45 && degrees < 350) runs.push({ center, radius, sweep, start: a, end });
  }
  for (const outer of [...runs].sort((a, b) => Math.abs(b.sweep) - Math.abs(a.sweep)))
    if (
      outer.radius >= 150 &&
      runs.some(
        (inner) =>
          outer.radius > inner.radius + 15 &&
          outer.radius - inner.radius <= designRules.visual.strokeWidths.compact.target * 2 &&
          outer.sweep * inner.sweep < 0 &&
          Math.hypot(outer.center[0]! - inner.center[0]!, outer.center[1]! - inner.center[1]!) <=
            designRules.visual.circleApproximationError,
      )
    )
      return outer;
  return null;
}

/**
 * Recovers visible two-arm arrowheads from genuine stroke junctions, including merged contours.
 * A crossing, a straight bar or an isolated triangle is not assigned a turn direction by its box.
 * @param contours - Original complete geometry.
 * @returns Distinct head tips and their normalized forward bisectors.
 */
function strokeArrowheads(contours: number[][][]): { tip: number[]; direction: number[] }[] {
  const rods = symbolRods(contours),
    heads: { tip: number[]; direction: number[] }[] = [];
  for (const [index, first] of rods.entries())
    for (const second of rods.slice(index + 1)) {
      for (const a of [first.a, first.b])
        for (const b of [second.a, second.b]) {
          if (Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!) > Math.max(first.width, second.width))
            continue;
          const tip = [(a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2];
          const ends = [a === first.a ? first.b : first.a, b === second.a ? second.b : second.a];
          const vectors = ends.map((end) => {
            const length = Math.hypot(end[0]! - tip[0]!, end[1]! - tip[1]!);
            return [(end[0]! - tip[0]!) / length, (end[1]! - tip[1]!) / length];
          });
          const dot = vectors[0]![0]! * vectors[1]![0]! + vectors[0]![1]! * vectors[1]![1]!;
          if (dot < -0.5 || dot > 0.8 || !sourceInk(contours, tip[0]!, tip[1]!)) continue;
          const dx = -vectors[0]![0]! - vectors[1]![0]!,
            dy = -vectors[0]![1]! - vectors[1]![1]!,
            length = Math.hypot(dx, dy);
          const direction = [dx / length, dy / length];
          if (
            !heads.some(
              (head) =>
                Math.hypot(head.tip[0]! - tip[0]!, head.tip[1]! - tip[1]!) <=
                  designRules.grid.lengthTolerance &&
                head.direction[0]! * direction[0]! + head.direction[1]! * direction[1]! > 0.99,
            )
          )
            heads.push({ tip, direction });
        }
    }
  return heads;
}

/**
 * Checks actual annular paths and head tangents in unchanged y-up font coordinates.
 * Clockwise has a negative radial cross product; reversing contour winding changes no semantics.
 * @param name - Closed refresh/rotate identity except the separate three-dimensional subject.
 * @param contours - Original curved strokes and arrowheads.
 * @returns Missing path, direction, opposite-position or embedded-subject failures.
 */
function rotationFeatures(name: string, contours: number[][][]): string[] {
  const clockwise = /(?:^|-)cw(?:-|$)/u.test(name),
    refresh = name.startsWith("refresh-");
  const arcs = contours.flatMap((part) => {
    const arc = openCircularArc(part);
    return arc ? [{ part, arc }] : [];
  });
  const heads = strokeArrowheads(contours);
  const turns = arcs.flatMap(({ arc }) => {
    const matching = heads.filter((head) => {
      const radial = [head.tip[0]! - arc.center[0]!, head.tip[1]! - arc.center[1]!];
      const radius = Math.hypot(...radial);
      const nearEnd =
        Math.min(
          ...[arc.start, arc.end].map((point) =>
            Math.hypot(point[0]! - head.tip[0]!, point[1]! - head.tip[1]!),
          ),
        ) <= 150;
      const cross = (radial[0]! * head.direction[1]! - radial[1]! * head.direction[0]!) / radius;
      const tangent =
        Math.abs((radial[0]! * head.direction[0]! + radial[1]! * head.direction[1]!) / radius) <=
        0.35;
      return (
        nearEnd &&
        Math.abs(radius - arc.radius) <= 120 &&
        tangent &&
        (clockwise ? cross < -0.8 : cross > 0.8)
      );
    });
    return matching.map((head) => ({ arc, head }));
  });
  const failures: string[] = [];
  if (refresh) {
    const opposite = turns.some((a, index) =>
      turns.slice(index + 1).some((b) => {
        if (
          a.arc === b.arc ||
          a.head === b.head ||
          Math.hypot(a.arc.center[0]! - b.arc.center[0]!, a.arc.center[1]! - b.arc.center[1]!) >
            designRules.visual.circleApproximationError
        )
          return false;
        const ax = a.head.tip[0]! - a.arc.center[0]!,
          ay = a.head.tip[1]! - a.arc.center[1]!,
          bx = b.head.tip[0]! - b.arc.center[0]!,
          by = b.head.tip[1]! - b.arc.center[1]!;
        return (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by)) < -0.8;
      }),
    );
    if (!opposite)
      failures.push(
        "two opposite-position " +
          (clockwise ? "clockwise" : "counterclockwise") +
          " refresh paths",
      );
  } else if (!turns.length)
    failures.push("single " + (clockwise ? "clockwise" : "counterclockwise") + " rotation path");
  if (name.endsWith("-dot") && !diceDotCenters(contours).length) failures.push("rotation dot");
  if (name.includes("clock")) failures.push(...clockFeatures(name, contours));
  if (name.endsWith("-key")) failures.push(...keyFeatures(contours));
  if (
    name.endsWith("-square") &&
    !contours.some((part) => {
      const box = carrierGeometry(part);
      return (
        box.width >= 100 &&
        box.height >= 100 &&
        box.width <= 450 &&
        box.height <= 450 &&
        box.horizontal.length >= 2 &&
        box.vertical.length >= 2
      );
    })
  )
    failures.push("rotated square subject");
  return failures;
}

/**
 * Checks a key's open bow together with a connected shaft and projecting tooth.
 * A ring alone, a solid bow or a plain stick cannot substitute for the embedded key subject.
 * @param contours - Actual key/carrier polygons.
 * @returns Missing bow hole, shaft or tooth failures.
 */
function keyFeatures(contours: number[][][]): string[] {
  const bows = gitNodes(contours),
    rods = symbolRods(contours);
  const valid = bows.some((bow) =>
    rods.some((shaft) => {
      const length = Math.hypot(shaft.b[0]! - shaft.a[0]!, shaft.b[1]! - shaft.a[1]!);
      if (
        length < 150 ||
        geometryTools.distanceToSegment([bow.cx, bow.cy], shaft.a, shaft.b) >
          Math.max(bow.width, bow.height) / 2 + shaft.width
      )
        return false;
      return rods.some((tooth) => {
        const dx = tooth.b[0]! - tooth.a[0]!,
          dy = tooth.b[1]! - tooth.a[1]!,
          sx = shaft.b[0]! - shaft.a[0]!,
          sy = shaft.b[1]! - shaft.a[1]!;
        return (
          Math.abs(dx * sy - dy * sx) / (Math.hypot(dx, dy) * length) > 0.8 &&
          [tooth.a, tooth.b].some(
            (point) =>
              geometryTools.distanceToSegment(point, shaft.a, shaft.b) <=
              Math.max(tooth.width, shaft.width) / 2,
          ) &&
          Math.hypot(
            (tooth.a[0]! + tooth.b[0]!) / 2 - bow.cx,
            (tooth.a[1]! + tooth.b[1]!) / 2 - bow.cy,
          ) > bow.width
        );
      });
    }),
  );
  return valid ? [] : ["key bow hole, connected shaft and tooth"];
}

/**
 * Checks a returning/advancing bent path, rather than relabeling a circular rotation arrow.
 * The terminal head direction and the joined path extending behind and below it are both required.
 * @param name - Closed undo/redo identity.
 * @param contours - Original path and marker contours.
 * @returns Missing horizontal head, connected return bend or terminal-dot failures.
 */
function returnPathFeatures(name: string, contours: number[][][]): string[] {
  const left = name.startsWith("undo-"),
    heads = strokeArrowheads(contours).filter((head) =>
      left ? head.direction[0]! < -0.9 : head.direction[0]! > 0.9,
    );
  const failures: string[] = [];
  const connected = heads.some((head) => {
    const start = [head.tip[0]! + (left ? 90 : -90), head.tip[1]!];
    const direction = left ? 1 : -1;
    const arm = lineCapacity(contours, start, [start[0]! + direction * 180, start[1]!]);
    if (arm < 1 - 1e-9) return false;
    const candidates = contours.filter((part) => {
      if (!sourceInk([part], start[0]!, start[1]!) || circularContour(part, 80, 430)) return false;
      if (!openCircularArc(part)) return true;
      /**
       * A local circular bend is legitimate only when the same contour contains
       * both boundaries of a long horizontal return arm; an isolated rotation
       * arc has no such arm and remains rejected.
       */
      const sides = carrierGeometry(part).horizontal.filter(
        ([a, b]) => Math.abs(b![0]! - a![0]!) >= 180,
      );
      return sides.some(([a, b], index) =>
        sides.slice(index + 1).some(([c, d]) => {
          const low = Math.max(Math.min(a![0]!, b![0]!), Math.min(c![0]!, d![0]!)),
            high = Math.min(Math.max(a![0]!, b![0]!), Math.max(c![0]!, d![0]!)),
            bottom = Math.min(a![1]!, c![1]!),
            top = Math.max(a![1]!, c![1]!);
          return (
            high - low >= 180 &&
            top - bottom > designRules.grid.lengthTolerance &&
            start[1]! > bottom &&
            start[1]! < top &&
            Math.min(start[0]!, start[0]! + direction * 180) >= low &&
            Math.max(start[0]!, start[0]! + direction * 180) <= high
          );
        }),
      );
    });
    if (!candidates.length) return false;
    const box = carrierGeometry(candidates.flat());
    return (
      box.height >= 180 &&
      (left ? box.x1 - head.tip[0]! : head.tip[0]! - box.x0) >= 300 &&
      [0.25, 0.5, 0.75].some((t) =>
        sourceInk(contours, left ? box.x1 - 35 : box.x0 + 35, box.y0 + box.height * t),
      )
    );
  });
  if (!heads.length) failures.push(left ? "returning left arrowhead" : "advancing right arrowhead");
  if (!connected) failures.push("connected noncircular return bend");
  if (name.endsWith("-dot") && !diceDotCenters(contours).length) failures.push("return-path dot");
  return failures;
}

/**
 * Checks three distinct projected axes and an open curved arrow for the 3D rotation subject.
 * Both coordinate-axis and wireframe-volume drawings are legitimate; a planar two-axis cross is not.
 * @param contours - Actual spatial subject and surrounding rotation path.
 * @returns Missing projected depth, open curve or attached arrowhead failures.
 */
function spatialRotationFeatures(contours: number[][][]): string[] {
  const rods = symbolRods(contours),
    failures: string[] = [];
  const spatial = rods.some((first) =>
    [first.a, first.b].some((joint) => {
      const axes = rods.flatMap((rod) => {
        const nearA = Math.hypot(rod.a[0]! - joint[0]!, rod.a[1]! - joint[1]!) <= rod.width,
          nearB = Math.hypot(rod.b[0]! - joint[0]!, rod.b[1]! - joint[1]!) <= rod.width;
        if (!nearA && !nearB) return [];
        const end = nearA ? rod.b : rod.a,
          length = Math.hypot(end[0]! - joint[0]!, end[1]! - joint[1]!);
        return length >= 140
          ? [[(end[0]! - joint[0]!) / length, (end[1]! - joint[1]!) / length]]
          : [];
      });
      return axes.some((a, index) =>
        axes
          .slice(index + 1)
          .some((b, second) =>
            axes
              .slice(index + second + 2)
              .some((c) =>
                [
                  Math.abs(a[0]! * b[1]! - a[1]! * b[0]!),
                  Math.abs(a[0]! * c[1]! - a[1]! * c[0]!),
                  Math.abs(b[0]! * c[1]! - b[1]! * c[0]!),
                ].every((cross) => cross > 0.35),
              ),
          ),
      );
    }),
  );
  if (!spatial) failures.push("three distinct projected spatial axes");
  const curved = contours.filter((part) => {
    const box = carrierGeometry(part),
      area = Math.abs(polygonArea(part));
    return (
      part.length >= 20 &&
      box.width >= 300 &&
      box.height >= 40 &&
      area / (box.width * box.height) < 0.6 &&
      visibleStateEdge([part], contours)
    );
  });
  if (!curved.length) failures.push("open spatial rotation curve");
  const attached = strokeArrowheads(contours).some((head) =>
    curved.some((part) =>
      part.some((point) => Math.hypot(point[0]! - head.tip[0]!, point[1]! - head.tip[1]!) <= 100),
    ),
  );
  if (!attached) failures.push("spatial rotation terminal arrowhead");
  return failures;
}

/**
 * Routes every closed TC13 identity to its actual subject/path implementation.
 * Unsupported identities fail explicitly rather than receiving an empty default result.
 * @param name - Exact TC13 identity.
 * @param contours - Actual complete source geometry.
 * @returns Missing subject/path features, with state features checked separately by the semantic dispatcher.
 */
function connectionFeatures(name: string, contours: number[][][]): string[] {
  if (!semanticDomains.TC13!.includes(name))
    throw new Error("Unknown closed connection identity: " + name);
  if (name.startsWith("git-")) return gitFeatures(name, contours);
  if (/^(?:undo|redo)-/u.test(name)) return returnPathFeatures(name, contours);
  if (name === "rotate-3d") return spatialRotationFeatures(contours);
  if (/^(?:rotate|refresh)-/u.test(name)) return rotationFeatures(name, contours);
  return simpleConnectionFeatures(name, contours);
}

/**
 * Finds genuine open circular Git node counters with surrounding foreground on every side.
 * Filled dots, duplicate holes and a circular contour hidden by solid foreground are excluded.
 * @param contours - Actual original graph polygons.
 * @returns Distinct node regions including their real surrounding ring extent.
 */
function gitNodes(contours: number[][][]): ReturnType<typeof carrierGeometry>[] {
  const nodes: ReturnType<typeof carrierGeometry>[] = [];
  for (const part of contours) {
    if (!circularContour(part, 25, 100)) continue;
    const box = carrierGeometry(part),
      radius = box.width / 2;
    if (sourceInk(contours, box.cx, box.cy)) continue;
    if (
      ![0, Math.PI / 2, Math.PI, Math.PI * 1.5].every((angle) =>
        sourceInk(
          contours,
          box.cx + (radius + 10) * Math.cos(angle),
          box.cy + (radius + 10) * Math.sin(angle),
        ),
      )
    )
      continue;
    if (
      nodes.some(
        (node) =>
          Math.hypot(node.cx - box.cx, node.cy - box.cy) <= designRules.grid.lengthTolerance,
      )
    )
      continue;
    nodes.push(
      carrierGeometry([
        [box.x0 - 35, box.y0 - 35],
        [box.x1 + 35, box.y0 - 35],
        [box.x1 + 35, box.y1 + 35],
        [box.x0 - 35, box.y1 + 35],
        [box.x0 - 35, box.y0 - 35],
      ]),
    );
  }
  return nodes;
}

/**
 * Finds real three-way foreground junctions outside node holes, not isolated symbols or right-angle bends.
 * Candidate line intersections are checked for three local foreground arms, before a
 * distant node ring can split an otherwise continuous arm into extra radial runs.
 * @param contours - Complete graph geometry.
 * @returns Actual fork/merge junction locations.
 */
function gitJunctions(contours: number[][][]): number[][] {
  const rods = symbolRods(contours),
    junctions: number[][] = [];
  for (const [index, a] of rods.entries())
    for (const b of rods.slice(index + 1)) {
      const ax = a.b[0]! - a.a[0]!,
        ay = a.b[1]! - a.a[1]!,
        bx = b.b[0]! - b.a[0]!,
        by = b.b[1]! - b.a[1]!,
        determinant = ax * by - ay * bx;
      if (Math.abs(determinant) < 1e-9) continue;
      const dx = b.a[0]! - a.a[0]!,
        dy = b.a[1]! - a.a[1]!,
        t = (dx * by - dy * bx) / determinant;
      const point = [a.a[0]! + ax * t, a.a[1]! + ay * t];
      if (
        geometryTools.distanceToSegment(point, a.a, a.b) > a.width / 2 ||
        geometryTools.distanceToSegment(point, b.a, b.b) > b.width / 2 ||
        !sourceInk(contours, point[0]!, point[1]!)
      )
        continue;
      const radius = Math.max(a.width, b.width);
      const coverage = Array.from({ length: 360 }, (_, degree) =>
        sourceInk(
          contours,
          point[0]! + radius * Math.cos((degree * Math.PI) / 180),
          point[1]! + radius * Math.sin((degree * Math.PI) / 180),
        ),
      );
      const runs = coverage.filter(
        (present, degree) => present && !coverage[(degree + 359) % 360],
      ).length;
      if (
        runs === 3 &&
        !junctions.some(
          (other) =>
            Math.hypot(point[0]! - other[0]!, point[1]! - other[1]!) <=
            designRules.grid.lengthTolerance,
        )
      )
        junctions.push(point);
    }
  return junctions;
}

/**
 * Checks Git nodes together with actual route connectivity, forks and named commit axes.
 * Compare and pull-request retain two routes; their arrow variants need real terminal heads.
 * @param name - Exact closed TC13 Git identity.
 * @param contours - Original graph and state geometry.
 * @returns Missing node hole, route, connection, junction or named-axis failures.
 */
function gitFeatures(name: string, contours: number[][][]): string[] {
  const nodes = gitNodes(contours),
    rods = symbolRods(contours),
    failures: string[] = [];
  if (!nodes.length) return ["open Git node holes"];
  if (/^git-commit-/u.test(name)) {
    const horizontal = name.endsWith("horizontal");
    const commit = nodes.some(
      (node) =>
        rods.some((rod) => {
          const centered = horizontal
            ? Math.abs(rod.a[1]! - node.cy) <= designRules.grid.lengthTolerance
            : Math.abs(rod.a[0]! - node.cx) <= designRules.grid.lengthTolerance;
          const across = horizontal
            ? rod.a[0]! < node.x0 && rod.b[0]! > node.x1
            : rod.a[1]! < node.y0 && rod.b[1]! > node.y1;
          return centered && across;
        }) ||
        [false, true].every((forward) =>
          rods.some((rod) => {
            const centered = horizontal
              ? Math.abs(rod.a[1]! - node.cy) <= designRules.grid.lengthTolerance &&
                Math.abs(rod.b[1]! - node.cy) <= designRules.grid.lengthTolerance
              : Math.abs(rod.a[0]! - node.cx) <= designRules.grid.lengthTolerance &&
                Math.abs(rod.b[0]! - node.cx) <= designRules.grid.lengthTolerance;
            const end = horizontal
              ? forward
                ? rod.a[0]!
                : rod.b[0]!
              : forward
                ? rod.a[1]!
                : rod.b[1]!;
            const boundary = horizontal
              ? forward
                ? node.x1
                : node.x0
              : forward
                ? node.y1
                : node.y0;
            return centered && Math.abs(end - boundary) <= Math.max(rod.width, 35);
          }),
        ),
    );
    return commit
      ? []
      : ["Git commit node with two " + (horizontal ? "horizontal" : "vertical") + " line arms"];
  }
  const connections = new Map<string, boolean>();
  let components: ReturnType<typeof foregroundComponents> | undefined;
  const nodeComponents = new Map<number, Set<number>>();
  const connected = (first: number, second: number): boolean => {
    const key = [first, second].sort((a, b) => a - b).join("/");
    if (!connections.has(key)) {
      components ??= foregroundComponents(contours);
      for (const index of [first, second])
        if (!nodeComponents.has(index)) nodeComponents.set(index, components(nodes[index]!));
      connections.set(
        key,
        [...nodeComponents.get(first)!].some((label) => nodeComponents.get(second)!.has(label)),
      );
    }
    return connections.get(key)!;
  };
  if (
    nodes.length < 2 ||
    !nodes.every((_node, index) =>
      nodes.some((_other, other) => index !== other && connected(index, other)),
    )
  )
    failures.push("Git nodes joined by real routes");
  if (/^git-(?:branch|fork|merge)(?:-|$)/u.test(name)) {
    if (
      nodes.length < 3 ||
      !gitJunctions(contours).length ||
      !nodes.every((_node, index) => connected(0, index))
    )
      failures.push("connected three-node Git fork/merge");
  }
  if (/^git-(?:compare|pull-request)(?:-|$)/u.test(name)) {
    const vertical = rods.filter(
      (rod) =>
        Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance &&
        rod.b[1]! - rod.a[1]! >= 180,
    );
    if (
      !vertical.some((a, index) =>
        vertical.slice(index + 1).some((b) => Math.abs(a.a[0]! - b.a[0]!) >= 160),
      )
    )
      failures.push("two separate Git routes");
  }
  const heads = strokeArrowheads(contours);
  if (
    name.includes("pull-request") &&
    !heads.some((head) => {
      const routes = rods.filter(
        (rod) =>
          Math.abs(rod.b[0]! - rod.a[0]!) <= designRules.grid.lengthTolerance &&
          rod.b[1]! - rod.a[1]! >= 180,
      );
      return (
        Math.abs(head.direction[0]!) > 0.9 &&
        routes.some(
          (route) =>
            Math.abs(route.a[0]! - head.tip[0]!) <= route.width &&
            head.tip[1]! >= route.a[1]! &&
            head.tip[1]! <= route.b[1]! &&
            routes.some((other) => (other.a[0]! - head.tip[0]!) * head.direction[0]! < -160),
        )
      );
    })
  )
    failures.push("Git pull-request merge arrow");
  if (name === "git-compare-arrows" && heads.length < 2) failures.push("two Git compare arrows");
  return failures;
}

/**
 * Checks the TC13 loader, copy and two-link subjects independently of rotating-arrow variants.
 * Arrow/Git families have separate checks and never enter this restricted helper.
 * @param name - Exact closed loader/copy/link identity.
 * @param contours - Actual flattened source geometry.
 * @returns Missing open arc, overlap, loop or necessary-hole features.
 */
function simpleConnectionFeatures(name: string, contours: number[][][]): string[] {
  if (name === "loader" || name === "loading")
    return contours.some((part) => openCircularArc(part)) ? [] : ["open circular loading arc"];
  if (name === "loader-pinwheel") {
    const blades = contours.filter((part) => {
      const box = carrierGeometry(part);
      return (
        box.width >= 150 &&
        box.height >= 150 &&
        !circularContour(part, 25, 430) &&
        Math.abs(polygonArea(part)) >= 5000 &&
        part.some(
          ([x, y]) =>
            Math.hypot(x! - 480, y! - 320) <= designRules.visual.strokeWidths.compact.target,
        )
      );
    });
    const positions = blades
      .map(carrierGeometry)
      .filter(
        (box, index, all) =>
          !all
            .slice(0, index)
            .some(
              (other) =>
                Math.hypot(box.cx - other.cx, box.cy - other.cy) <=
                designRules.grid.lengthTolerance,
            ),
      );
    return blades.length >= 2 && positions.length >= 2 ? [] : ["separate radial pinwheel blades"];
  }
  if (/^copy(?:-|$)/u.test(name)) {
    const exterior = contours.map(polygonArea).sort((a, b) => Math.abs(b) - Math.abs(a))[0] ?? 0;
    const objects = contours
      .map((part, index) => ({ box: carrierGeometry(part), index }))
      .filter(
        ({ box, index }) =>
          polygonArea(contours[index]!) * exterior > 0 &&
          box.width >= 400 &&
          box.height >= 400 &&
          box.horizontal.length >= 2 &&
          box.vertical.length >= 2,
      )
      .map(({ box }) => box);
    const distinct = objects.some((a, index) =>
      objects
        .slice(index + 1)
        .some(
          (b) =>
            Math.hypot(a.cx - b.cx, a.cy - b.cy) >= 80 &&
            Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) &&
            Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0),
        ),
    );
    return distinct ? [] : ["two overlapping copy objects"];
  }
  if (/^link(?:-|$)/u.test(name)) {
    const exterior = contours.map(polygonArea).sort((a, b) => Math.abs(b) - Math.abs(a))[0] ?? 0;
    const holes = contours
      .map((part) => ({ part, box: carrierGeometry(part) }))
      .filter(
        ({ part, box }) =>
          polygonArea(part) * exterior < 0 &&
          box.width >= 100 &&
          box.height >= 60 &&
          box.width <= 400 &&
          box.height <= 400 &&
          !sourceInk(contours, box.cx, box.cy) &&
          visibleStateEdge([part], contours),
      );
    const distinct = holes.filter(
      ({ box }, index) =>
        !holes
          .slice(0, index)
          .some(
            ({ box: other }) =>
              Math.hypot(box.cx - other.cx, box.cy - other.cy) <= designRules.grid.lengthTolerance,
          ),
    );
    if (distinct.length < 2) return ["two open chain-link holes"];
    if (
      name.includes("horizontal") &&
      distinct.some(
        ({ box }) => Math.abs(box.cy - distinct[0]!.box.cy) > designRules.grid.lengthTolerance,
      )
    )
      return ["horizontal chain-link axis"];
    const closed = distinct.filter(({ box }) => {
      const probes = [
        [box.cx, box.y1 + 20],
        [box.cx, box.y0 - 20],
        [box.x0 - 20, box.cy],
        [box.x1 + 20, box.cy],
      ];
      return probes.every(([x, y]) => sourceInk(contours, x!, y!));
    });
    return closed.length >= 2 ? [] : ["two enclosing chain-link loops"];
  }
  throw new Error("Unsupported simple connection identity: " + name);
}

/**
 * Applies exact prescribed family features; a differing hash never proves a shape's meaning.
 * @param name - Canonical semantic name.
 * @param contours - Actual source polygons.
 * @returns Explicit missing-feature failures.
 */
function semanticFeatures(name: string, contours: number[][][]): string[] {
  const failures: string[] = [];
  if (directionNames.has(name)) failures.push(...directionalFeatures(name, contours));
  if (endpointNames.has(name)) failures.push(...endpointFeatures(name, contours));
  if (semanticDomains.TC03!.includes(name)) failures.push(...extraFrameFeatures(name, contours));
  if (name === "command") failures.push(...commandFeatures(contours));
  if (name === "bolt") failures.push(...boltFeatures(contours));
  if (semanticDomains.TC05!.includes(name) || semanticDomains.TC04!.includes(name))
    failures.push(...documentFeatures(name, contours));
  if (semanticDomains.TC05!.includes(name))
    failures.push(...documentDetailFeatures(name, contours));
  if (semanticDomains.TC08!.includes(name)) {
    if (name.startsWith("calendar")) failures.push(...calendarFeatures(name, contours));
    else failures.push(...clockFeatures(name, contours));
  }
  if (semanticDomains.TC12!.includes(name)) failures.push(...strengthFeatures(name, contours));
  if (semanticDomains.TC10!.includes(name)) failures.push(...chartFeatures(name, contours));
  if (semanticDomains.TC09!.includes(name)) failures.push(...layoutFeatures(name, contours));
  if (semanticDomains.TC13!.includes(name)) failures.push(...connectionFeatures(name, contours));
  if (
    name.split("-").includes("clock") &&
    !semanticDomains.TC08!.includes(name) &&
    !semanticDomains.TC13!.includes(name)
  )
    failures.push(...clockFeatures(name, contours));
  if (
    semanticDomains.TC06!.includes(name) ||
    (semanticDomains.TC04!.includes(name) && /^(?:message|phone)/u.test(name))
  )
    failures.push(...communicationFeatures(name, contours));
  if (semanticDomains.TC06!.includes(name))
    failures.push(...communicationDetailFeatures(name, contours));
  if (activeSemanticNames.has(name)) failures.push(...basicStateFeatures(name, contours));
  if (/^shield(?:-|$)/u.test(name)) {
    const exterior = contours.some((contour) => {
      const xs = contour.map((point) => point[0]!),
        ys = contour.map((point) => point[1]!);
      const x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys);
      const width = x1 - x0,
        height = y1 - y0,
        center = (x0 + x1) / 2;
      if (width < 560 || height < 650) return false;
      const upper = contour.filter((point) => point[1]! >= y1 - height * 0.15);
      const lower = contour.filter((point) => point[1]! <= y0 + height * 0.08);
      return (
        upper.length >= 2 &&
        lower.length > 0 &&
        Math.max(...upper.map((point) => point[0]!)) -
          Math.min(...upper.map((point) => point[0]!)) >=
          width * 0.7 &&
        lower.every((point) => Math.abs(point[0]! - center) <= width * 0.15)
      );
    });
    if (!exterior) failures.push("shield shoulders and tapered bottom");
    if (name === "shield-half" && (!sourceInk(contours, 410, 320) || sourceInk(contours, 550, 320)))
      failures.push("left filled and right hollow shield");
  }
  if (
    /^(?:circle(?:-|$)|clock-hour-\d+$|dice-[1-6]$)/u.test(name) &&
    !["circle-check-big", "circle-off", "circle-dashed", "circle-dot-dashed"].includes(name) &&
    !name.startsWith("dice-") &&
    !contours.some((contour) => circularContour(contour, name === "circle-small" ? 80 : 260, 430))
  )
    failures.push("circular frame");
  if (/^square(?:-|$)/u.test(name) && !squareFrame(contours)) failures.push("square container");
  const dice = /^dice-([1-6])$/u.exec(name);
  if (dice && diceDotCenters(contours).length !== Number(dice[1]))
    failures.push("exact dice dot count");
  if (/^tally-[1-5]$/u.test(name)) failures.push(...tallyFeatures(name, contours));
  if (name === "star" || name === "star-half") {
    const exterior = contours.some((contour) => radialLobes(contour) === 5);
    if (!exterior) failures.push("five-point star exterior");
    if (name === "star-half" && (!sourceInk(contours, 410, 320) || sourceInk(contours, 550, 320)))
      failures.push("left filled and right hollow star");
  }
  return failures;
}

/**
 * Captures fixture bytes in memory to prove read-only execution.
 * @param {string} root Isolated fixture directory.
 * @returns {Promise<Record<string,string>>} Complete relative path/byte map.
 */
async function snapshot(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  /**
   * Visits fixture files without writing an execution record.
   * @param path - Relative directory within the fixture.
   * @returns Completion of the in-memory traversal.
   */
  async function walk(path: string): Promise<void> {
    for (const entry of await readdir(resolve(root, path), {
      withFileTypes: true,
    })) {
      const child = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await walk(child);
      else result[child] = (await readFile(resolve(root, child))).toString("base64");
    }
  }
  await walk("");
  return result;
}

describe("read-only refinement tools", () => {
  it("compares actual full contours without deduplicating or modifying sources", () => {
    const contour = {
      points: [
        { x: 0, y: 0, type: "line" },
        { x: 10, y: 0, type: "line" },
        { x: 10, y: 10, type: "line" },
      ],
    };
    const entries = [
      { name: "alpha", master: "outline-standard", contours: [contour] },
      { name: "beta", master: "outline-standard", contours: [contour] },
      { name: "gamma", master: "filled-standard", contours: [contour] },
    ];
    const before = structuredClone(entries);
    expect(audit.sharedGeometryGroups(entries)).toEqual([
      { master: "outline-standard", names: ["alpha", "beta"] },
    ]);
    expect(entries).toEqual(before);
  });
  it("recovers every exact coverage byte without changing its input", () => {
    const data = Buffer.from(Array.from({ length: 256 }, (_, i) => [i, i, i, 255]).flat());
    const original = Buffer.from(data);
    const result = visual.coverageRaster({ width: 256, height: 1, data });
    for (let i = 0; i < 256; i++) {
      expect(Array.from(result.data.subarray(i * 4, i * 4 + 4))).toEqual([0, 0, 0, 255 - i]);
    }
    expect(data).toEqual(original);
    expect(() =>
      visual.coverageRaster({
        width: 1,
        height: 1,
        data: Buffer.from([128, 127, 128, 255]),
      }),
    ).toThrow(/grayscale/);
    expect(() =>
      visual.coverageRaster({
        width: 1,
        height: 1,
        data: Buffer.from([128, 128, 128, 254]),
      }),
    ).toThrow(/opaque/);
    expect(() =>
      visual.coverageRaster({
        width: 0,
        height: 1,
        data: Buffer.alloc(0),
      }),
    ).toThrow(/dimensions/);
    expect(() =>
      visual.coverageRaster({
        width: 1,
        height: 1,
        data: Buffer.alloc(3),
      }),
    ).toThrow(/dimensions/);
  });
  it("scans actual six-master sources without creating records or changing any bytes", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "miaixz-scan-test-"));
    try {
      const paths = await fixture.createIconFixture({
        directory,
        categories: [{ id: "actions", description: "Actions; excludes navigation" }],
        records: [
          {
            name: "alpha",
            codepoint: 0xf0000,
            category: "actions",
            opticalClass: "regular",
            rtl: "none",
          },
        ],
        design: structuredClone(fixture.fixtureDesign),
      });
      const before = await snapshot(paths.assetsRoot);
      const result = await audit.scanIconRefinement(paths);
      expect(result.glyphs).toHaveLength(6);
      expect(
        result.glyphs.every((glyph: { candidates: unknown[] }) => !glyph.candidates.length),
      ).toBe(true);
      expect(await snapshot(paths.assetsRoot)).toEqual(before);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("rejects every retired record-writing or baseline mode", () => {
    expect(audit.parseArguments(["--mode", "scan"])).toEqual({ mode: "scan" });
    for (const mode of ["initialize", "validate", "write"])
      expect(() => audit.parseArguments(["--mode", mode])).toThrow();
    expect(comparison.parseArguments(["--mode", "validate"])).toEqual({
      mode: "validate",
    });
    for (const mode of ["update", "compare", "begin", "package", "complete"])
      expect(() => comparison.parseArguments(["--mode", mode])).toThrow();
  });
});

/**
 * Enumerates actual fixture states from the same fixed dimensions, independently of the validator.
 * @param icons - Fixture names and explicit mirror flags.
 * @returns Complete fixture state set.
 */
function visualStates(icons: { name: string; rtl: string }[]) {
  return icons.flatMap((icon) =>
    [12, 16, 20, 24, 32, 40].flatMap((opticalSize) =>
      [0, 0.25, 0.5, 0.75, 1].flatMap((fill) =>
        ["chromium", "firefox", "webkit"].flatMap((browser) =>
          [1, 2].flatMap((dpr) =>
            (icon.rtl === "mirror" ? ["ltr", "rtl"] : ["ltr"]).map((direction) => ({
              name: icon.name,
              opticalSize,
              fill,
              browser,
              dpr,
              direction,
            })),
          ),
        ),
      ),
    ),
  );
}
/**
 * Constructs independent native RGBA pixels for raster-rule unit tests.
 * @param hole - Whether to remove an intentional interior area.
 * @returns Real pixels with transparent outside padding.
 */
function raster(hole = false) {
  const data = Buffer.alloc(20 * 20 * 4);
  for (let y = 5; y < 15; y++)
    for (let x = 5; x < 15; x++)
      if (!hole || x < 8 || x > 11 || y < 8 || y > 11) data[(y * 20 + x) * 4 + 3] = 255;
  return { width: 20, height: 20, data };
}
describe("fixed independent visual quality", () => {
  it("requires current source/font digests and every unique geometry state before coverage", () => {
    const evidence = {
      status: "passed",
      fontSha256: "current-font",
      sourceSha256: "current-source",
      glyphs: [
        {
          name: "native-fixture",
          status: "passed",
          states: [12, 16, 20, 24, 32, 40].flatMap((opticalSize) =>
            [0, 0.25, 0.5, 0.75, 1].map((fill) => ({
              opticalSize,
              fill,
              status: "passed",
              outlineMoments: { areaRelativeError: 0, centroidDistancePixels: 0 },
            })),
          ),
        },
      ],
    };
    const check = (current: typeof evidence | null) =>
      visual.validateGeometryEvidence({
        evidence: current,
        icons: [{ name: "native-fixture" }],
        fontSha256: "current-font",
        sourceDigest: "current-source",
      });
    expect(() => check(evidence)).not.toThrow();
    expect(() => check(null)).toThrow();
    for (const change of [
      (copy: typeof evidence) => {
        copy.fontSha256 = "other-font";
      },
      (copy: typeof evidence) => {
        copy.sourceSha256 = "other-source";
      },
      (copy: typeof evidence) => {
        copy.status = "failed";
      },
      (copy: typeof evidence) => {
        copy.glyphs[0]!.name = "other-name";
      },
      (copy: typeof evidence) => {
        copy.glyphs[0]!.states.pop();
      },
      (copy: typeof evidence) => {
        copy.glyphs[0]!.states[1] = structuredClone(copy.glyphs[0]!.states[0]!);
      },
      (copy: typeof evidence) => {
        copy.glyphs[0]!.states[0]!.opticalSize = 13;
      },
      (copy: typeof evidence) => {
        copy.glyphs[0]!.states[0]!.outlineMoments.areaRelativeError = NaN;
      },
      (copy: typeof evidence) => {
        copy.glyphs[0]!.states[0]!.status = "failed";
      },
    ]) {
      const copy = structuredClone(evidence);
      change(copy);
      expect(() => check(copy)).toThrow();
    }
  });

  it("classifies antialiasing only against independent source edges and rejects missing cores", () => {
    const rules = designRules.visual.comparison;
    const contour = {
      closed: true,
      points: [
        [160, 160],
        [800, 160],
        [800, 760],
        [160, 760],
      ].map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
    };
    const reference = visual.referencePixelRegions({
      contours: [contour],
      size: 24,
      dpr: 1,
      rules,
      unitsPerEm: 960,
    });
    const source = {
        width: reference.width,
        height: reference.height,
        data: Buffer.alloc(reference.width * reference.height * 4),
      },
      font = { ...source, data: Buffer.alloc(source.data.length) };
    for (let i = 0; i < reference.data.length; i++) {
      source.data[i * 4 + 3] = reference.data[i] === 0 ? 0 : 255;
      font.data[i * 4 + 3] = reference.data[i] === 0 ? 0 : reference.data[i] === 1 ? 255 : 128;
    }
    const original = Buffer.from(font.data),
      measured = visual.compareReferenceCoverage(source, font, reference, rules);
    expect(measured.areaRelativeError).toBeGreaterThan(rules.areaRelativeError);
    expect(visual.referenceRasterFailures(measured, rules)).toEqual([]);
    expect(font.data).toEqual(original);
    const interior = Array.from(reference.data).indexOf(1),
      exterior = Array.from(reference.data).findIndex(
        (region, i) => region === 0 && i > reference.width,
      );
    const missing = { ...font, data: Buffer.from(font.data) };
    missing.data[interior * 4 + 3] = 0;
    expect(
      visual
        .referenceRasterFailures(
          visual.compareReferenceCoverage(source, missing, reference, rules),
          rules,
        )
        .map((e: { code: string }) => e.code),
    ).toContain("FONT_CORE");
    const extra = { ...font, data: Buffer.from(font.data) };
    extra.data[exterior * 4 + 3] = rules.alphaThreshold;
    expect(
      visual
        .referenceRasterFailures(
          visual.compareReferenceCoverage(source, extra, reference, rules),
          rules,
        )
        .map((e: { code: string }) => e.code),
    ).toContain("FONT_CORE");
    expect(
      visual
        .referenceRasterFailures(
          visual.compareReferenceCoverage(missing, missing, reference, rules),
          rules,
        )
        .map((e: { code: string }) => e.code),
    ).toEqual(expect.arrayContaining(["SOURCE_CORE", "FONT_CORE"]));
    expect(visual.referenceRasterFailures(null, rules)[0].code).toBe("NO_RASTER");
    expect(
      visual
        .referenceRasterFailures(measured, rules)
        .some((e: { code: string }) => e.code === "NO_REFERENCE"),
    ).toBe(false);
    expect(
      visual.referenceRasterFailures(visual.compareRasters(source, font, rules), rules)[0].code,
    ).toBe("NO_REFERENCE");
    const shifted = { ...source, data: Buffer.alloc(source.data.length) };
    for (let y = 0; y < source.height; y++)
      for (let x = 0; x + 2 < source.width; x++)
        shifted.data[(y * source.width + x + 2) * 4 + 3] =
          source.data[(y * source.width + x) * 4 + 3]!;
    expect(
      visual
        .referenceRasterFailures(
          visual.compareReferenceCoverage(source, shifted, reference, rules),
          rules,
        )
        .map((e: { code: string }) => e.code),
    ).toContain("FONT_CORE");
    const invalid = { ...reference, data: new Uint8Array(reference.data) };
    invalid.data[0] = 3;
    expect(() => visual.compareReferenceCoverage(source, font, invalid, rules)).toThrow("region");
  });

  it("rejects sealing a source hole even when both screenshots seal it", () => {
    const rules = designRules.visual.comparison,
      polygon = (coordinates: number[][]) => ({
        closed: true,
        points: coordinates.map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
      }),
      contours = [
        polygon([
          [160, 160],
          [800, 160],
          [800, 800],
          [160, 800],
        ]),
        polygon([
          [360, 360],
          [360, 600],
          [600, 600],
          [600, 360],
        ]),
      ],
      reference = visual.referencePixelRegions({
        contours,
        size: 24,
        dpr: 1,
        rules,
        unitsPerEm: 960,
      }),
      correct = {
        width: reference.width,
        height: reference.height,
        data: Buffer.alloc(reference.width * reference.height * 4),
      };
    for (let i = 0; i < reference.data.length; i++)
      correct.data[i * 4 + 3] = reference.data[i] === 1 ? 255 : 0;
    expect(
      visual.referenceRasterFailures(
        visual.compareReferenceCoverage(correct, correct, reference, rules),
        rules,
      ),
    ).toEqual([]);
    const hole = 10 * reference.width + 14;
    expect(reference.data[hole]).toBe(0);
    const sealed = { ...correct, data: Buffer.from(correct.data) };
    sealed.data[hole * 4 + 3] = 255;
    expect(
      visual
        .referenceRasterFailures(
          visual.compareReferenceCoverage(sealed, sealed, reference, rules),
          rules,
        )
        .map((e: { code: string }) => e.code),
    ).toEqual(expect.arrayContaining(["SOURCE_CORE", "FONT_CORE"]));
  });

  it("derives known pixel cores, mirrored origins and double-DPR positions from mathematical source vertices", () => {
    const rules = designRules.visual.comparison,
      contour = {
        closed: true,
        points: [
          [160, 160],
          [480, 160],
          [480, 480],
          [160, 480],
        ].map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
      };
    const region = (dpr: number, mirror = false) =>
      visual.referencePixelRegions({
        contours: [contour],
        size: 24,
        dpr,
        mirror,
        rules,
        unitsPerEm: 960,
      });
    const ltr = region(1),
      rtl = region(1, true),
      double = region(2);
    expect(ltr.data[14 * ltr.width + 9]).toBe(1);
    expect(ltr.data[14 * ltr.width + 19]).toBe(0);
    expect(rtl.data[14 * rtl.width + 18]).toBe(1);
    expect(rtl.data[14 * rtl.width + 8]).toBe(0);
    expect(double.data[29 * double.width + 19]).toBe(1);
    expect(() => region(3)).toThrow();
    expect(() =>
      visual.referencePixelRegions({
        contours: [contour],
        size: 24,
        dpr: 1,
        rules,
        unitsPerEm: 1000,
      }),
    ).toThrow();
    expect(() =>
      visual.compareReferenceCoverage(
        { width: 1, height: 1, data: Buffer.alloc(4) },
        { width: 1, height: 1, data: Buffer.alloc(4) },
        ltr,
        rules,
      ),
    ).toThrow("dimensions");
  });

  it("does not report visible subthreshold coverage as an empty raster", () => {
    const raster = { width: 6, height: 6, data: Buffer.alloc(6 * 6 * 4) };
    for (let y = 1; y < 5; y++) for (let x = 1; x < 5; x++) raster.data[(y * 6 + x) * 4 + 3] = 127;
    const rules = designRules.visual.comparison;
    const measured = visual.compareRasters(raster, raster, rules);
    expect(measured.sourceArea).toBeCloseTo((16 * 127) / 255, 12);
    expect(measured.sourceEmpty).toBe(false);
    expect(measured.fontEmpty).toBe(false);
    expect(measured.maxBoundaryPixels).toBe(0);
    expect(visual.rasterFailures(measured, rules)).toEqual([]);
  });

  it("measures a 4x4 square and a 2x2 central hole from independent pixel expectations", () => {
    const rules = fixture.fixtureDesign.visual.comparison;
    const square = { width: 6, height: 6, data: Buffer.alloc(6 * 6 * 4) };
    for (let y = 1; y <= 4; y++)
      for (let x = 1; x <= 4; x++) square.data[(y * 6 + x) * 4 + 3] = 255;
    const ring = { ...square, data: Buffer.from(square.data) };
    for (let y = 2; y <= 3; y++) for (let x = 2; x <= 3; x++) ring.data[(y * 6 + x) * 4 + 3] = 0;
    expect(visual.compareRasters(square, square, rules).sourceArea).toBe(16);
    expect(visual.compareRasters(square, square, rules).sourceCentroid).toEqual([3, 3]);
    expect(visual.compareRasters(ring, ring, rules).sourceArea).toBe(12);
    expect(visual.compareRasters(ring, ring, rules).sourceCentroid).toEqual([3, 3]);
    /**
     * Removing the one-pixel padding changes only the coordinate origin.
     */
    const unpadded = {
      width: 4,
      height: 4,
      data: Buffer.alloc(4 * 4 * 4, 255),
    };
    expect(visual.compareRasters(unpadded, unpadded, rules).sourceCentroid).toEqual([2, 2]);
    for (const dpr of [1, 2]) {
      const extent = 2 * dpr;
      const sheet = {
        width: 32 * extent,
        height: 2 * extent,
        data: Buffer.alloc(32 * extent * 2 * extent * 4),
      };
      for (let y = 0; y < sheet.height; y++)
        for (let x = 0; x < sheet.width; x++) {
          const cell = Math.floor(y / extent) * 32 + Math.floor(x / extent);
          sheet.data.set([cell, 255 - cell, (cell * 3) % 256, 255], (y * sheet.width + x) * 4);
        }
      const original = Buffer.from(sheet.data);
      for (const cell of [0, 31, 32, 63]) {
        const cropped = visual.cropRaster(sheet, cell, extent, 32);
        for (let pixel = 0; pixel < extent * extent; pixel++)
          expect(Array.from(cropped.data.subarray(pixel * 4, pixel * 4 + 4))).toEqual([
            cell,
            255 - cell,
            (cell * 3) % 256,
            255,
          ]);
      }
      expect(sheet.data).toEqual(original);
      for (const cell of [-1, 0.5, 64])
        expect(() => visual.cropRaster(sheet, cell, extent, 32)).toThrow();
    }
  });

  it("reports real half-pixel centroids and rejects a two-pixel shift without alignment", () => {
    const rules = fixture.fixtureDesign.visual.comparison;
    const original = { width: 12, height: 12, data: Buffer.alloc(12 * 12 * 4) };
    const halfShifted = {
      ...original,
      data: Buffer.alloc(original.data.length),
    };
    const shifted = { ...original, data: Buffer.alloc(original.data.length) };
    for (let y = 3; y <= 6; y++) {
      for (let x = 3; x <= 6; x++) {
        original.data[(y * 12 + x) * 4 + 3] = 255;
        shifted.data[(y * 12 + x + 2) * 4 + 3] = 255;
      }
      for (let x = 3; x <= 7; x++)
        halfShifted.data[(y * 12 + x) * 4 + 3] = x === 3 ? 127 : x === 7 ? 128 : 255;
    }
    const half = visual.compareRasters(original, halfShifted, rules);
    expect(half.sourceArea).toBe(16);
    expect(half.fontArea).toBe(16);
    expect(half.centroidDistancePixels).toBeCloseTo(128 / 255, 12);
    const changed = visual.compareRasters(original, shifted, rules);
    expect(changed.centroidDistancePixels).toBe(2);
    expect(changed.maxBoundaryPixels).toBe(2);
    expect(
      visual.rasterFailures(changed, rules).map((failure: { code: string }) => failure.code),
    ).toEqual(expect.arrayContaining(["BOUNDARY", "CENTROID"]));
  });

  it("preserves every multigrid pixel and rejects invalid native cell addressing", () => {
    const sheet = { width: 6, height: 4, data: Buffer.alloc(6 * 4 * 4) };
    for (let y = 0; y < sheet.height; y++)
      for (let x = 0; x < sheet.width; x++) sheet.data[(y * sheet.width + x) * 4 + 3] = y * 10 + x;
    const before = Buffer.from(sheet.data);
    for (let cell = 0; cell < 6; cell++) {
      const crop = visual.cropRaster(sheet, cell, 2, 3);
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++)
          expect(crop.data[(y * 2 + x) * 4 + 3]).toBe(
            (Math.floor(cell / 3) * 2 + y) * 10 + (cell % 3) * 2 + x,
          );
    }
    expect(sheet.data).toEqual(before);
    for (const [index, cell, columns] of [
      [-1, 2, 3],
      [0.5, 2, 3],
      [0, 0, 3],
      [0, 2, 0],
      [6, 2, 3],
    ])
      expect(() => visual.cropRaster(sheet, index, cell, columns)).toThrow();
  });

  it("matches analytic half-pixel coverage, circle symmetry and hole area without alignment", () => {
    const half = { width: 8, height: 8, data: Buffer.alloc(8 * 8 * 4) };
    for (let y = 2; y < 6; y++)
      for (let x = 2; x <= 5; x++) half.data[(y * 8 + x) * 4 + 3] = x === 2 || x === 5 ? 128 : 255;
    const measured = visual.compareRasters(half, half, fixture.fixtureDesign.visual.comparison);
    expect(measured.sourceArea).toBeCloseTo(8 + (8 * 128) / 255, 12);
    expect(measured.sourceCentroid[0]).toBeCloseTo(4, 12);
    expect(measured.sourceCentroid[1]).toBeCloseTo(4, 12);
    const circle = { width: 20, height: 20, data: Buffer.alloc(20 * 20 * 4) };
    let expected = 0;
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++)
        if (Math.hypot(x + 0.5 - 10, y + 0.5 - 10) < 4) {
          circle.data[(y * 20 + x) * 4 + 3] = 255;
          expected++;
        }
    const measuredCircle = visual.compareRasters(
      circle,
      circle,
      fixture.fixtureDesign.visual.comparison,
    );
    expect(measuredCircle.sourceArea).toBe(expected);
    expect(measuredCircle.sourceCentroid).toEqual([10, 10]);
    expect(
      visual.compareRasters(raster(true), raster(true), fixture.fixtureDesign.visual.comparison)
        .sourceArea,
    ).toBe(84);
  });
  it("keeps exact Euclidean pixel distances for all pairs including row edges and distant points", () => {
    const pixels = Array.from({ length: 25 }, (_, index) => {
      const data = Buffer.alloc(5 * 5 * 4);
      data[index * 4 + 3] = 255;
      return { width: 5, height: 5, data };
    });
    for (let a = 0; a < 25; a++)
      for (let b = 0; b < 25; b++) {
        const distance = Math.hypot((a % 5) - (b % 5), Math.floor(a / 5) - Math.floor(b / 5));
        expect(
          visual.compareRasters(pixels[a], pixels[b], fixture.fixtureDesign.visual.comparison)
            .maxBoundaryPixels,
        ).toBeCloseTo(distance, 12);
      }
  });
  it("requires every state key and rejects missing, duplicate, extra and illegal direction even at equal counts", () => {
    const icons = [
        { name: "alpha", rtl: "none" },
        { name: "beta", rtl: "mirror" },
      ],
      matrix = visual.visualMatrix(icons),
      samples = visualStates(icons);
    expect(matrix.totalPairs).toBe(540);
    expect(visual.validateVisualCoverage({ icons, matrix, samples })).toEqual([]);
    const duplicate = [...samples];
    duplicate[1] = duplicate[0]!;
    expect(
      visual
        .validateVisualCoverage({ icons, matrix, samples: duplicate })
        .map((e: { code: string }) => e.code),
    ).toEqual(expect.arrayContaining(["DUPLICATE_SAMPLE", "MISSING_SAMPLE"]));
    const extra = samples.map((s, index) => (index === 0 ? { ...s, direction: "rtl" } : s));
    expect(
      visual
        .validateVisualCoverage({ icons, matrix, samples: extra })
        .some((e: { code: string }) => e.code === "EXTRA_SAMPLE"),
    ).toBe(true);
    expect(
      visual.validateVisualCoverage({
        icons,
        matrix: { ...matrix, totalPairs: 539 },
        samples,
      }),
    ).not.toEqual([]);
  });
  it("uses actual raw alpha area and centroid and detects missing interior structure", () => {
    const rules = fixture.fixtureDesign.visual.comparison,
      full = raster(),
      hole = raster(true);
    const same = visual.compareRasters(full, full, rules);
    expect(same.sourceArea).toBe(100);
    expect(same.sourceCentroid).toEqual([10, 10]);
    expect(visual.rasterFailures(same, rules)).toEqual([]);
    const changed = visual.compareRasters(full, hole, rules);
    expect(changed.xorOutsideBoundary).toBeGreaterThan(0);
    expect(visual.rasterFailures(changed, rules).map((e: { code: string }) => e.code)).toContain(
      "INTERIOR_XOR",
    );
  });
  it("never aligns, rescales or ignores empty/clipped native pixels", () => {
    const rules = fixture.fixtureDesign.visual.comparison,
      full = raster(),
      empty = { ...full, data: Buffer.alloc(full.data.length) };
    expect(
      visual
        .rasterFailures(visual.compareRasters(full, empty, rules), rules)
        .map((e: { code: string }) => e.code),
    ).toContain("EMPTY_RASTER");
    const clipped = raster();
    clipped.data[3] = 1;
    expect(
      visual
        .rasterFailures(visual.compareRasters(clipped, full, rules), rules)
        .map((e: { code: string }) => e.code),
    ).toContain("CLIPPED");
    expect(() => visual.compareRasters(full, { ...full, width: 19 }, rules)).toThrow("dimensions");
  });
});

/**
 * Draws an independent closed positive-winding fixture rectangle.
 * @param x0 - Left edge.
 * @param y0 - Bottom edge.
 * @param x1 - Right edge.
 * @param y1 - Top edge.
 * @returns Closed polygon, not a release-glyph path.
 */
function fixtureRectangle(x0: number, y0: number, x1: number, y1: number): number[][] {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ];
}

/**
 * Draws an analytic circle independently of font or source data.
 * @param x - Center x.
 * @param y - Center y.
 * @param radius - Radius in font units.
 * @returns Closed positively wound sampled circle.
 */
function fixtureCircle(x: number, y: number, radius: number): number[][] {
  return Array.from({ length: 721 }, (_, index) => [
    x + radius * Math.cos((index * Math.PI) / 360),
    y + radius * Math.sin((index * Math.PI) / 360),
  ]);
}

/**
 * Draws an analytic annular arc with a seventy-unit normal width.
 * @param x - Center x.
 * @param y - Center y.
 * @param radius - Outer radius.
 * @param start - Beginning angle in degrees.
 * @param sweep - Positive angular extent in degrees.
 * @returns Closed annular sector.
 */
function fixtureArc(
  x: number,
  y: number,
  radius: number,
  start: number,
  sweep: number,
): number[][] {
  const points = Array.from({ length: sweep * 2 + 1 }, (_, index) => [
    x + radius * Math.cos(((start + index / 2) * Math.PI) / 180),
    y + radius * Math.sin(((start + index / 2) * Math.PI) / 180),
  ]);
  points.push(
    ...Array.from({ length: sweep * 2 + 1 }, (_, index) => [
      x + (radius - 70) * Math.cos(((start + sweep - index / 2) * Math.PI) / 180),
      y + (radius - 70) * Math.sin(((start + sweep - index / 2) * Math.PI) / 180),
    ]),
    points[0]!,
  );
  return points;
}

/**
 * Draws a finite straight stroke with independent perpendicular offsets.
 * @param a - First centerline point.
 * @param b - Last centerline point.
 * @param width - Normal width, seventy units by default.
 * @returns Closed rectangular stroke, with winding preserved by subsequent fixture transforms.
 */
function fixtureRod(a: readonly number[], b: readonly number[], width = 70): number[][] {
  const length = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!),
    nx = ((-(b[1]! - a[1]!) / length) * width) / 2,
    ny = (((b[0]! - a[0]!) / length) * width) / 2;
  return [
    [a[0]! - nx, a[1]! - ny],
    [b[0]! - nx, b[1]! - ny],
    [b[0]! + nx, b[1]! + ny],
    [a[0]! + nx, a[1]! + ny],
    [a[0]! - nx, a[1]! - ny],
  ];
}

/**
 * Constructs the exact TC04 state primitive independently of the production source.
 * @param token - State token prescribed by the contract.
 * @returns Original fixture contours; unknown fixture tokens are errors.
 */
function fixtureState(token: string): number[][][] {
  if (token === "minus") return [fixtureRod([330, 320], [630, 320])];
  if (token === "plus")
    return [fixtureRod([330, 320], [630, 320]), fixtureRod([480, 170], [480, 470])];
  if (token === "x")
    return [fixtureRod([340, 180], [620, 460]), fixtureRod([340, 460], [620, 180])];
  if (token === "check")
    return [fixtureRod([330, 350], [440, 240]), fixtureRod([440, 240], [650, 490])];
  if (token === "alert") return [fixtureRod([480, 300], [480, 490]), fixtureCircle(480, 195, 35)];
  if (token === "off") return [fixtureRod([80, 720], [880, -80])];
  if (token === "help") {
    const hook = fixtureArc(480, 440, 135, -90, 270);
    hook.pop();
    hook.push([445, 375], [445, 280], [515, 280], [515, 305], hook[0]!);
    return [hook, fixtureCircle(480, 185, 35)];
  }
  if (token === "lock" || token === "unlock")
    return [
      fixtureRectangle(355, 120, 605, 300),
      fixtureArc(480, 300, 110, token === "lock" ? 0 : 35, token === "lock" ? 180 : 145),
    ];
  throw new Error("Unknown independent state fixture: " + token);
}

/**
 * Constructs hollow semantic carriers solely for independent TC04 combination tests.
 * These fixtures are not templates for rewriting repository glyphs.
 * @param name - Exact composite identity.
 * @returns Carrier contours without the requested state mark.
 */
function fixtureStateCarrier(name: string): number[][][] {
  if (name.startsWith("circle"))
    return [fixtureCircle(480, 320, 350), fixtureCircle(480, 320, 280).reverse()];
  if (name.startsWith("square"))
    return [fixtureRectangle(100, -60, 860, 700), fixtureRectangle(170, 10, 790, 630).reverse()];
  if (name.startsWith("badge") || name.startsWith("diamond") || name.startsWith("octagon")) {
    const count = name.startsWith("badge") ? 16 : name.startsWith("diamond") ? 4 : 8;
    const outer = Array.from({ length: count + 1 }, (_, step) => {
      const angle = Math.PI / 2 + (step * Math.PI * 2) / count,
        radius = name.startsWith("badge") && step % 2 ? 300 : 390;
      return [480 + radius * Math.cos(angle), 320 + radius * Math.sin(angle)];
    });
    return [
      outer,
      outer.map(([x, y]) => [480 + (x! - 480) * 0.78, 320 + (y! - 320) * 0.78]).reverse(),
    ];
  }
  if (name.startsWith("file")) {
    const body = [
      [180, -60],
      [780, -60],
      [780, 510],
      [600, 690],
      [180, 690],
      [180, -60],
    ];
    return [
      body,
      body.map(([x, y]) => [480 + (x! - 480) * 0.78, 320 + (y! - 320) * 0.78]).reverse(),
    ];
  }
  if (name.startsWith("folder")) {
    const body = [
      [100, 70],
      [860, 70],
      [860, 540],
      [390, 540],
      [310, 630],
      [100, 630],
      [100, 70],
    ];
    return [
      body,
      body.map(([x, y]) => [480 + (x! - 480) * 0.78, 320 + (y! - 320) * 0.78]).reverse(),
    ];
  }
  if (name.startsWith("clipboard") || name.startsWith("calendar")) {
    const body = [
      fixtureRectangle(150, -30, 810, 630),
      fixtureRectangle(220, 40, 740, 560).reverse(),
    ];
    return [
      ...body,
      ...(name.startsWith("calendar")
        ? [fixtureRectangle(285, 585, 355, 725), fixtureRectangle(605, 585, 675, 725)]
        : [fixtureRectangle(340, 585, 620, 705)]),
    ];
  }
  if (name.startsWith("shield")) {
    const body = [
      [130, 700],
      [830, 700],
      [790, 300],
      [680, 80],
      [480, -80],
      [280, 80],
      [170, 300],
      [130, 700],
    ];
    body.reverse();
    return [
      body,
      body.map(([x, y]) => [480 + (x! - 480) * 0.78, 320 + (y! - 320) * 0.78]).reverse(),
    ];
  }
  if (name.startsWith("message")) {
    const body = name.startsWith("message-circle")
      ? fixtureCircle(480, 320, 350).flatMap((point, step) =>
          step === 450 ? [[200, -90]] : step > 440 && step < 480 ? [] : [point],
        )
      : [
          [100, 100],
          [260, 100],
          [300, -60],
          [440, 100],
          [860, 100],
          [860, 700],
          [100, 700],
          [100, 100],
        ];
    return [
      body,
      body.map(([x, y]) => [480 + (x! - 480) * 0.72, 320 + (y! - 320) * 0.72]).reverse(),
    ];
  }
  if (name.startsWith("phone"))
    return [
      fixtureArc(520, 320, 330, 90, 180),
      fixtureRectangle(480, 600, 760, 700),
      fixtureRectangle(480, -60, 760, 40),
    ];
  if (name.startsWith("battery"))
    return [
      fixtureRectangle(100, 120, 780, 520),
      fixtureRectangle(170, 190, 710, 450).reverse(),
      fixtureRectangle(780, 250, 850, 390),
    ];
  if (name.startsWith("wifi"))
    return [fixtureCircle(480, 80, 35), fixtureArc(480, 30, 640, 55, 70)];
  if (name.startsWith("volume")) {
    const body = [
      [100, 230],
      [220, 230],
      [420, 80],
      [420, 560],
      [220, 410],
      [100, 410],
      [100, 230],
    ];
    return [body, body.map(([x, y]) => [250 + (x! - 250) * 0.6, 320 + (y! - 320) * 0.6]).reverse()];
  }
  throw new Error("Unknown independent state carrier: " + name);
}

describe("refinement contract fixtures", () => {
  it("recognizes joined thick check arms without imposing an aspect ratio on their visible edge overlap", () => {
    const a = [280, 340],
      b = [400, 220],
      c = [610, 460];
    /**
     * Computes an independent unit normal to an exact straight arm.
     * @param from - Starting centerline point.
     * @param to - Ending centerline point.
     * @returns Unit left normal in unmodified font coordinates.
     */
    function normal(from: number[], to: number[]): number[] {
      const dx = to[0]! - from[0]!,
        dy = to[1]! - from[1]!,
        length = Math.hypot(dx, dy);
      return [-dy / length, dx / length];
    }
    const n = normal(a, b),
      m = normal(b, c),
      dot = n[0]! * m[0]! + n[1]! * m[1]!;
    for (const width of [62, 70, 82, 100, 120]) {
      const half = width / 2,
        join = [((n[0]! + m[0]!) * half) / (1 + dot), ((n[1]! + m[1]!) * half) / (1 + dot)];
      const shape = [
        [a[0]! - n[0]! * half, a[1]! - n[1]! * half],
        [b[0]! - join[0]!, b[1]! - join[1]!],
        [c[0]! - m[0]! * half, c[1]! - m[1]! * half],
        [c[0]! + m[0]! * half, c[1]! + m[1]! * half],
        [b[0]! + join[0]!, b[1]! + join[1]!],
        [a[0]! + n[0]! * half, a[1]! + n[1]! * half],
      ];
      shape.push(shape[0]!);
      expect(basicStateFeatures("check", [shape]), "joined width " + width).toEqual([]);
      expect(
        basicStateFeatures("check", [[...shape].reverse()]),
        "inverse winding " + width,
      ).toEqual([]);
      expect(
        basicStateFeatures("check", [shape.map(([x, y]) => [960 - x!, y!])]),
        "mirrored width " + width,
      ).not.toEqual([]);
      expect(
        basicStateFeatures("check", [fixtureRod(a, b, width)]),
        "missing long arm " + width,
      ).not.toEqual([]);
      expect(
        basicStateFeatures("check", [fixtureRod(b, c, width)]),
        "missing short arm " + width,
      ).not.toEqual([]);
      expect(
        basicStateFeatures("check", [
          fixtureRod(a, b, width),
          fixtureRod([b[0]! + 250, b[1]!], [c[0]! + 250, c[1]!], width),
        ]),
        "disconnected arms " + width,
      ).not.toEqual([]);
    }
  });

  it("checks communication dots/text/heart/reply/forward/call details while retaining their original carrier", () => {
    const more = [360, 480, 600].map((x) => fixtureCircle(x, 320, 35));
    const text = [390, 250].map((y) => fixtureRod([330, y], [630, y]));
    const heart = Array.from({ length: 721 }, (_value, index) => {
      const angle = (index * Math.PI) / 360;
      return [
        480 + 120 * Math.sin(angle) ** 3,
        320 +
          100 *
            (0.8125 * Math.cos(angle) -
              0.3125 * Math.cos(2 * angle) -
              0.125 * Math.cos(3 * angle) -
              0.0625 * Math.cos(4 * angle)),
      ];
    });
    const forward = [
        [400, 285],
        [620, 285],
        [620, 230],
        [750, 320],
        [620, 410],
        [620, 355],
        [400, 355],
        [400, 285],
      ],
      reply = forward.map(([x, y]) => [960 - x!, y!]);
    const payloads: Record<string, number[][][]> = {
      more,
      text,
      heart: [heart],
      reply: [reply],
      forwarded: [forward],
      call: [fixtureArc(620, 320, 180, 0, 90)],
    };
    expect(heartFeature([heart])).toBe(true);
    const largeHeart = heart.map(([x, y]) => [480 + (x! - 480) * 2, 320 + (y! - 320) * 2]);
    expect(heartFeature([largeHeart])).toBe(true);
    expect(heartFeature([fixtureCircle(480, 320, 240)])).toBe(false);
    expect(heartFeature([fixtureRectangle(240, 80, 720, 560)])).toBe(false);
    expect(heartFeature([fixtureCircle(480, 320, 120)])).toBe(false);
    expect(heartFeature([fixtureRectangle(380, 220, 580, 420)])).toBe(false);
    for (const [token, payload] of Object.entries(payloads)) {
      const names = semanticDomains.TC06!.filter((name) => name.split("-").includes(token));
      expect(names.length, token).toBeGreaterThan(0);
      for (const name of names) {
        const carrier = fixtureStateCarrier(name);
        expect(semanticFeatures(name, [...carrier, ...payload]), name).toEqual([]);
        expect(semanticFeatures(name, carrier), name + " missing payload").not.toEqual([]);
        expect(semanticFeatures(name, payload), name + " missing carrier").not.toEqual([]);
        if (token === "reply" || token === "forwarded")
          expect(
            semanticFeatures(name, [
              ...carrier,
              ...payloads[token === "reply" ? "forwarded" : "reply"]!,
            ]),
            name + " wrong direction",
          ).not.toEqual([]);
      }
    }
    const bubble = fixtureStateCarrier("message-square-more");
    for (const dots of [more.slice(0, 2), [...more, fixtureCircle(480, 450, 35)]])
      expect(semanticFeatures("message-square-more", [...bubble, ...dots])).not.toEqual([]);
    expect(
      semanticFeatures("message-square-text", [
        ...fixtureStateCarrier("message-square-text"),
        text[0]!,
      ]),
    ).not.toEqual([]);
    expect(
      semanticFeatures("message-square-heart", [
        ...fixtureStateCarrier("message-square-heart"),
        fixtureCircle(480, 320, 120),
      ]),
    ).not.toEqual([]);
  });

  it("checks incoming/outgoing against the actual handset and accepts independent inclined handset ends", () => {
    const carrier = fixtureStateCarrier("phone"),
      incoming = [
        [560, 285],
        [340, 285],
        [340, 230],
        [210, 320],
        [340, 410],
        [340, 355],
        [560, 355],
        [560, 285],
      ];
    const outgoing = incoming.map(([x, y]) => [1080 - x!, y!]);
    for (const [name, arrow, wrong] of [
      ["phone-incoming", incoming, outgoing],
      ["phone-outgoing", outgoing, incoming],
    ] as const) {
      expect(semanticFeatures(name, [...carrier, arrow]), name).toEqual([]);
      expect(semanticFeatures(name, carrier), name + " missing arrow").not.toEqual([]);
      expect(semanticFeatures(name, [...carrier, wrong]), name + " reversed action").not.toEqual(
        [],
      );
      expect(semanticFeatures(name, [arrow]), name + " missing handset").not.toEqual([]);
    }
    for (const degrees of [45, 90, 135]) {
      const angle = (degrees * Math.PI) / 180;
      const rotated = carrier.map((part) =>
        part.map(([x, y]) => [
          480 + (x! - 480) * Math.cos(angle) - (y! - 320) * Math.sin(angle),
          320 + (x! - 480) * Math.sin(angle) + (y! - 320) * Math.cos(angle),
        ]),
      );
      expect(communicationFeatures("phone", rotated), "handset rotation " + degrees).toEqual([]);
      expect(
        communicationFeatures("phone", rotated.slice(1)),
        "missing curve " + degrees,
      ).not.toEqual([]);
    }
  });

  it("checks symbolic charging/warning/sync states without substituting them for numerical strength levels", () => {
    const lightning = [
      [550, 650],
      [300, 300],
      [470, 300],
      [410, -50],
      [660, 350],
      [500, 350],
      [550, 650],
    ].map(([x, y]) => [480 + (x! - 480) * 0.35, 320 + (y! - 320) * 0.35]);
    const battery = fixtureStateCarrier("battery-charging");
    expect(semanticFeatures("battery-charging", [...battery, lightning])).toEqual([]);
    expect(semanticFeatures("battery-charging", battery)).toContain("state charging");
    const nut = Array.from({ length: 7 }, (_value, index) => [
      480 + 120 * Math.cos((index * Math.PI) / 3),
      320 + 120 * Math.sin((index * Math.PI) / 3),
    ]);
    expect(utilityState("charging", [nut])).toBe(false);
    const warning = [fixtureRod([450, 280], [450, 400], 40), fixtureCircle(450, 230, 30)];
    for (const name of [...activeSemanticNames].filter((identity) =>
      identity.split("-").includes("warning"),
    )) {
      const carrier = name.startsWith("mail-")
        ? [
            fixtureRectangle(100, -60, 860, 700),
            fixtureRectangle(170, 10, 790, 630).reverse(),
            fixtureRod([100, 700], [480, 400]),
            fixtureRod([860, 700], [480, 400]),
          ]
        : fixtureStateCarrier(name);
      expect(semanticFeatures(name, [...carrier, ...warning]), name).toEqual([]);
      expect(semanticFeatures(name, carrier), name + " missing warning").toContain("state alert");
      expect(
        semanticFeatures(name, [...carrier, warning[0]!]),
        name + " missing warning dot",
      ).toContain("state alert");
    }
    /**
     * Draws independently calculated clockwise annular paths and terminal heads.
     * @param start - Beginning angle of each opposite path.
     * @returns One update arc and two actual head arms.
     */
    function update(start: number): number[][][] {
      const angle = (start * Math.PI) / 180,
        radial = [Math.cos(angle), Math.sin(angle)],
        tangent = [radial[1]!, -radial[0]!],
        tip = [480 + 135 * radial[0]!, 320 + 135 * radial[1]!];
      return [
        fixtureArc(480, 320, 170, start, 120),
        ...[-1, 1].map((side) =>
          fixtureRod(
            [
              tip[0]! - 90 * tangent[0]! + side * 80 * radial[0]!,
              tip[1]! - 90 * tangent[1]! + side * 80 * radial[1]!,
            ],
            tip,
            40,
          ),
        ),
      ];
    }
    const sync = [...update(0), ...update(180)],
      wifi = fixtureStateCarrier("wifi-sync");
    expect(semanticFeatures("wifi-sync", [...wifi, ...sync])).toEqual([]);
    expect(semanticFeatures("wifi-sync", wifi)).toContain("state sync");
    expect(semanticFeatures("wifi-sync", [...wifi, ...update(0)])).toContain("state sync");
    expect(
      utilityState(
        "sync",
        sync.filter((_part, index) => index % 3 === 0),
      ),
    ).toBe(false);
  });

  it("checks archive box/zipper alternatives and real open-folder planes rather than relabeling a closed folder", () => {
    const box = [
      fixtureRectangle(340, 220, 620, 400),
      fixtureRectangle(375, 255, 585, 365).reverse(),
      fixtureRectangle(300, 390, 660, 445),
    ];
    const zipper = [
      fixtureRod([480, 210], [480, 470], 20),
      fixtureRectangle(440, 280, 480, 320),
      fixtureRectangle(480, 360, 520, 400),
    ];
    for (const name of semanticDomains.TC05!.filter((identity) => identity.endsWith("-archive"))) {
      const carrier = fixtureStateCarrier(name);
      for (const detail of [box, zipper]) {
        expect(semanticFeatures(name, [...carrier, ...detail]), name).toEqual([]);
        expect(semanticFeatures(name, detail), name + " missing carrier").not.toEqual([]);
      }
      expect(semanticFeatures(name, carrier), name + " missing archive").not.toEqual([]);
      expect(
        semanticFeatures(name, [...carrier, ...box.slice(0, 2)]),
        name + " missing lid",
      ).not.toEqual([]);
      expect(
        semanticFeatures(name, [...carrier, ...zipper.slice(1)]),
        name + " missing zipper spine",
      ).not.toEqual([]);
    }
    const flap = [
      [180, 70],
      [780, 70],
      [860, 340],
      [260, 340],
      [180, 70],
    ];
    const flapCounter = [
      [280, 120],
      [740, 120],
      [790, 290],
      [330, 290],
      [280, 120],
    ].reverse();
    for (const name of ["folder-open", "folder-open-dot"]) {
      const carrier = fixtureStateCarrier(name),
        dot = name.endsWith("-dot") ? [fixtureCircle(480, 230, 35)] : [];
      expect(semanticFeatures(name, [...carrier, flap, flapCounter, ...dot]), name).toEqual([]);
      expect(semanticFeatures(name, [...carrier, ...dot]), name + " closed folder").not.toEqual([]);
      if (dot.length)
        expect(semanticFeatures(name, [...carrier, flap]), name + " missing dot").not.toEqual([]);
    }
    const largeFlap = [
        [140, 0],
        [730, 0],
        [860, 420],
        [270, 420],
        [140, 0],
      ].reverse(),
      largeCounter = [
        [240, 80],
        [675, 80],
        [780, 340],
        [345, 340],
        [240, 80],
      ],
      carrier = fixtureStateCarrier("folder").map((part) => [...part].reverse()),
      open = [...carrier, largeFlap, largeCounter],
      marker = fixtureCircle(480, 220, 35);
    expect(semanticFeatures("folder-open-dot", [...open, marker])).toEqual([]);
    expect(semanticFeatures("folder-open-dot", open)).not.toEqual([]);
    expect(
      semanticFeatures("folder-open-dot", [...open, marker, fixtureCircle(480, 220, 28).reverse()]),
    ).not.toEqual([]);
    expect(
      semanticFeatures("folder-open-dot", [
        ...carrier,
        [...largeFlap].reverse(),
        [...marker].reverse(),
      ]),
    ).not.toEqual([]);
  });

  it("checks prescribed document text/scan/image/music/code/tree payloads together with their actual carrier", () => {
    const text = [470, 340, 210].map((y) => fixtureRod([320, y], [620, y]).reverse());
    const scan = [
      [100, -80],
      [820, -80],
      [100, 700],
      [820, 700],
    ].map(([x, y], index) => {
      const dx = index % 2 ? -100 : 100,
        dy = index < 2 ? 100 : -100;
      return [
        [x!, y! + dy],
        [x! + 35, y! + dy],
        [x! + 35, y! + 35],
        [x! + dx, y! + 35],
        [x! + dx, y!],
        [x!, y!],
        [x!, y! + dy],
      ];
    });
    const image = [
      fixtureRectangle(300, 200, 680, 470),
      fixtureRectangle(330, 230, 650, 440).reverse(),
      fixtureCircle(610, 400, 25),
      fixtureRod([370, 240], [480, 350], 30).reverse(),
      fixtureRod([590, 240], [480, 350], 30).reverse(),
    ];
    const music = [
      fixtureCircle(430, 220, 45),
      fixtureRod([475, 220], [475, 470], 40).reverse(),
      fixtureRod([475, 470], [580, 440], 40).reverse(),
    ];
    const code = [
      fixtureRod([440, 420], [340, 320], 40).reverse(),
      fixtureRod([440, 220], [340, 320], 40).reverse(),
      fixtureRod([520, 420], [620, 320], 40).reverse(),
      fixtureRod([520, 220], [620, 320], 40).reverse(),
    ];
    const tree = [
      fixtureRectangle(330, 380, 430, 480),
      fixtureRectangle(550, 150, 650, 250),
      fixtureRod([430, 430], [600, 430], 35).reverse(),
      fixtureRod([600, 430], [600, 250], 35).reverse(),
    ];
    const payloads: Record<string, number[][][]> = {
      text,
      scan,
      image,
      music,
      code,
      tree,
    };
    for (const count of [1, 2, 3])
      expect(
        symbolRods(text.slice(0, count)).filter(
          (rod) => Math.abs(rod.b[1]! - rod.a[1]!) <= designRules.grid.lengthTolerance,
        ),
        "separate text rows " + count,
      ).toHaveLength(count);
    for (const radius of [25, 80])
      expect(circularContour(fixtureCircle(480, 320, radius), 25, 80)).toBe(true);
    for (const radius of [24.9, 80.1])
      expect(circularContour(fixtureCircle(480, 320, radius), 25, 80)).toBe(false);
    expect(chartRectangles(image), "independent image frame").toHaveLength(1);
    expect(diceDotCenters(image), "independent image dot").toHaveLength(1);
    expect(
      strokeArrowheads(image).filter((head) => head.direction[1]! > 0.8),
      "independent mountain peak",
    ).toHaveLength(1);
    for (const [token, payload] of Object.entries(payloads)) {
      const names = semanticDomains.TC05!.filter((name) => name.split("-").includes(token));
      expect(names.length, token).toBeGreaterThan(0);
      for (const name of names) {
        const carrier = fixtureStateCarrier(name);
        expect(semanticFeatures(name, [...carrier, ...payload]), name).toEqual([]);
        expect(semanticFeatures(name, carrier), name + " missing payload").not.toEqual([]);
        expect(semanticFeatures(name, payload), name + " missing carrier").not.toEqual([]);
        expect(
          semanticFeatures(name, [...carrier, ...payloads[token === "text" ? "code" : "text"]!]),
          name + " substituted payload",
        ).not.toEqual([]);
      }
    }
    const carrier = fixtureStateCarrier("file-scan");
    for (let remove = 0; remove < 4; remove++)
      expect(
        semanticFeatures("file-scan", [
          ...carrier,
          ...scan.filter((_part, index) => index !== remove),
        ]),
      ).not.toEqual([]);
    expect(
      semanticFeatures("file-text", [...fixtureStateCarrier("file-text"), ...text.slice(0, 2)]),
    ).not.toEqual([]);
    expect(
      semanticFeatures("file-image", [...fixtureStateCarrier("file-image"), ...image.slice(0, 2)]),
    ).not.toEqual([]);
    expect(
      semanticFeatures("file-music", [...fixtureStateCarrier("file-music"), music[0]!]),
    ).not.toEqual([]);
    expect(
      semanticFeatures("folder-tree", [...fixtureStateCarrier("folder-tree"), ...tree.slice(0, 2)]),
    ).not.toEqual([]);
  });

  it("checks every closed cog/pen composition without replacing a gear by a holed star or a pen by a stick", () => {
    const gear = Array.from({ length: 32 }, (_value, index) => {
      const tooth = Math.floor(index / 4),
        position = index % 4,
        angle = ((tooth * 45 + [-8, 8, 14, 31][position]!) * Math.PI) / 180,
        radius = position < 2 ? 120 : 90;
      return [480 + radius * Math.cos(angle), 320 + radius * Math.sin(angle)];
    });
    gear.push(gear[0]!);
    const cog = [gear, fixtureCircle(480, 320, 40).reverse()];
    const shaft = fixtureRod([365, 205], [620, 460], 50).reverse();
    const nib = [
      [320, 160],
      [365 - 25 / Math.sqrt(2), 205 + 25 / Math.sqrt(2)],
      [365 + 25 / Math.sqrt(2), 205 - 25 / Math.sqrt(2)],
      [320, 160],
    ];
    const pen = [shaft, nib];
    for (const [token, marker] of Object.entries({ cog, pen })) {
      expect(editingState(token, marker), token).toBe(true);
      expect(editingState(token, []), token + " missing state").toBe(false);
      const names = [...activeSemanticNames].filter((name) => name.split("-").includes(token));
      expect(names.length, token).toBeGreaterThan(0);
      for (const name of names) {
        const carrier = fixtureStateCarrier(name);
        expect(semanticFeatures(name, [...carrier, ...marker]), name).toEqual([]);
        expect(semanticFeatures(name, carrier), name + " missing state").toContain(
          "state " + token,
        );
        expect(semanticFeatures(name, marker), name + " missing subject").not.toEqual([]);
      }
    }
    expect(editingState("cog", [gear])).toBe(false);
    expect(editingState("cog", [fixtureCircle(480, 320, 120), cog[1]!])).toBe(false);
    const star = Array.from({ length: 10 }, (_value, index) => {
      const angle = (index * Math.PI) / 5,
        radius = index % 2 ? 60 : 120;
      return [480 + radius * Math.cos(angle), 320 + radius * Math.sin(angle)];
    });
    star.push(star[0]!);
    expect(editingState("cog", [star, cog[1]!])).toBe(false);
    expect(editingState("pen", [shaft])).toBe(false);
    expect(editingState("pen", [nib])).toBe(false);
    expect(editingState("pen", [shaft, nib.map(([x, y]) => [x! - 180, y!])])).toBe(false);
    const merged = [
      nib[0]!,
      [365 - 25 / Math.sqrt(2), 205 + 25 / Math.sqrt(2)],
      [620 - 25 / Math.sqrt(2), 460 + 25 / Math.sqrt(2)],
      [620 + 25 / Math.sqrt(2), 460 - 25 / Math.sqrt(2)],
      [365 + 25 / Math.sqrt(2), 205 - 25 / Math.sqrt(2)],
      nib[0]!,
    ];
    expect(editingState("pen", [merged])).toBe(true);
    expect(editingState("pen", [[...merged].reverse()])).toBe(true);
  });

  it("checks media states independently and retains their container/document subject", () => {
    const play = [
      [
        [350, 180],
        [650, 320],
        [350, 460],
        [350, 180],
      ],
    ];
    const pause = [fixtureRod([390, 170], [390, 470]), fixtureRod([570, 170], [570, 470])];
    const power = [fixtureArc(480, 290, 180, 120, 300), fixtureRod([480, 330], [480, 550], 50)];
    const markers: Record<string, number[][][]> = { play, pause, power };
    for (const [token, marker] of Object.entries(markers)) {
      expect(mediaState(token, marker), token).toBe(true);
      expect(mediaState(token, []), token + " removed state").toBe(false);
      for (const other of Object.keys(markers).filter((name) => name !== token))
        expect(mediaState(token, markers[other]!), token + " wrong " + other).toBe(false);
      for (const name of [...activeSemanticNames].filter((identity) =>
        identity.split("-").includes(token),
      )) {
        const carrier = fixtureStateCarrier(name);
        expect(semanticFeatures(name, [...carrier, ...marker]), name).toEqual([]);
        expect(semanticFeatures(name, carrier), name + " missing state").toContain(
          "state " + token,
        );
        expect(semanticFeatures(name, marker), name + " missing subject").not.toEqual([]);
      }
    }
    const left = play.map((part) => part.map(([x, y]) => [960 - x!, y!]));
    expect(mediaState("play", left)).toBe(false);
    expect(mediaState("pause", pause.slice(0, 1))).toBe(false);
    expect(
      mediaState(
        "pause",
        pause.map((part) => part.map(([x, y]) => [480 + y! - 320, 320 + x! - 480])),
      ),
    ).toBe(false);
    expect(mediaState("power", [power[0]!])).toBe(false);
    expect(
      mediaState("power", [
        fixtureCircle(480, 290, 180),
        fixtureCircle(480, 290, 110).reverse(),
        power[1]!,
      ]),
    ).toBe(false);
  });

  it("does not substitute Git branch T junctions for separate plus/minus state markers", () => {
    const nodes = [
      [480, 100],
      [480, 620],
      [760, 620],
    ].flatMap(([x, y]) => [fixtureCircle(x!, y!, 60), fixtureCircle(x!, y!, 30).reverse()]);
    const edges = [
      fixtureRod([480, 160], [480, 560]),
      fixtureRod([480, 320], [760, 320]),
      fixtureRod([760, 320], [760, 560]),
    ];
    const carrier = [...nodes, ...edges];
    for (const token of ["plus", "minus"]) {
      const name = "git-branch-" + token;
      const marker = fixtureState(token).map((part) =>
        part.map(([x, y]) => [220 + (x! - 480) * 0.65, 320 + (y! - 320) * 0.65]),
      );
      expect(semanticFeatures(name, [...carrier, ...marker]), name).toEqual([]);
      expect(semanticFeatures(name, carrier), name + " removed marker").toContain("state " + token);
      expect(semanticFeatures(name, marker), name + " removed branch").not.toEqual([]);
      const wrong = fixtureState(token === "plus" ? "minus" : "plus").map((part) =>
        part.map(([x, y]) => [220 + (x! - 480) * 0.65, 320 + (y! - 320) * 0.65]),
      );
      expect(
        semanticFeatures(name, [...carrier, ...wrong]),
        name + " substituted marker",
      ).toContain("state " + token);
    }
  }, 30_000);

  it("checks every noncalendar document/mail/list clock as a genuine subject-plus-clock composition", () => {
    const names = Object.values(semanticDomains)
      .flat()
      .filter(
        (name) => name.endsWith("-clock") && /^(?:file|folder|clipboard|mail|list)-/u.test(name),
      );
    for (const name of names) {
      const cx = name.startsWith("list-") ? 660 : 480,
        cy = 200;
      const clock = [
        fixtureCircle(cx, cy, 120),
        fixtureCircle(cx, cy, 85).reverse(),
        fixtureRod([cx, cy], [cx, cy + 85], 25).reverse(),
        fixtureRod([cx, cy], [cx + 65, cy], 25).reverse(),
      ];
      const carrier = name.startsWith("mail-")
        ? [
            fixtureRectangle(100, -60, 860, 700),
            fixtureRectangle(170, 10, 790, 630).reverse(),
            fixtureRod([100, 700], [480, 400]).reverse(),
            fixtureRod([860, 700], [480, 400]).reverse(),
          ]
        : name.startsWith("list-")
          ? [600, 450, 300].map((y) => fixtureRod([120, y], [400, y]).reverse())
          : fixtureStateCarrier(name);
      expect(semanticFeatures(name, [...carrier, ...clock]), name).toEqual([]);
      expect(semanticFeatures(name, carrier), name + " missing clock").not.toEqual([]);
      expect(semanticFeatures(name, clock), name + " missing subject").not.toEqual([]);
      for (const removed of [0, 2, 3])
        expect(
          semanticFeatures(name, [
            ...carrier,
            ...clock.filter((_part, index) => index !== removed),
          ]),
          name + " missing dial/hand " + removed,
        ).not.toEqual([]);
    }
    expect([...new Set(names)].sort()).toEqual([
      "clipboard-clock",
      "file-clock",
      "folder-clock",
      "list-clock",
      "mail-clock",
    ]);
  });

  it("rejects a true two-unit connection break even when neighboring connectivity probes both contain ink", () => {
    const line = fixtureRectangle(445, 100, 515, 620),
      gap = fixtureRectangle(440, 319, 520, 321).reverse();
    const first = carrierGeometry(fixtureRectangle(440, 100, 520, 160)),
      second = carrierGeometry(fixtureRectangle(440, 560, 520, 620));
    expect(connectedEndRegions([line], first, second)).toBe(true);
    expect(connectedEndRegions([line, gap], first, second)).toBe(false);
    expect(connectedEndRegions([[...line].reverse(), [...gap].reverse()], first, second)).toBe(
      false,
    );
  });

  it("accepts real interrupted square borders and small circular frames without requiring long single contours", () => {
    const sides = [
      [fixtureRod([100, -60], [860, -60])],
      [fixtureRod([860, -60], [860, 700])],
      [fixtureRod([100, 700], [860, 700])],
      [fixtureRod([100, -60], [100, 700])],
    ];
    const dashed = sides.map((parts, index) => {
      const vertical = index % 2 === 1,
        fixed = index === 0 ? -60 : index === 1 ? 860 : index === 2 ? 700 : 100,
        start = vertical ? -60 : 100;
      return Array.from({ length: 4 }, (_value, segment) => {
        const lower = start + segment * 190,
          upper = lower + 130;
        return fixtureRod(
          vertical ? [fixed, lower] : [lower, fixed],
          vertical ? [fixed, upper] : [upper, fixed],
        );
      });
    });
    for (const frame of [
      sides,
      dashed,
      sides.map((part, index) => (index === 0 ? dashed[index]! : part)),
    ]) {
      expect(squareFrame(frame.flat())).toBe(true);
      expect(semanticFeatures("square-dashed", frame.flat())).toEqual([]);
      for (let remove = 0; remove < 4; remove++)
        expect(squareFrame(frame.filter((_side, index) => index !== remove).flat())).toBe(false);
    }
    expect(squareFrame([fixtureCircle(480, 320, 350)])).toBe(false);
    expect(squareFrame([fixtureRectangle(100, 120, 860, 520)])).toBe(false);
    expect(semanticFeatures("circle-small", [fixtureCircle(480, 320, 120)])).toEqual([]);
    expect(semanticFeatures("circle", [fixtureCircle(480, 320, 120)])).toContain("circular frame");
  });

  it("checks TC13 spatial rotation as projected depth plus an open curved terminal arrow", () => {
    const axes = [
      fixtureRod([480, 450], [480, 650]),
      fixtureRod([480, 450], [310, 350]),
      fixtureRod([480, 450], [650, 350]),
    ];
    const curve = fixtureArc(480, 320, 330, 0, 180).map(([x, y]) => [x!, 80 + (y! - 320) * 0.35]);
    const heads = [fixtureRod([290, 160], [185, 80]), fixtureRod([290, 0], [185, 80])];
    const frame = [
      [480, 650],
      [650, 550],
      [650, 350],
      [480, 250],
      [310, 350],
      [310, 550],
      [480, 650],
    ];
    const volume = [
      frame,
      frame.map(([x, y]) => [480 + (x! - 480) * 0.8, 450 + (y! - 450) * 0.8]).reverse(),
      ...axes.map((part) => [...part].reverse()),
    ];
    for (const [kind, subject] of [
      ["axes", axes],
      ["volume", volume],
    ] as const) {
      expect(connectionFeatures("rotate-3d", [...subject, curve, ...heads]), kind).toEqual([]);
      expect(connectionFeatures("rotate-3d", [curve, ...heads])).toContain(
        "three distinct projected spatial axes",
      );
      expect(connectionFeatures("rotate-3d", [...subject, ...heads])).toContain(
        "open spatial rotation curve",
      );
      expect(connectionFeatures("rotate-3d", [...subject, curve])).toContain(
        "spatial rotation terminal arrowhead",
      );
      const ellipse = fixtureCircle(480, 320, 330).map(([x, y]) => [x!, 80 + (y! - 320) * 0.35]);
      expect(connectionFeatures("rotate-3d", [...subject, ellipse, ...heads])).not.toEqual([]);
    }
    expect(connectionFeatures("rotate-3d", [...axes.slice(0, 2), curve, ...heads])).toContain(
      "three distinct projected spatial axes",
    );
    expect(() => connectionFeatures("rotate-invented", axes)).toThrow("Unknown closed connection");
  });

  it("recognizes rounded lock bodies with short but genuine straight sides", () => {
    const corners = [
        [610, 180, -90],
        [610, 270, 0],
        [350, 270, 90],
        [350, 180, 180],
      ],
      body = corners.flatMap(([x, y, start]) =>
        Array.from({ length: 181 }, (_value, index) => [
          x! + 50 * Math.cos(((start! + index / 2) * Math.PI) / 180),
          y! + 50 * Math.sin(((start! + index / 2) * Math.PI) / 180),
        ]),
      );
    body.push(body[0]!);
    const shackle = fixtureArc(480, 310, 145, 0, 180);
    expect(curvedState("lock", [body, shackle])).toBe(true);
    expect(curvedState("lock", [body])).toBe(false);
    expect(curvedState("lock", [shackle])).toBe(false);
    expect(curvedState("lock", [fixtureCircle(480, 225, 160), shackle])).toBe(false);
    expect(curvedState("lock", [body, fixtureArc(480, 310, 145, 35, 145)])).toBe(false);
  });

  it("recognizes local Git forks when a distant probe touches a nearby node ring", () => {
    const centers = [
        [400, 150],
        [400, 420],
        [675, 360],
      ],
      rings = centers.flatMap(([x, y]) => [
        fixtureCircle(x!, y!, 66),
        fixtureCircle(x!, y!, 28).reverse(),
      ]),
      branchLength = Math.hypot(275, 60),
      paths = [
        fixtureRod([400, 214], [400, 356], 44),
        fixtureRod(
          [400, 300],
          [675 - (275 / branchLength) * 64, 360 - (60 / branchLength) * 64],
          44,
        ),
      ],
      complete = [...rings, ...paths];
    expect(gitFeatures("git-branch", complete)).toEqual([]);
    expect(gitFeatures("git-branch", [...rings, paths[0]!])).not.toEqual([]);
    expect(gitFeatures("git-branch", [...rings, paths[1]!])).not.toEqual([]);
    const detached = paths[1]!.map(([x, y]) => [x! + 60, y! + 60]);
    expect(gitFeatures("git-branch", [...rings, paths[0]!, detached])).not.toEqual([]);
  });

  it("checks every TC13 Git subject using open nodes, genuine connections and fork/route/commit structure", () => {
    /**
     * Draws independently defined node rings without a source-derived graph template.
     * @param centers - Explicit node center coordinates.
     * @returns Positive outer circles and necessary opposite-winding holes.
     */
    function nodes(centers: number[][]): number[][][] {
      return centers.flatMap(([x, y]) => [
        fixtureCircle(x!, y!, 60),
        fixtureCircle(x!, y!, 30).reverse(),
      ]);
    }
    const forkNodes = nodes([
      [480, 100],
      [480, 620],
      [760, 620],
    ]);
    const forkEdges = [
      fixtureRod([480, 160], [480, 560]),
      fixtureRod([480, 320], [760, 320]),
      fixtureRod([760, 320], [760, 560]),
    ];
    const compareNodes = nodes([
      [250, 100],
      [250, 620],
      [710, 100],
      [710, 620],
    ]);
    const compareEdges = [fixtureRod([250, 160], [250, 560]), fixtureRod([710, 160], [710, 560])];
    const pullNodes = nodes([
      [250, 100],
      [250, 620],
      [710, 100],
    ]);
    const pullEdges = [
      fixtureRod([250, 160], [250, 560]),
      fixtureRod([710, 160], [710, 500]),
      fixtureRod([710, 500], [250, 500]),
    ];
    const arrow = [fixtureRod([370, 600], [250, 500]), fixtureRod([370, 400], [250, 500])];
    const compareArrows = [
      ...arrow,
      ...arrow.map((part) => part.map(([x, y]) => [960 - x!, 820 - y!])),
    ];
    for (const name of semanticDomains.TC13!.filter((identity) => identity.startsWith("git-"))) {
      const commit = name.includes("commit"),
        comparison = name.includes("compare"),
        pull = name.includes("pull-request");
      const horizontal = name.endsWith("horizontal");
      const carriers = commit
        ? nodes([[480, 320]])
        : comparison
          ? compareNodes
          : pull
            ? pullNodes
            : forkNodes;
      const edges = commit
        ? horizontal
          ? [fixtureRod([100, 320], [420, 320]), fixtureRod([540, 320], [860, 320])]
          : [fixtureRod([480, -60], [480, 260]), fixtureRod([480, 380], [480, 700])]
        : comparison
          ? compareEdges
          : pull
            ? pullEdges
            : forkEdges;
      const heads = pull ? arrow : name.endsWith("-arrows") ? compareArrows : [];
      const complete = [...carriers, ...edges, ...heads];
      expect(gitFeatures(name, complete), name).toEqual([]);
      expect(
        gitFeatures(
          name,
          complete.map((part) => [...part].reverse()),
        ),
        name + " inverse winding",
      ).toEqual([]);
      expect(gitFeatures(name, [...carriers, ...heads]), name + " missing connection").not.toEqual(
        [],
      );
      expect(gitFeatures(name, [...edges, ...heads]), name + " missing nodes").not.toEqual([]);
      expect(
        gitFeatures(name, [
          ...carriers.filter((_part, index) => index % 2 === 0),
          ...edges,
          ...heads,
        ]),
        name + " sealed holes",
      ).not.toEqual([]);
      if (commit) {
        expect(gitFeatures(name, [...carriers, edges[0]!]), name + " missing line arm").not.toEqual(
          [],
        );
        expect(
          gitFeatures(name, [
            ...carriers,
            ...edges.map((part) => part.map(([x, y]) => [480 + y! - 320, 320 + x! - 480])),
          ]),
          name + " wrong commit axis",
        ).not.toEqual([]);
      }
      if (!commit && !comparison && !pull)
        expect(gitFeatures(name, [...carriers, forkEdges[0]!]), name + " missing fork").not.toEqual(
          [],
        );
      if (comparison || pull)
        expect(
          gitFeatures(name, [
            ...carriers,
            ...edges.filter((part) => carrierGeometry(part).cx < 480),
            ...heads,
          ]),
          name + " missing second route",
        ).not.toEqual([]);
      if (heads.length)
        expect(gitFeatures(name, [...carriers, ...edges]), name + " missing arrows").not.toEqual(
          [],
        );
    }
  }, 30_000);

  it("checks TC09 dashboard/template sections and the actual template frame without inventing a tile count", () => {
    const sections = [fixtureRectangle(190, 450, 770, 600), fixtureRectangle(190, 30, 430, 370)];
    const frame = [
      fixtureRectangle(100, -60, 860, 700),
      fixtureRectangle(170, 10, 790, 630).reverse(),
    ];
    expect(layoutFeatures("layout-dashboard", sections)).toEqual([]);
    expect(layoutFeatures("layout-dashboard", sections.slice(0, 1))).not.toEqual([]);
    expect(layoutFeatures("layout-template", [...frame, ...sections])).toEqual([]);
    expect(layoutFeatures("layout-template", sections)).toContain("template page frame");
    expect(layoutFeatures("layout-template", [...frame, ...sections.slice(0, 1)])).not.toEqual([]);
    expect(layoutFeatures("layout-template", frame)).not.toEqual([]);
    expect(() => layoutFeatures("layout-invented", sections)).toThrow("Unknown closed layout");
  });

  it("checks all TC13 undo/redo paths without accepting a circular rotation arrow", () => {
    const bend = [
      [150, 535],
      [715, 535],
      [715, 115],
      [480, 115],
      [480, 185],
      [645, 185],
      [645, 465],
      [150, 465],
      [150, 535],
    ].reverse();
    const head = [fixtureRod([280, 610], [150, 500]), fixtureRod([280, 390], [150, 500])];
    /**
     * Independent analytic annular bend, including both real straight-arm edges.
     */
    const rounded = [
      [150, 535],
      ...Array.from({ length: 91 }, (_value, index) => {
        const angle = ((90 - index * 2) * Math.PI) / 180;
        return [580 + 270 * Math.cos(angle), 265 + 270 * Math.sin(angle)];
      }),
      ...Array.from({ length: 91 }, (_value, index) => {
        const angle = ((-90 + index * 2) * Math.PI) / 180;
        return [580 + 200 * Math.cos(angle), 265 + 200 * Math.sin(angle)];
      }),
      [150, 465],
      [150, 535],
    ].reverse();
    for (const name of semanticDomains.TC13!.filter((identity) =>
      /^(?:undo|redo)-/u.test(identity),
    )) {
      const redo = name.startsWith("redo-"),
        mirror = (part: number[][]) => part.map(([x, y]) => [redo ? 960 - x! : x!, y!]);
      const path = [bend, ...head].map(mirror),
        dot = name.endsWith("-dot") ? [mirror(fixtureCircle(480, 150, 35))] : [];
      expect(returnPathFeatures(name, [...path, ...dot]), name).toEqual([]);
      expect(openCircularArc(rounded)).not.toBeNull();
      expect(
        returnPathFeatures(name, [mirror(rounded), ...head.map(mirror), ...dot]),
        name + " connected rounded return bend",
      ).toEqual([]);
      const isolatedArc = rounded.map(([x, y]) => [x === 150 ? 580 : x!, y!]);
      expect(
        returnPathFeatures(name, [mirror(isolatedArc), ...head.map(mirror), ...dot]),
        name + " isolated rotation arc without a return arm",
      ).not.toEqual([]);
      expect(
        returnPathFeatures(
          name,
          [...path, ...dot].map((part) => [...part].reverse()),
        ),
        name + " inverse winding",
      ).toEqual([]);
      expect(returnPathFeatures(name, [path[0]!, ...dot]), name + " missing head").not.toEqual([]);
      expect(
        returnPathFeatures(name, [...path.slice(1), ...dot]),
        name + " missing bend",
      ).not.toEqual([]);
      expect(
        returnPathFeatures(name, [fixtureRod([150, 500], [715, 500]), ...path.slice(1), ...dot]),
        name + " straight replacement",
      ).not.toEqual([]);
      const reversed = path.map((part) => part.map(([x, y]) => [960 - x!, y!]));
      expect(
        returnPathFeatures(name, [...reversed, ...dot]),
        name + " wrong head direction",
      ).not.toEqual([]);
      expect(
        returnPathFeatures(name, [fixtureCircle(480, 320, 330), ...path.slice(1), ...dot]),
        name + " circular replacement",
      ).not.toEqual([]);
      if (dot.length) expect(returnPathFeatures(name, path), name + " missing dot").not.toEqual([]);
    }
  });

  it("checks every planar TC13 rotation/refresh path, actual head tangent and opposite-position pair", () => {
    /**
     * Constructs a true annular sector and two independently positioned head arms.
     * @param start - Beginning angle in font coordinates.
     * @param sweep - Nonzero angular extent.
     * @param clockwise - Whether the head points along a negative angular tangent.
     * @returns A real curved path and two genuine terminal head strokes.
     */
    function turn(start: number, sweep: number, clockwise: boolean): number[][][] {
      const angle = ((clockwise ? start : start + sweep) * Math.PI) / 180;
      const radial = [Math.cos(angle), Math.sin(angle)],
        sign = clockwise ? -1 : 1;
      const tangent = [-radial[1]! * sign, radial[0]! * sign],
        tip = [480 + 295 * radial[0]!, 320 + 295 * radial[1]!];
      return [
        fixtureArc(480, 320, 330, start, sweep),
        ...[-1, 1].map((side) =>
          fixtureRod(
            [
              tip[0]! - tangent[0]! * 120 + side * radial[0]! * 110,
              tip[1]! - tangent[1]! * 120 + side * radial[1]! * 110,
            ],
            tip,
          ),
        ),
      ];
    }
    const clock = [
      fixtureCircle(480, 320, 120),
      fixtureCircle(480, 320, 85).reverse(),
      fixtureRod([480, 320], [480, 405], 25),
      fixtureRod([480, 320], [545, 320], 25),
    ];
    const square = [
      fixtureRectangle(390, 230, 570, 410),
      fixtureRectangle(425, 265, 535, 375).reverse(),
    ];
    const key = [
      fixtureCircle(400, 320, 60),
      fixtureCircle(400, 320, 30).reverse(),
      fixtureRod([460, 320], [660, 320]).reverse(),
      fixtureRod([620, 320], [620, 230]).reverse(),
    ];
    const names = semanticDomains.TC13!.filter((name) =>
      /^(?:rotate-(?:ccw|cw)|refresh-)/u.test(name),
    );
    for (const name of names) {
      const clockwise = /(?:^|-)cw(?:-|$)/u.test(name),
        refresh = name.startsWith("refresh-");
      const subject = name.includes("clock")
        ? clock
        : name.endsWith("-key")
          ? key
          : name.endsWith("-square")
            ? square
            : name.endsWith("-dot")
              ? [fixtureCircle(480, 320, 35)]
              : [];
      const path = refresh
        ? [...turn(0, 120, clockwise), ...turn(180, 120, clockwise)]
        : turn(0, 180, clockwise);
      const complete = [...path, ...subject];
      expect(rotationFeatures(name, complete), name).toEqual([]);
      if (name.endsWith("-off")) {
        const slash = fixtureState("off")[0]!;
        expect(semanticFeatures(name, [...complete, slash]), name + " complete state").toEqual([]);
        expect(semanticFeatures(name, complete), name + " removed state").toContain("state off");
        expect(semanticFeatures(name, [slash]), name + " removed rotating subject").not.toEqual([]);
        const opposite = fixtureRod([80, -80], [880, 720]);
        expect(semanticFeatures(name, [...complete, opposite]), name + " wrong slash").toContain(
          "state off",
        );
      }
      expect(
        rotationFeatures(
          name,
          complete.map((part) => [...part].reverse()),
        ),
        name + " reverse winding",
      ).toEqual([]);
      const wrong = refresh
        ? [...turn(0, 120, !clockwise), ...turn(180, 120, !clockwise)]
        : turn(0, 180, !clockwise);
      expect(rotationFeatures(name, [...wrong, ...subject]), name + " wrong tangent").not.toEqual(
        [],
      );
      expect(
        rotationFeatures(name, [...path.filter((_part, index) => index % 3 !== 0), ...subject]),
        name + " missing arc",
      ).not.toEqual([]);
      expect(
        rotationFeatures(name, [...path.filter((_part, index) => index % 3 === 0), ...subject]),
        name + " missing heads",
      ).not.toEqual([]);
      if (refresh) {
        expect(
          rotationFeatures(name, [...turn(0, 120, clockwise), ...subject]),
          name + " missing opposite path",
        ).not.toEqual([]);
        expect(
          rotationFeatures(name, [
            ...turn(0, 120, clockwise),
            ...turn(20, 120, clockwise),
            ...subject,
          ]),
          name + " same-side paths",
        ).not.toEqual([]);
      }
      if (subject.length)
        expect(rotationFeatures(name, path), name + " missing embedded subject").not.toEqual([]);
      if (name.endsWith("-key"))
        for (const remove of [1, 2, 3])
          expect(
            rotationFeatures(name, [...path, ...key.filter((_part, index) => index !== remove)]),
            name + " missing key part " + remove,
          ).not.toEqual([]);
      expect(
        rotationFeatures(name, [
          fixtureCircle(480, 320, 330),
          fixtureCircle(480, 320, 260).reverse(),
          ...path.filter((_part, index) => index % 3 !== 0),
          ...subject,
        ]),
        name + " closed ring",
      ).not.toEqual([]);
    }
  });

  it("accepts layouts drawn as one counter plus real dividers, including partial merge/split boundaries", () => {
    const frame = [
        fixtureRectangle(100, -60, 860, 700),
        fixtureRectangle(170, 10, 790, 630).reverse(),
      ],
      horizontal = fixtureRod([170, 320], [790, 320]),
      vertical = fixtureRod([480, 10], [480, 630]);
    const plain = [...frame, horizontal, vertical];
    expect(gridLayoutFeatures("grid-2x2", plain)).toEqual([]);
    expect(layoutRegions(plain)).toHaveLength(4);
    expect(gridLayoutFeatures("grid-2x2", [...frame, horizontal])).not.toEqual([]);
    expect(gridLayoutFeatures("grid-2x2", [...frame, vertical])).not.toEqual([]);
    const triple = [
      ...frame,
      horizontal,
      fixtureRod([365, 10], [365, 630]),
      fixtureRod([595, 10], [595, 630]),
    ];
    expect(gridLayoutFeatures("grid-3x2", triple)).toEqual([]);
    expect(gridLayoutFeatures("grid-2x2", triple)).not.toEqual([]);
    const merge = [...frame, horizontal, fixtureRod([480, 320], [480, 630])],
      split = [...plain, fixtureRod([307.5, 10], [307.5, 320])];
    expect(layoutRegions(merge)).toHaveLength(3);
    expect(layoutRegions(split)).toHaveLength(5);
    expect(tableMutationFeatures(plain, merge, "merge")).toEqual([]);
    expect(tableMutationFeatures(plain, split, "split")).toEqual([]);
    expect(tableMutationFeatures(plain, plain, "merge")).not.toEqual([]);
    expect(tableMutationFeatures(plain, plain, "split")).not.toEqual([]);
    for (const token of ["check", "plus", "x"]) {
      const mark = fixtureState(token).map((part) =>
        part.map(([x, y]) => [307.5 + (x! - 480) * 0.6, 147.5 + (y! - 320) * 0.6]),
      );
      expect(gridLayoutFeatures("grid-2x2-" + token, [...plain, ...mark]), token).toEqual([]);
      expect(basicStateFeatures("grid-2x2-" + token, [...plain, ...mark]), token).toEqual([]);
      expect(basicStateFeatures("grid-2x2-" + token, plain), token).not.toEqual([]);
    }
  });

  it("preserves exact winding and line intersections when pruning nonintersecting edges", () => {
    const parts = [
      fixtureRectangle(100, -60, 860, 700),
      fixtureRectangle(170, 10, 790, 630).reverse(),
      fixtureRod([170, 320], [790, 320]),
      fixtureRod([480, 10], [480, 630]),
      fixtureCircle(280, 180, 45),
    ];
    /**
     * Keeps the original full-edge winding oracle independent of optimized row pruning.
     * @param x - Exact probe x coordinate.
     * @param y - Exact probe y coordinate.
     * @returns Original nonzero-winding foreground membership.
     */
    const originalInk = (x: number, y: number) => {
      let winding = 0;
      for (const part of parts)
        for (let index = 0; index < part.length - 1; index++) {
          const a = part[index]!,
            b = part[index + 1]!,
            cross = (b[0]! - a[0]!) * (y - a[1]!) - (x - a[0]!) * (b[1]! - a[1]!);
          if (a[1]! <= y && b[1]! > y && cross > 0) winding++;
          if (a[1]! > y && b[1]! <= y && cross < 0) winding--;
        }
      return winding !== 0;
    };
    for (const x of [100, 135, 170, 245, 280, 315, 445, 480, 515, 790, 825, 860])
      for (const y of [-60, 0, 10, 135, 180, 225, 285, 320, 355, 630, 700])
        expect(sourceInk(parts, x, y)).toBe(originalInk(x, y));
    for (let step = 0; step < 32; step++) {
      const start = [70 + step * 25, -80 + step * 7],
        end = [880 - step * 13, 720 - step * 11],
        dx = end[0]! - start[0]!,
        dy = end[1]! - start[1]!,
        cuts = [0, 1];
      for (const part of parts)
        for (let index = 0; index < part.length - 1; index++) {
          const a = part[index]!,
            b = part[index + 1]!,
            ex = b[0]! - a[0]!,
            ey = b[1]! - a[1]!,
            denominator = dx * ey - dy * ex;
          if (Math.abs(denominator) < 1e-9) continue;
          const ax = a[0]! - start[0]!,
            ay = a[1]! - start[1]!,
            position = (ax * ey - ay * ex) / denominator,
            edge = (ax * dy - ay * dx) / denominator;
          if (position > 0 && position < 1 && edge >= -1e-9 && edge <= 1 + 1e-9)
            cuts.push(position);
        }
      cuts.sort((a, b) => a - b);
      expect(lineCuts(parts, start, end)).toEqual(cuts);
    }
  });

  it("recognizes anchored narrow split cells without accepting a floating state rod", () => {
    const frame = [
        fixtureRectangle(100, -60, 860, 700),
        fixtureRectangle(170, 10, 790, 630).reverse(),
      ],
      plain = [...frame, fixtureRod([170, 320], [790, 320]), fixtureRod([480, 10], [480, 630])],
      split = [...plain, fixtureRod([270, 10], [270, 320])],
      floating = [...plain, fixtureRod([270, 70], [270, 270])];
    expect(layoutRegions(plain)).toHaveLength(4);
    expect(layoutRegions(split)).toHaveLength(4);
    expect(tableMutationFeatures(plain, split, "split")).toEqual([]);
    expect(tableMutationFeatures(split, plain, "merge")).toEqual([]);
    expect(tableMutationFeatures(plain, floating, "split")).toContain(
      "added split-cell internal edge",
    );
    expect(tableMutationFeatures(plain, split, "merge")).not.toEqual([]);
    expect(tableMutationFeatures(split, plain, "split")).not.toEqual([]);
  });

  it("checks every TC09 alignment anchor, axis, baseline and exact distribution/spacing rule", () => {
    /**
     * Draws unequal object dimensions and reference guides using independent coordinate formulas.
     * @param name - Required closed alignment identity.
     * @returns Separate original objects and reference guides.
     */
    function align(name: string): {
      objects: number[][][];
      guides: number[][][];
    } {
      const horizontal = name.includes("horizontal"),
        tokens = name.split("-"),
        anchor = tokens.find((token) => ["start", "end", "center"].includes(token)) ?? "center",
        lengths = [100, 220, 160];
      if (tokens.includes("distribute"))
        return {
          objects: lengths.map((length, index) => {
            const position = (horizontal ? [210, 460, 710] : [600, 350, 100])[index]!;
            const low = horizontal
              ? anchor === "start"
                ? position
                : anchor === "end"
                  ? position - length
                  : position - length / 2
              : anchor === "start"
                ? position - length
                : anchor === "end"
                  ? position
                  : position - length / 2;
            return horizontal
              ? fixtureRectangle(low, 250, low + length, 390)
              : fixtureRectangle(410, low, 550, low + length);
          }),
          guides: [],
        };
      if (tokens.includes("space")) {
        const lower = horizontal ? 100 : -60,
          upper = horizontal ? 860 : 700,
          gap =
            (upper - lower - lengths.reduce((sum, length) => sum + length, 0)) /
            (tokens.includes("around") ? 3 : 2);
        let position = lower + (tokens.includes("around") ? gap / 2 : 0);
        const objects = lengths.map((length) => {
          const shape = horizontal
            ? fixtureRectangle(position, 250, position + length, 390)
            : fixtureRectangle(410, position, 550, position + length);
          position += length + gap;
          return shape;
        });
        return {
          objects,
          guides: horizontal
            ? [fixtureRod([lower, -60], [lower, 700]), fixtureRod([upper, -60], [upper, 700])]
            : [fixtureRod([100, lower], [860, lower]), fixtureRod([100, upper], [860, upper])],
        };
      }
      const baseline = horizontal
        ? anchor === "start"
          ? 100
          : anchor === "end"
            ? 860
            : 480
        : anchor === "start"
          ? 700
          : anchor === "end"
            ? -60
            : 320;
      const target = horizontal
        ? anchor === "start"
          ? 230
          : anchor === "end"
            ? 730
            : 480
        : anchor === "start"
          ? 560
          : anchor === "end"
            ? 80
            : 320;
      return {
        objects: lengths.map((length, index) => {
          const lower = horizontal
            ? anchor === "start"
              ? target
              : anchor === "end"
                ? target - length
                : target - length / 2
            : anchor === "start"
              ? target - length
              : anchor === "end"
                ? target
                : target - length / 2;
          return horizontal
            ? fixtureRectangle(
                lower,
                [140, 320, 500][index]! - 70,
                lower + length,
                [140, 320, 500][index]! + 70,
              )
            : fixtureRectangle(
                [220, 480, 740][index]! - 70,
                lower,
                [220, 480, 740][index]! + 70,
                lower + length,
              );
        }),
        guides: [
          horizontal
            ? fixtureRod([baseline, -60], [baseline, 700])
            : fixtureRod([100, baseline], [860, baseline]),
        ],
      };
    }
    for (const name of semanticDomains.TC09!.filter((identity) => identity.startsWith("align-"))) {
      const { objects, guides } = align(name),
        complete = [...objects, ...guides];
      expect(alignmentFeatures(name, complete), name).toEqual([]);
      expect(
        alignmentFeatures(name, [
          ...objects.slice(0, name.includes("distribute") || name.includes("space") ? 2 : 1),
          ...guides,
        ]),
        name,
      ).toContain("alignment object count");
      const wrongAxis = complete.map((part) =>
        part.map(([x, y]) => [480 + y! - 320, 320 - (x! - 480)]),
      );
      expect(alignmentFeatures(name, wrongAxis), name + " wrong axis").not.toEqual([]);
      const moved = objects.map((part, index) =>
        part.map(([x, y]) =>
          name.includes("horizontal")
            ? [x! + (index === 1 ? 35 : 0), y!]
            : [x!, y! + (index === 1 ? 35 : 0)],
        ),
      );
      expect(
        alignmentFeatures(name, [...moved, ...guides]),
        name + " changed anchor/spacing",
      ).not.toEqual([]);
      if (guides.length)
        expect(alignmentFeatures(name, objects), name + " missing reference").not.toEqual([]);
      if (name.includes("distribute")) {
        const crossAxis = objects.map((part, index) =>
          part.map(([x, y]) =>
            name.includes("horizontal") ? [x!, y! + index * 40] : [x! + index * 40, y!],
          ),
        );
        expect(alignmentFeatures(name, crossAxis), name).toContain(
          "objects on the same named axis",
        );
        const otherAnchor = name.replace(
          /(?:center|start|end)$/u,
          name.endsWith("center") ? "start" : "center",
        );
        expect(alignmentFeatures(otherAnchor, objects), name + " wrong anchor").toContain(
          "equal named-axis anchor spacing",
        );
      }
      if (name.includes("space")) {
        const otherSpace = name.replace(
          /(?:around|between)$/u,
          name.endsWith("around") ? "between" : "around",
        );
        expect(alignmentFeatures(otherSpace, complete), name).toContain(
          "equal around/between spaces",
        );
      }
    }
  });

  it("checks TC09 table matrices, removed/added internal edges and exact row/column split axes", () => {
    const frame = fixtureRectangle(100, -60, 860, 700);
    const holes = [
      fixtureRectangle(135, -25, 445, 285),
      fixtureRectangle(515, -25, 825, 285),
      fixtureRectangle(135, 355, 445, 665),
      fixtureRectangle(515, 355, 825, 665),
    ].map((part) => part.reverse());
    const plain = [frame, ...holes],
      merge = [frame, fixtureRectangle(135, -25, 825, 285).reverse(), ...holes.slice(2)],
      split = [
        frame,
        fixtureRectangle(135, -25, 255, 285).reverse(),
        fixtureRectangle(325, -25, 445, 285).reverse(),
        ...holes.slice(1),
      ];
    const rows = [
      fixtureRectangle(100, -60, 860, 285),
      fixtureRectangle(100, 355, 860, 700),
      ...[
        fixtureRectangle(135, -25, 445, 250),
        fixtureRectangle(515, -25, 825, 250),
        fixtureRectangle(135, 390, 445, 665),
        fixtureRectangle(515, 390, 825, 665),
      ].map((part) => part.reverse()),
    ];
    const columns = [
      fixtureRectangle(100, -60, 445, 700),
      fixtureRectangle(515, -60, 860, 700),
      ...[
        fixtureRectangle(135, -25, 410, 285),
        fixtureRectangle(135, 355, 410, 665),
        fixtureRectangle(550, -25, 825, 285),
        fixtureRectangle(550, 355, 825, 665),
      ].map((part) => part.reverse()),
    ];
    const both = [
      [100, -60],
      [515, -60],
      [100, 355],
      [515, 355],
    ].flatMap(([x, y]) => [
      fixtureRectangle(x!, y!, x! + 345, y! + 345),
      fixtureRectangle(x! + 35, y! + 35, x! + 310, y! + 310).reverse(),
    ]);
    const samples: Record<string, number[][][]> = {
      table: plain,
      "table-properties": plain,
      "table-cells-merge": merge,
      "table-cells-split": split,
      "table-rows-split": rows,
      "table-columns-split": columns,
      "table-split": both,
    };
    expect(Object.keys(samples).sort()).toEqual(
      semanticDomains
        .TC09!.filter((name) => /^table(?:-|$)/u.test(name) && name !== "table-of-contents")
        .sort(),
    );
    for (const [name, shape] of Object.entries(samples)) {
      expect(tableFeatures(name, shape), name).toEqual([]);
      expect(tableFeatures(name, []), name).toContain("at least two table rows and columns");
      if (name.includes("rows-split"))
        expect(tableFeatures(name, columns), name).toContain("table horizontal separating gap");
      if (name.includes("columns-split"))
        expect(tableFeatures(name, rows), name).toContain("table vertical separating gap");
      if (name === "table-split") {
        expect(tableFeatures(name, rows), name).toContain("table vertical separating gap");
        expect(tableFeatures(name, columns), name).toContain("table horizontal separating gap");
      }
    }
    expect(tableMutationFeatures(plain, merge, "merge")).toEqual([]);
    expect(tableMutationFeatures(plain, split, "split")).toEqual([]);
    expect(tableMutationFeatures(plain, plain, "merge")).toContain(
      "removed merged-cell internal edge",
    );
    expect(tableMutationFeatures(plain, plain, "split")).toContain(
      "added split-cell internal edge",
    );
    expect(tableMutationFeatures(plain, split, "merge")).not.toEqual([]);
    expect(tableMutationFeatures(plain, merge, "split")).not.toEqual([]);
    for (const name of ["table-rows-split", "table-columns-split", "table-split"])
      expect(tableFeatures(name, plain), name).not.toEqual([]);
    const oneColumn = [
      frame,
      fixtureRectangle(135, -25, 825, 285).reverse(),
      fixtureRectangle(135, 355, 825, 665).reverse(),
    ];
    expect(tableFeatures("table", oneColumn)).not.toEqual([]);
    expect(tableFeatures("table", [frame, ...holes.slice(0, 2)])).not.toEqual([]);
  });

  it("rejects holes and isolated midpoint ink in otherwise aligned symbol midlines", () => {
    const left = fixtureRod([100, 320], [300, 320]),
      right = fixtureRod([380, 320], [860, 320]),
      solid = fixtureRod([100, 320], [860, 320]);
    /**
     * Checks whether the recovered rod continuously spans the fixture's full centerline.
     * @param parts - Independent fixture contours, including any holes or disconnected ink.
     * @returns Whether an actual continuous rod spans the full fixture centerline.
     */
    const spansWholeLine = (parts: number[][][]) =>
      symbolRods(parts).some(
        (rod) => Math.hypot(rod.b[0]! - rod.a[0]!, rod.b[1]! - rod.a[1]!) >= 759,
      );
    expect(spansWholeLine([solid])).toBe(true);
    expect(spansWholeLine([left, right, fixtureRod([300, 320], [380, 320])])).toBe(true);
    expect(spansWholeLine([solid, fixtureRectangle(435, 290, 455, 350).reverse()])).toBe(false);
    expect(spansWholeLine([left, right, fixtureCircle(340, 320, 20)])).toBe(false);
  });

  it("checks every TC09 list carrier and its ordered, check, tree, sort and indentation distinctions", () => {
    const rows = [620, 320, 20].map((y) => fixtureRod([440, y], [840, y]));
    /**
     * Draws three independent digit profiles rather than using any installed font or release path.
     * @param value - Literal ordered-list label.
     * @param y - Row center.
     * @returns Original numeric fixture polygons, with separate profile-defining strokes.
     */
    function digit(value: number, y: number): number[][][] {
      const x = 290;
      if (value === 1) return [fixtureRectangle(x - 20, y - 100, x + 20, y + 100)];
      return [
        fixtureRectangle(x - 70, y + 70, x + 70, y + 110),
        fixtureRectangle(x - 70, y - 20, x + 70, y + 20),
        fixtureRectangle(x - 70, y - 110, x + 70, y - 70),
        fixtureRectangle(x + 30, y, x + 70, y + 90),
        value === 2
          ? fixtureRectangle(x - 70, y - 90, x - 30, y)
          : fixtureRectangle(x + 30, y - 90, x + 70, y),
      ];
    }
    /**
     * Places an independently drawn check to the left of one actual text row.
     * @param y - Row center.
     * @returns Original check polygons, distinct from row ink.
     */
    function check(y: number): number[][][] {
      return fixtureState("check").map((part) =>
        part.map(([x, pointY]) => [240 + (x! - 480) * 0.6, y + (pointY! - 320) * 0.6]),
      );
    }
    /**
     * Constructs a literal cardinal action arrow in the separate list marker column.
     * @param key - Expected sort or indentation direction.
     * @returns Original closed arrow polygon.
     */
    function arrow(key: string): number[][] {
      const [dx, dy] = directions[key]!,
        shape = [
          [0, 250],
          [-220, 20],
          [-40, 20],
          [-40, -250],
          [40, -250],
          [40, 20],
          [220, 20],
          [0, 250],
        ];
      return shape.map(([x, y]) => [
        260 + (x! * dy + y! * dx) * 0.5,
        320 + (-x! * dx + y! * dy) * 0.5,
      ]);
    }
    const treeRows = [
        fixtureRod([200, 620], [840, 620]),
        fixtureRod([450, 320], [840, 320]),
        fixtureRod([450, 20], [840, 20]),
      ],
      stem = fixtureRod([350, 20], [350, 620]),
      branches = [fixtureRod([350, 320], [450, 320]), fixtureRod([350, 20], [450, 20])];
    for (const name of semanticDomains.TC09!.filter(
      (identity) =>
        /^list(?:-|$)/u.test(identity) ||
        identity === "layout-list" ||
        identity === "table-of-contents",
    )) {
      const base = name === "list-tree" ? [...treeRows, stem, ...branches] : [...rows];
      const label =
        name === "list-ordered"
          ? [620, 320, 20].flatMap((y, index) => digit(index + 1, y))
          : name === "list-check"
            ? check(620)
            : name === "list-checks"
              ? [620, 320, 20].flatMap(check)
              : [];
      const direction =
        name === "list-sort-ascending"
          ? "up"
          : name === "list-sort-descending"
            ? "down"
            : name === "list-indent-increase"
              ? "right"
              : name === "list-indent-decrease"
                ? "left"
                : null;
      const complete = [...base, ...label, ...(direction ? [arrow(direction)] : [])];
      expect(listFeatures(name, complete), name).toEqual([]);
      expect(listFeatures(name, rows.slice(0, 2)), name).toContain(
        "at least three horizontal list rows",
      );
      if (label.length || direction || name === "list-tree")
        expect(listFeatures(name, rows), name + " missing distinction").not.toEqual([]);
      if (direction) {
        const opposite = {
          up: "down",
          down: "up",
          left: "right",
          right: "left",
        }[direction];
        expect(listFeatures(name, [...rows, arrow(opposite)]), name).toContain(
          "list action arrow " + direction,
        );
      }
    }
    expect(
      listFeatures("list-ordered", [...rows, ...digit(1, 620), ...digit(3, 320), ...digit(2, 20)]),
    ).toEqual(["ordered list digit 2", "ordered list digit 3"]);
    expect(listFeatures("list-ordered", [...rows, ...digit(1, 620), ...digit(2, 320)])).toContain(
      "ordered list digit 3",
    );
    expect(listFeatures("list-checks", [...rows, ...check(620)])).toContain("list check markers");
    const wrongCheck = fixtureState("x").map((part) =>
      part.map(([x, y]) => [240 + (x! - 480) * 0.6, 620 + (y! - 320) * 0.6]),
    );
    expect(listFeatures("list-check", [...rows, ...wrongCheck])).toContain("list check markers");
    expect(listFeatures("list-tree", [...treeRows, ...branches])).toContain(
      "indented parent/child rows with a connecting branch",
    );
    expect(listFeatures("list-tree", [...treeRows, stem])).toContain(
      "indented parent/child rows with a connecting branch",
    );
    const fractionalStem = stem.map(([x, y]) => [x! - 1e-8, y!]),
      disconnectedBranches = branches.map((part) => part.map(([x, y]) => [x! + 100, y!]));
    expect(listFeatures("list-tree", [...treeRows, fractionalStem, ...branches])).toEqual([]);
    expect(listFeatures("list-tree", [...treeRows, stem, ...disconnectedBranches])).toContain(
      "indented parent/child rows with a connecting branch",
    );
    for (const token of ["plus", "minus", "x"]) {
      const mark = fixtureState(token).map((part) =>
        part.map(([x, y]) => [260 + (x! - 480) * 0.7, 320 + (y! - 320) * 0.7]),
      );
      expect(basicStateFeatures("list-" + token, [...rows, ...mark]), token).toEqual([]);
      expect(basicStateFeatures("list-" + token, rows), token).toContain("state " + token);
    }
  });

  it("checks every TC09 panel side, separator and open/close arrow with wrong-side and dash negatives", () => {
    const frame = [
      fixtureRectangle(100, -60, 860, 700),
      fixtureRectangle(170, 10, 790, 630).reverse(),
    ];
    /**
     * Draws a prescribed panel divider independently of actual glyphs.
     * @param side - Required panel side.
     * @param dashed - Whether to preserve real gaps.
     * @returns One continuous rod or four separated rods along the requested axis.
     */
    function separator(side: string, dashed: boolean): number[][][] {
      const vertical = side === "left" || side === "right",
        position = { left: 330, right: 630, top: 550, bottom: 90 }[
          side as "left" | "right" | "top" | "bottom"
        ];
      const spans = dashed
        ? [
            [10, 120],
            [180, 290],
            [350, 460],
            [520, 630],
          ]
        : [[10, 630]];
      return spans.map(([a, b]) =>
        vertical
          ? fixtureRod([position, a!], [position, b!])
          : fixtureRod([a! + 160, position], [b! + 160, position]),
      );
    }
    /**
     * Rotates an independently drawn arrow to one prescribed font-coordinate direction.
     * @param key - Cardinal direction.
     * @returns A closed arrow around the optical center, with no production path input.
     */
    function arrow(key: string): number[][] {
      const [dx, dy] = directions[key]!,
        shape = [
          [0, 250],
          [-220, 20],
          [-40, 20],
          [-40, -250],
          [40, -250],
          [40, 20],
          [220, 20],
          [0, 250],
        ];
      return shape.map(([x, y]) => [
        480 + (x! * dy + y! * dx) * 0.45,
        320 + (-x! * dx + y! * dy) * 0.45,
      ]);
    }
    const opposite: Record<string, string> = {
        left: "right",
        right: "left",
        top: "bottom",
        bottom: "top",
        up: "down",
        down: "up",
      },
      directionsBySide: Record<string, string> = {
        left: "left",
        right: "right",
        top: "up",
        bottom: "down",
      };
    for (const name of semanticDomains.TC09!.filter((identity) =>
      /^(?:panel-|layout-panel-)/u.test(identity),
    )) {
      const sides = name
          .split("-")
          .filter((token) => ["left", "right", "top", "bottom"].includes(token)),
        dashed = name.includes("dashed"),
        mark = /-(?:open|close)$/u.test(name) ? directionsBySide[sides[0]!]! : null;
      const key = mark && name.endsWith("open") ? opposite[mark]! : mark;
      const dividers = sides.flatMap((side) => separator(side, dashed)),
        complete = [...frame, ...dividers, ...(key ? [arrow(key)] : [])];
      expect(panelFeatures(name, complete), name).toEqual([]);
      expect(panelFeatures(name, [...frame, ...(key ? [arrow(key)] : [])]), name).not.toEqual([]);
      expect(panelFeatures(name, [...dividers, ...(key ? [arrow(key)] : [])]), name).toContain(
        "panel outer frame",
      );
      if (sides.length === 1)
        expect(
          panelFeatures(name, [
            ...frame,
            ...separator(opposite[sides[0]!]!, dashed),
            ...(key ? [arrow(key)] : []),
          ]),
          name,
        ).not.toEqual([]);
      else
        for (const side of sides)
          expect(panelFeatures(name, [...frame, ...separator(side, dashed)]), name).not.toEqual([]);
      if (dashed)
        expect(
          panelFeatures(name, [...frame, ...sides.flatMap((side) => separator(side, false))]),
          name,
        ).not.toEqual([]);
      if (key) {
        expect(panelFeatures(name, [...frame, ...dividers]), name).toContain("panel arrow " + key);
        expect(panelFeatures(name, [...frame, ...dividers, arrow(opposite[key]!)]), name).toContain(
          "panel arrow " + key,
        );
      }
    }
  });

  it("checks TC13 simple loaders, overlapping copies and open chain-link holes from original fixtures", () => {
    for (const name of ["loader", "loading"]) {
      const arc = fixtureArc(480, 320, 350, 35, 285);
      expect(simpleConnectionFeatures(name, [arc]), name).toEqual([]);
      expect(
        simpleConnectionFeatures(name, [
          fixtureCircle(480, 320, 350),
          fixtureCircle(480, 320, 280).reverse(),
        ]),
        name,
      ).toContain("open circular loading arc");
      expect(simpleConnectionFeatures(name, [fixtureRod([130, 320], [830, 320])]), name).toContain(
        "open circular loading arc",
      );
      for (const start of [0, 1, 100, 500, arc.length - 2]) {
        const unique = arc.slice(0, -1),
          rotated = [...unique.slice(start), ...unique.slice(0, start)];
        rotated.push(rotated[0]!);
        expect(simpleConnectionFeatures(name, [rotated]), name + start).toEqual([]);
      }
      expect(simpleConnectionFeatures(name, [[...arc].reverse()]), name).toEqual([]);
      const rounded = arc.slice(0, 571);
      for (const [angle, start] of [
        [320, 320],
        [35, 215],
      ]) {
        const x = 480 + 315 * Math.cos((angle! * Math.PI) / 180),
          y = 320 + 315 * Math.sin((angle! * Math.PI) / 180);
        const cap = Array.from({ length: 361 }, (_, step) => [
          x + 35 * Math.cos(((start! + step / 2) * Math.PI) / 180),
          y + 35 * Math.sin(((start! + step / 2) * Math.PI) / 180),
        ]);
        rounded.push(...cap);
        if (angle === 320) rounded.push(...arc.slice(571, -1));
      }
      rounded.push(rounded[0]!);
      expect(simpleConnectionFeatures(name, [rounded]), name + " rounded caps").toEqual([]);
    }
    const blade = [
      [480, 320],
      [780, 320],
      [720, 500],
      [540, 530],
      [480, 320],
    ];
    const blades = [0, 120, 240].map((degrees) =>
      blade.map(([x, y]) => {
        const angle = (degrees * Math.PI) / 180;
        return [
          480 + (x! - 480) * Math.cos(angle) - (y! - 320) * Math.sin(angle),
          320 + (x! - 480) * Math.sin(angle) + (y! - 320) * Math.cos(angle),
        ];
      }),
    );
    expect(simpleConnectionFeatures("loader-pinwheel", blades)).toEqual([]);
    expect(simpleConnectionFeatures("loader-pinwheel", blades.slice(0, 2))).toEqual([]);
    expect(simpleConnectionFeatures("loader-pinwheel", blades.slice(0, 1))).not.toEqual([]);
    expect(simpleConnectionFeatures("loader-pinwheel", [blade, blade])).not.toEqual([]);
    const firstCopy = fixtureRectangle(90, 90, 690, 690),
      secondCopy = fixtureRectangle(270, -90, 870, 510);
    for (const name of semanticDomains.TC13!.filter((identity) => /^copy(?:-|$)/u.test(identity))) {
      expect(simpleConnectionFeatures(name, [firstCopy, secondCopy]), name).toEqual([]);
      const token = name.split("-").find((part) => ["check", "minus", "plus", "x"].includes(part));
      if (token) {
        const carrier = [
          firstCopy,
          fixtureRectangle(160, 160, 620, 620).reverse(),
          secondCopy,
          fixtureRectangle(340, -20, 800, 440).reverse(),
        ];
        const marker = fixtureState(token).map((part) =>
          part.map(([x, y]) => [510 + (x! - 480) * 0.5, 260 + (y! - 320) * 0.5]),
        );
        expect(semanticFeatures(name, [...carrier, ...marker]), name + " composite").toEqual([]);
        expect(semanticFeatures(name, carrier), name + " removed state").toContain(
          "state " + token,
        );
        expect(semanticFeatures(name, marker), name + " removed copies").not.toEqual([]);
      }
      expect(simpleConnectionFeatures(name, [firstCopy]), name).toContain(
        "two overlapping copy objects",
      );
      expect(simpleConnectionFeatures(name, [firstCopy, firstCopy]), name).toContain(
        "two overlapping copy objects",
      );
      expect(
        simpleConnectionFeatures(name, [firstCopy, fixtureRectangle(200, 170, 620, 600).reverse()]),
        name,
      ).toContain("two overlapping copy objects");
      const separate = secondCopy.map(([x, y]) => [x! + 900, y!]);
      expect(simpleConnectionFeatures(name, [firstCopy, separate]), name).toContain(
        "two overlapping copy objects",
      );
    }
    /**
     * Draws an original capsule loop from independent semicircle centers and opposing counters.
     * @param x - Loop center x.
     * @param y - Loop center y.
     * @param radius - Cap radius.
     * @returns Closed capsule polygon with a one-hundred-eighty-unit straight middle.
     */
    function capsule(x: number, y: number, radius: number): number[][] {
      const points = Array.from({ length: 361 }, (_, index) => [
        x + 90 + radius * Math.cos(((-90 + index / 2) * Math.PI) / 180),
        y + radius * Math.sin(((-90 + index / 2) * Math.PI) / 180),
      ]);
      points.push(
        ...Array.from({ length: 361 }, (_, index) => [
          x - 90 + radius * Math.cos(((90 + index / 2) * Math.PI) / 180),
          y + radius * Math.sin(((90 + index / 2) * Math.PI) / 180),
        ]),
        points[0]!,
      );
      return points;
    }
    const chain = [
      capsule(330, 320, 110),
      capsule(330, 320, 40).reverse(),
      capsule(630, 320, 110),
      capsule(630, 320, 40).reverse(),
    ];
    for (const name of ["link", "link-horizontal", "link-horizontal-off"]) {
      expect(simpleConnectionFeatures(name, chain), name).toEqual([]);
      if (name.endsWith("-off")) {
        const slash = fixtureState("off")[0]!;
        expect(semanticFeatures(name, [...chain, slash]), name + " complete state").toEqual([]);
        expect(semanticFeatures(name, chain), name + " removed state").toContain("state off");
        expect(semanticFeatures(name, [slash]), name + " removed chain").not.toEqual([]);
        expect(
          semanticFeatures(name, [...chain, fixtureRod([80, -80], [880, 720])]),
          name + " wrong slash",
        ).toContain("state off");
      }
      expect(simpleConnectionFeatures(name, chain.slice(0, 2)), name).not.toEqual([]);
      expect(
        simpleConnectionFeatures(
          name,
          chain.filter((_part, index) => index !== 1),
        ),
        name,
      ).not.toEqual([]);
      expect(
        simpleConnectionFeatures(
          name,
          chain.filter((_part, index) => index !== 0),
        ),
        name,
      ).not.toEqual([]);
      expect(simpleConnectionFeatures(name, [...chain, capsule(330, 320, 45)]), name).not.toEqual(
        [],
      );
    }
    const diagonal = chain.map((part) =>
      part.map(([x, y]) => [
        480 + (x! - 480 - (y! - 320)) / Math.sqrt(2),
        320 + (x! - 480 + (y! - 320)) / Math.sqrt(2),
      ]),
    );
    expect(simpleConnectionFeatures("link", diagonal)).toEqual([]);
    expect(simpleConnectionFeatures("link-horizontal", diagonal)).toContain(
      "horizontal chain-link axis",
    );
  });

  it("checks TC09 explicit grid/column counts in disconnected and connected layouts without relabeling", () => {
    /**
     * Constructs separate original tiles or real counters inside one connected outer grid.
     * @param columns - Exact column count.
     * @param rows - Exact row count.
     * @param connected - Whether the grid is a connected frame with counters.
     * @returns Independently calculated cell geometry.
     */
    function grid(columns: number, rows: number, connected = false): number[][][] {
      const width = 760 / columns,
        height = 760 / rows;
      const cells = Array.from({ length: columns * rows }, (_, index) => {
        const x = 100 + (index % columns) * width,
          y = -60 + Math.floor(index / columns) * height;
        const cell = fixtureRectangle(x + 35, y + 35, x + width - 35, y + height - 35);
        return connected ? cell.reverse() : cell;
      });
      return connected ? [fixtureRectangle(100, -60, 860, 700), ...cells] : cells;
    }
    for (const name of [
      "grid",
      "grid-2x2",
      "grid-2x2-check",
      "grid-2x2-plus",
      "grid-2x2-x",
      "grid-3x2",
      "layout-grid",
      "columns",
      "columns-4",
      "columns-settings",
    ]) {
      const columns = name === "columns-4" ? 4 : name === "grid-3x2" ? 3 : 2,
        rows = name.startsWith("columns") ? 1 : 2;
      for (const connected of [false, true]) {
        const correct = grid(columns, rows, connected);
        expect(gridLayoutFeatures(name, correct), name + connected).toEqual([]);
        const token = name.split("-").find((part) => ["check", "plus", "x"].includes(part));
        if (token) {
          const mark = fixtureState(token).map((part) => {
            const shifted = part.map(([x, y]) => [
              290 + (x! - 480) * 0.65,
              130 + (y! - 320) * 0.65,
            ]);
            return connected ? shifted : shifted.reverse();
          });
          expect(gridLayoutFeatures(name, [...correct, ...mark]), name + " state carrier").toEqual(
            [],
          );
          expect(basicStateFeatures(name, [...correct, ...mark]), name + " visible state").toEqual(
            [],
          );
          expect(basicStateFeatures(name, correct), name + " removed state").toContain(
            "state " + token,
          );
          expect(gridLayoutFeatures(name, mark), name + " removed carrier").not.toEqual([]);
        }
        const exact = name.startsWith("columns") || /^grid-[23]x2(?:-|$)/u.test(name);
        expect(
          gridLayoutFeatures(name, grid(columns, exact ? rows + 1 : 1, connected)),
          name,
        ).not.toEqual([]);
        expect(
          gridLayoutFeatures(name, grid(exact ? columns + 1 : 1, rows, connected)),
          name,
        ).not.toEqual([]);
        if (!exact) expect(gridLayoutFeatures(name, grid(3, 2, connected)), name).toEqual([]);
        expect(gridLayoutFeatures(name, correct.slice(0, -1)), name).not.toEqual([]);
      }
    }
    const freeform = [
      fixtureRectangle(190, 60, 390, 560),
      fixtureRectangle(460, 440, 760, 610),
      fixtureRectangle(490, 30, 770, 190),
    ];
    const frame = [
      fixtureRectangle(100, -60, 860, 700),
      fixtureRectangle(170, 10, 790, 630).reverse(),
    ];
    expect(gridLayoutFeatures("layout-freeform", [...frame, ...freeform])).toEqual([]);
    expect(gridLayoutFeatures("layout-freeform", freeform)).not.toEqual([]);
    expect(gridLayoutFeatures("layout-freeform", [...frame, ...freeform.slice(0, 2)])).not.toEqual(
      [],
    );
    expect(gridLayoutFeatures("layout-freeform", grid(2, 2))).not.toEqual([]);
    expect(gridLayoutFeatures("grid-3x2", grid(2, 3))).toContain(
      "exact layout row/column structure",
    );
    const uneven = grid(2, 2);
    uneven[0] = fixtureRectangle(135, -25, 400, 255);
    expect(gridLayoutFeatures("grid-2x2", uneven)).not.toEqual([]);
  });

  it("checks every TC04 state/carrier pair and rejects removed, substituted and hidden marks", () => {
    const errors: { name: string; sample: string; failures: string[] }[] = [];
    for (const name of semanticDomains.TC04!) {
      const token = name
          .split("-")
          .find((part) =>
            ["check", "x", "plus", "minus", "off", "alert", "help", "lock"].includes(part),
          )!,
        carrier = fixtureStateCarrier(name),
        mark = fixtureState(token),
        complete = [...carrier, ...mark];
      const positive = semanticFeatures(name, complete);
      if (positive.length) errors.push({ name, sample: "positive", failures: positive });
      const removed = basicStateFeatures(name, carrier);
      if (!removed.includes("state " + token))
        errors.push({ name, sample: "removed mark", failures: removed });
      const wrong = fixtureState(
        token === "plus" ? "minus" : token === "minus" ? "plus" : token === "x" ? "off" : "x",
      );
      const swapped = basicStateFeatures(name, [...carrier, ...wrong]);
      if (!swapped.length) errors.push({ name, sample: "wrong mark", failures: swapped });
      const unframed = semanticFeatures(name, mark);
      if (!unframed.length) errors.push({ name, sample: "removed carrier", failures: unframed });
    }
    expect(errors).toEqual([]);
    for (const token of ["check", "x", "plus", "minus", "alert", "help", "lock"]) {
      const mark = fixtureState(token),
        full = [fixtureCircle(480, 320, 350)];
      expect(basicStateFeatures("circle-" + token, [...full, ...mark]), token).toContain(
        "visible state boundary",
      );
      expect(
        basicStateFeatures("circle-" + token, [
          ...full,
          ...mark.map((part) => [...part].reverse()),
        ]),
        token,
      ).toEqual([]);
    }
    for (const token of ["help", "lock"]) {
      const mark = fixtureState(token);
      for (let index = 0; index < mark.length; index++)
        expect(
          basicStateFeatures("circle-" + token, [
            ...fixtureStateCarrier("circle"),
            ...mark.filter((_part, i) => i !== index),
          ]),
          token + index,
        ).not.toEqual([]);
    }
    expect(curvedState("lock", fixtureState("unlock"))).toBe(false);
    expect(curvedState("unlock", fixtureState("unlock"))).toBe(true);
    expect(curvedState("unlock", fixtureState("lock"))).toBe(false);
    const documentFold = fixtureRectangle(560, 470, 810, 720);
    const lock = fixtureState("lock");
    expect(curvedState("lock", [documentFold, ...lock])).toBe(true);
    expect(curvedState("lock", [documentFold, lock[0]!])).toBe(false);
    expect(curvedState("lock", [documentFold, lock[1]!])).toBe(false);
    expect(curvedState("lock", [documentFold, ...fixtureState("unlock")])).toBe(false);
  });

  it("accepts merged plus/x strokes and rejects disconnected, mirrored and incomplete states", () => {
    const unionPlus = [
      [330, 285],
      [445, 285],
      [445, 170],
      [515, 170],
      [515, 285],
      [630, 285],
      [630, 355],
      [515, 355],
      [515, 470],
      [445, 470],
      [445, 355],
      [330, 355],
      [330, 285],
    ];
    const frame = fixtureStateCarrier("circle");
    const unionX = unionPlus.map(([x, y]) => [
      480 + (x! - 480 - (y! - 320)) / Math.sqrt(2),
      320 + (x! - 480 + (y! - 320)) / Math.sqrt(2),
    ]);
    expect(basicStateFeatures("circle-plus", [...frame, unionPlus])).toEqual([]);
    expect(basicStateFeatures("circle-x", [...frame, unionX])).toEqual([]);
    expect(basicStateFeatures("circle-minus", [...frame, unionPlus])).toContain("state minus");
    const brokenPlus = [
      fixtureRod([330, 320], [440, 320]),
      fixtureRod([520, 320], [630, 320]),
      fixtureRod([480, 170], [480, 270]),
      fixtureRod([480, 370], [480, 470]),
    ];
    expect(basicStateFeatures("circle-plus", [...frame, ...brokenPlus])).toContain("state plus");
    const mirroredCheck = fixtureState("check").map((part) => part.map(([x, y]) => [960 - x!, y!]));
    expect(basicStateFeatures("circle-check", [...frame, ...mirroredCheck])).toContain(
      "state check",
    );
    expect(
      basicStateFeatures("circle-off", [...frame, fixtureRod([80, -80], [880, 720])]),
    ).toContain("state off");
    for (const token of ["check", "x", "plus", "alert"])
      for (let index = 0; index < fixtureState(token).length; index++) {
        const partial = fixtureState(token).filter((_part, i) => i !== index);
        expect(
          basicStateFeatures("circle-" + token, [...frame, ...partial]),
          token + index,
        ).toContain("state " + token);
      }
    expect(curvedState("help", [fixtureCircle(480, 440, 135), fixtureCircle(480, 185, 35)])).toBe(
      false,
    );
    const crown = Array.from({ length: 361 }, (_, step) => [
      480 + 110 * Math.cos((step * Math.PI) / 360),
      300 + 110 * Math.sin((step * Math.PI) / 360),
    ]);
    const mergedLock = [[355, 120], [605, 120], [605, 300], ...crown, [355, 300], [355, 120]];
    const counter = Array.from({ length: 361 }, (_, step) => [
      480 + 40 * Math.cos(Math.PI - (step * Math.PI) / 360),
      300 + 40 * Math.sin(Math.PI - (step * Math.PI) / 360),
    ]);
    counter.push(counter[0]!);
    expect(curvedState("lock", [mergedLock, counter])).toBe(true);
    expect(curvedState("lock", [mergedLock])).toBe(false);
    expect(curvedState("unlock", [mergedLock, counter])).toBe(false);
  });

  it("checks every TC10 chart, its composite carrier, trend and stacking from independent geometry", () => {
    const axes = [fixtureRod([110, 0], [860, 0]), fixtureRod([110, 0], [110, 700])];
    const columns = [180, 330, 480].map((height, index) =>
      fixtureRectangle(220 + index * 210, 50, 320 + index * 210, 50 + height),
    );
    const bars = [180, 330, 480].map((width, index) =>
      fixtureRectangle(230, 520 - index * 200, 230 + width, 620 - index * 200),
    );
    const line = [fixtureRod([230, 200], [450, 500]), fixtureRod([450, 500], [730, 280])];
    const pie = [
      fixtureCircle(480, 320, 270),
      fixtureCircle(480, 320, 200).reverse(),
      fixtureRod([480, 320], [745, 320]),
      fixtureRod([480, 320], [480, 585]),
    ];
    const scatter = [
      [280, 200],
      [600, 530],
      [730, 240],
      [430, 380],
    ].map(([x, y]) => fixtureCircle(x!, y!, 35));
    const gantt = [
      fixtureRectangle(200, 500, 450, 570),
      fixtureRectangle(330, 300, 760, 370),
      fixtureRectangle(480, 100, 680, 170),
    ];
    const nodes = [
      [260, 180],
      [700, 180],
      [480, 580],
    ];
    const network = [
      ...nodes.map(([x, y]) => fixtureCircle(x!, y!, 40)),
      fixtureRod(nodes[0]!, nodes[2]!),
      fixtureRod(nodes[2]!, nodes[1]!),
    ];
    const candles = [
      fixtureRectangle(300, 220, 400, 480),
      fixtureRectangle(590, 120, 690, 350),
      fixtureRod([350, 130], [350, 580], 30),
      fixtureRod([640, 50], [640, 480], 30),
    ];
    const spline = [
      Array.from({ length: 241 }, (_, index) => {
        const t = index / 240;
        return [230 + 500 * t, 340 + 160 * Math.sin(t * Math.PI * 2) + 35];
      }).concat(
        Array.from({ length: 241 }, (_, index) => {
          const t = 1 - index / 240;
          return [230 + 500 * t, 340 + 160 * Math.sin(t * Math.PI * 2) - 35];
        }),
      ),
    ];
    spline[0]!.push(spline[0]![0]!);
    const area = [
      [
        [230, 60],
        [730, 60],
        [730, 280],
        [450, 500],
        [230, 200],
        [230, 60],
      ],
    ];
    const errors: { name: string; failures: string[] }[] = [];
    for (const name of semanticDomains.TC10!) {
      let shape: number[][][];
      if (name.includes("column") || name.includes("bar")) {
        const column = name.includes("column"),
          objects = column ? columns : bars;
        shape = objects.map((part) =>
          part.map(([x, y]) =>
            name.includes("decreasing") ? (column ? [960 - x!, y!] : [x!, 720 - y!]) : [x!, y!],
          ),
        );
        if (name.includes("stacked"))
          shape = shape.flatMap((part) => {
            const box = carrierGeometry(part);
            return column
              ? [
                  fixtureRectangle(box.x0, box.y0, box.x1, box.cy - 15),
                  fixtureRectangle(box.x0, box.cy + 15, box.x1, box.y1),
                ]
              : [
                  fixtureRectangle(box.x0, box.y0, box.cx - 15, box.y1),
                  fixtureRectangle(box.cx + 15, box.y0, box.x1, box.y1),
                ];
          });
      } else if (name.includes("combined")) shape = [...columns, ...line];
      else if (name.includes("candlestick")) shape = candles;
      else if (name.includes("gantt")) shape = gantt;
      else if (name.includes("network")) shape = network;
      else if (name.includes("scatter")) shape = scatter;
      else if (name.includes("spline")) shape = spline;
      else if (name.includes("area")) shape = area;
      else if (name.includes("pie")) shape = pie;
      else shape = line;
      if (/^(?:file|square)-/u.test(name)) {
        expect(semanticFeatures(name, shape), name).not.toEqual([]);
        shape = [
          ...fixtureStateCarrier(name),
          ...shape.map((part) =>
            part.map(([x, y]) => [480 + (x! - 480) * 0.8, 320 + (y! - 320) * 0.8]),
          ),
        ];
        expect(documentFeatures(name, shape), name).toEqual([]);
      }
      const failures = semanticFeatures(name, shape);
      if (failures.length) errors.push({ name, failures });
      expect(chartFeatures(name, []), name).not.toEqual([]);
      if (name.includes("no-axes"))
        expect(chartFeatures(name, [...shape, ...axes]), name).toContain(
          "chart has no coordinate axes",
        );
    }
    expect(errors).toEqual([]);
    for (const name of [
      "chart-column-increasing",
      "chart-bar-increasing",
      "chart-column-decreasing",
      "chart-bar-decreasing",
    ]) {
      const column = name.includes("column"),
        correct = column ? columns : bars;
      const equal = Array.from({ length: 3 }, (_, index) =>
        column
          ? fixtureRectangle(220 + index * 210, 50, 320 + index * 210, 350)
          : fixtureRectangle(230, 520 - index * 200, 530, 620 - index * 200),
      );
      expect(chartFeatures(name, equal), name).toContain("strict chart reading-order trend");
      const reversed = correct.map((part) =>
        part.map(([x, y]) => (column ? [960 - x!, y!] : [x!, 720 - y!])),
      );
      const wrongTrend = name.includes("increasing") ? reversed : correct;
      expect(chartFeatures(name, wrongTrend), name).toContain("strict chart reading-order trend");
      expect(chartFeatures(name, correct.slice(0, 2)), name).toContain(
        column ? "at least three chart columns" : "at least three chart bars",
      );
    }
    expect(chartFeatures("chart-column-stacked", columns)).toContain(
      "at least two stacked segments per bar",
    );
    expect(chartFeatures("chart-bar-stacked", bars)).toContain(
      "at least two stacked segments per bar",
    );
    expect(chartFeatures("chart-line", columns)).toContain("connected chart polyline");
    expect(chartFeatures("chart-line", line.slice(0, 1))).toContain("connected chart polyline");
    expect(chartFeatures("chart-spline", line)).toContain("smooth chart spline");
    const subdividedLine = line.map((part) =>
      part.slice(1).flatMap((b, index) =>
        Array.from({ length: 40 }, (_, step) => {
          const a = part[index]!,
            t = step / 40;
          return [a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t];
        }),
      ),
    );
    for (const part of subdividedLine) part.push(part[0]!);
    expect(chartFeatures("chart-spline", subdividedLine)).toContain("smooth chart spline");
    expect(chartFeatures("chart-area", line)).toContain("closed chart area above baseline");
    expect(chartFeatures("chart-pie", pie.slice(0, 2))).toContain(
      "circular pie and visible sector",
    );
    expect(chartFeatures("chart-pie", [pie[0]!, ...pie.slice(2)])).toContain(
      "circular pie and visible sector",
    );
    expect(chartFeatures("chart-scatter", columns)).toContain("separate chart scatter points");
    expect(chartFeatures("chart-candlestick", candles.slice(0, 2))).toContain(
      "candlestick bodies with projecting wicks",
    );
    expect(chartFeatures("chart-gantt", bars)).toContain(
      "row-separated gantt ranges with distinct starts and lengths",
    );
    expect(chartFeatures("chart-network", network.slice(0, 3))).toContain(
      "chart nodes and connecting edges",
    );
    expect(chartFeatures("chart-no-axes-combined", columns)).toContain("connected chart polyline");
    expect(chartFeatures("chart-no-axes-combined", line)).toContain("at least three chart columns");
    for (const [name, wrong] of [
      ["chart-column", bars],
      ["chart-column-big", bars],
      ["chart-bar", columns],
      ["chart-bar-big", columns],
      ["chart-no-axes-column", bars],
      ["chart-pie", columns],
      ["chart-scatter", line],
      ["chart-candlestick", columns],
      ["chart-network", scatter],
      ["chart-gantt", line],
      ["chart-no-axes-gantt", columns],
      ["chart-spline", area],
      ["chart-line", spline],
      ["chart-area", spline],
    ] as const)
      expect(chartFeatures(name, wrong), name + " wrong chart type").not.toEqual([]);
  });
  it("checks every TC06 carrier and rejects lost seals, tails, handset connections and appliance controls", () => {
    /**
     * Builds a positive-winding rectangle used only as independent fixture geometry.
     * @param x0 - Left edge.
     * @param y0 - Lower edge.
     * @param x1 - Right edge.
     * @param y1 - Upper edge.
     * @returns Closed rectangle polygon.
     */
    function rectangle(x0: number, y0: number, x1: number, y1: number): number[][] {
      return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ];
    }
    /**
     * Constructs a closed polar arc independently of any release glyph.
     * @param x - Center x.
     * @param y - Center y.
     * @param radius - Outer radius.
     * @param start - Beginning angle in degrees.
     * @param sweep - Sweep in degrees.
     * @returns Closed annular arc with a seventy-unit normal width.
     */
    function arc(x: number, y: number, radius: number, start: number, sweep: number): number[][] {
      const shape = Array.from({ length: sweep * 2 + 1 }, (_, step) => [
        x + radius * Math.cos(((start + step / 2) * Math.PI) / 180),
        y + radius * Math.sin(((start + step / 2) * Math.PI) / 180),
      ]);
      shape.push(
        ...Array.from({ length: sweep * 2 + 1 }, (_, step) => [
          x + (radius - 70) * Math.cos(((start + sweep - step / 2) * Math.PI) / 180),
          y + (radius - 70) * Math.sin(((start + sweep - step / 2) * Math.PI) / 180),
        ]),
      );
      shape.push(shape[0]!);
      return shape;
    }
    const circle = Array.from({ length: 361 }, (_, degree) => [
      480 + 350 * Math.cos((degree * Math.PI) / 180),
      320 + 350 * Math.sin((degree * Math.PI) / 180),
    ]);
    const circleBubble = circle.flatMap((point, degree) =>
      degree === 225 ? [[200, -90]] : degree > 220 && degree < 240 ? [] : [point],
    );
    const squareBubble = [
      [100, 100],
      [260, 100],
      [300, -60],
      [440, 100],
      [860, 100],
      [860, 700],
      [100, 700],
      [100, 100],
    ];
    const firstBubble = squareBubble.map(([x, y]) => [
      480 + (x! - 480) * 0.8,
      320 + (y! - 320) * 0.8,
    ]);
    const bubbles = [firstBubble, firstBubble.map(([x, y]) => [x! + 110, y! - 70])];
    const envelope = [
      rectangle(100, 80, 860, 560),
      [
        [140, 525],
        [480, 260],
        [820, 525],
        [780, 570],
        [480, 340],
        [180, 570],
        [140, 525],
      ],
    ];
    const pickup = Array.from({ length: 181 }, (_, degree) => [
      480 + 100 * Math.cos((degree * Math.PI) / 180),
      560 + 100 * Math.sin((degree * Math.PI) / 180),
    ]);
    pickup.push(
      ...Array.from({ length: 181 }, (_, degree) => [
        480 + 100 * Math.cos(((degree + 180) * Math.PI) / 180),
        400 + 100 * Math.sin(((degree + 180) * Math.PI) / 180),
      ]),
    );
    pickup.push(pickup[0]!);
    const support = arc(480, 430, 220, 180, 180),
      mic = [pickup, support, rectangle(445, -40, 515, 220), rectangle(350, -70, 610, 0)];
    const knob = Array.from({ length: 361 }, (_, degree) => [
      730 + 35 * Math.cos((degree * Math.PI) / 180),
      320 + 35 * Math.sin((degree * Math.PI) / 180),
    ]);
    const microwave = [
      rectangle(100, 100, 860, 540),
      rectangle(170, 170, 790, 470).reverse(),
      rectangle(180, 180, 620, 460),
      knob,
    ];
    const bridge = arc(520, 320, 330, 90, 180),
      ends = [rectangle(480, 600, 760, 700), rectangle(480, -60, 760, 40)],
      phone = [bridge, ...ends];
    const dashedCircle = [
      ...[5, 65, 125, 185, 245, 305].map((start) => arc(480, 320, 350, start, 40)),
      fixtureRod([250, 80], [190, -55]),
      fixtureRod([190, -55], [390, 60]),
    ];
    const dashedSquare = [
      ...[
        [
          [140, 230],
          [140, 360],
        ],
        [
          [140, 460],
          [140, 620],
        ],
        [
          [820, 180],
          [820, 350],
        ],
        [
          [820, 450],
          [820, 620],
        ],
        [
          [140, 660],
          [300, 660],
        ],
        [
          [400, 660],
          [560, 660],
        ],
        [
          [660, 660],
          [820, 660],
        ],
        [
          [140, 130],
          [250, 130],
        ],
        [
          [420, 130],
          [580, 130],
        ],
        [
          [660, 130],
          [820, 130],
        ],
      ].map(([a, b]) => fixtureRod(a!, b!)),
      fixtureRod([210, 130], [250, -55]),
      fixtureRod([250, -55], [410, 130]),
    ];
    for (const name of semanticDomains.TC06!) {
      const shape =
        name === "message-circle-dashed"
          ? dashedCircle
          : name === "message-square-dashed"
            ? dashedSquare
            : name === "microwave"
              ? microwave
              : /^mic(?:-|$)/u.test(name)
                ? mic
                : /^phone(?:-|$)/u.test(name)
                  ? phone
                  : /^mail(?:-|$)/u.test(name)
                    ? envelope
                    : name === "messages-square"
                      ? bubbles
                      : name.startsWith("message-circle")
                        ? [circleBubble]
                        : [squareBubble];
      expect(communicationFeatures(name, shape), name).toEqual([]);
      expect(communicationFeatures(name, []), name).not.toEqual([]);
    }
    expect(communicationFeatures("mail", envelope.slice(0, 1))).toContain(
      "envelope and folded seal",
    );
    expect(communicationFeatures("mail", [squareBubble])).toContain("envelope and folded seal");
    expect(communicationFeatures("message-circle", [circle])).toContain("circular bubble and tail");
    expect(communicationFeatures("message-square", [rectangle(100, -60, 860, 700)])).toContain(
      "square bubble and tail",
    );
    expect(communicationFeatures("message-circle", [squareBubble])).toContain(
      "circular bubble and tail",
    );
    for (const [name, parts, continuous, other] of [
      ["message-circle-dashed", dashedCircle, [circleBubble], dashedSquare],
      ["message-square-dashed", dashedSquare, [squareBubble], dashedCircle],
    ] as const) {
      expect(communicationFeatures(name, parts)).toEqual([]);
      expect(communicationFeatures(name, parts.slice(0, -2))).not.toEqual([]);
      expect(communicationFeatures(name, parts.slice(0, -1))).not.toEqual([]);
      expect(communicationFeatures(name, [...continuous])).not.toEqual([]);
      expect(communicationFeatures(name, other)).not.toEqual([]);
    }
    expect(communicationFeatures("message-square", [circleBubble])).toContain(
      "square bubble and tail",
    );
    expect(communicationFeatures("message-square", envelope)).toContain("square bubble and tail");
    expect(communicationFeatures("messages-square", [squareBubble])).toContain(
      "two tailed square bubbles",
    );
    const hole = squareBubble
      .map(([x, y]) => [480 + (x! - 480) * 0.8, 320 + (y! - 320) * 0.8])
      .reverse();
    expect(communicationFeatures("messages-square", [squareBubble, hole])).toContain(
      "two tailed square bubbles",
    );
    expect(communicationFeatures("mic", microwave)).toContain("microphone pickup head and support");
    expect(communicationFeatures("microwave", mic)).toContain("microwave box, door and controls");
    expect(
      communicationFeatures(
        "mic",
        mic.filter((_part, index) => index !== 0),
      ),
    ).toContain("microphone pickup head and support");
    expect(
      communicationFeatures(
        "mic",
        mic.filter((_part, index) => index !== 1),
      ),
    ).toContain("microphone pickup head and support");
    expect(communicationFeatures("microwave", microwave.slice(0, -1))).toContain(
      "microwave box, door and controls",
    );
    expect(communicationFeatures("microwave", [microwave[0]!, microwave[1]!, knob])).toContain(
      "microwave box, door and controls",
    );
    expect(
      communicationFeatures(
        "microwave",
        microwave.filter((_part, index) => index !== 2),
      ),
    ).toContain("microwave box, door and controls");
    expect(communicationFeatures("phone", [bridge, ends[0]!])).toContain(
      "two handset ends and curved connection",
    );
    expect(communicationFeatures("phone", ends)).toContain(
      "two handset ends and curved connection",
    );
    expect(
      communicationFeatures("phone", [
        arc(520, 320, 330, 90, 75),
        arc(520, 320, 330, 195, 75),
        ...ends,
      ]),
    ).toContain("two handset ends and curved connection");
  });

  it("checks every TC12 intensity and rejects swapped, missing, equal or symbolic replacement levels", () => {
    /**
     * Draws an independent counterclockwise rectangle.
     * @param x0 - Left edge.
     * @param y0 - Lower edge.
     * @param x1 - Right edge.
     * @param y1 - Upper edge.
     * @returns Closed rectangle polygon.
     */
    function rectangle(x0: number, y0: number, x1: number, y1: number): number[][] {
      return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ];
    }
    /**
     * Draws an analytic circle for a wireless base point.
     * @param x - Center x.
     * @param y - Center y.
     * @param radius - Circle radius.
     * @returns Closed positive-winding circle polygon.
     */
    function circle(x: number, y: number, radius: number): number[][] {
      return Array.from({ length: 361 }, (_, step) => [
        x + radius * Math.cos((step * Math.PI) / 180),
        y + radius * Math.sin((step * Math.PI) / 180),
      ]);
    }
    /**
     * Draws a closed annular arc independently of production paths.
     * @param x - Arc center x.
     * @param y - Arc center y.
     * @param radius - Outer radius.
     * @param start - Start angle in degrees.
     * @param sweep - Arc sweep in degrees.
     * @returns Closed positive-winding annular arc.
     */
    function arc(x: number, y: number, radius: number, start: number, sweep: number): number[][] {
      const outside = Array.from({ length: sweep * 2 + 1 }, (_, step) => [
        x + radius * Math.cos(((start + step / 2) * Math.PI) / 180),
        y + radius * Math.sin(((start + step / 2) * Math.PI) / 180),
      ]);
      outside.push(
        ...Array.from({ length: sweep * 2 + 1 }, (_, step) => [
          x + (radius - 70) * Math.cos(((start + sweep - step / 2) * Math.PI) / 180),
          y + (radius - 70) * Math.sin(((start + sweep - step / 2) * Math.PI) / 180),
        ]),
      );
      outside.push(outside[0]!);
      return outside;
    }
    const speaker = [
      [100, 220],
      [300, 220],
      [520, 50],
      [520, 590],
      [300, 420],
      [100, 420],
      [100, 220],
    ];
    /**
     * Creates a carrier plus its independently quantified charge/bar/arc level.
     * @param family - Exact intensity family.
     * @param level - Expected mathematical fraction or integer count.
     * @returns Independent actual foreground contours.
     */
    function shape(family: string, level: number): number[][][] {
      if (family === "battery")
        return [
          rectangle(100, 100, 780, 540),
          rectangle(170, 170, 710, 470).reverse(),
          rectangle(780, 230, 860, 410),
          rectangle(170, 240, 170 + 540 * level, 400),
        ];
      if (family === "signal")
        return Array.from({ length: 4 }, (_, index) => {
          const x = 130 + index * 190,
            height = 180 + index * 140;
          return index < level
            ? [rectangle(x, 20, x + 140, 20 + height)]
            : [
                rectangle(x, 20, x + 140, 20 + height),
                rectangle(x + 30, 50, x + 110, height - 10).reverse(),
              ];
        }).flat();
      if (family === "wifi")
        return [
          circle(480, 60, 40),
          ...[240, 400, 550].slice(0, level).map((radius) => arc(480, 60, radius, 52, 76)),
        ];
      if (family === "volume")
        return [
          speaker,
          ...[150, 300].slice(0, level).map((radius) => arc(520, 320, radius, -60, 120)),
        ];
      throw new Error("Unsupported independent family: " + family);
    }
    for (const [family, sequence] of Object.entries(strengthSeries)) {
      const samples = sequence.map(([name, level]) => ({
        name,
        contours: shape(family, level),
      }));
      for (const [index, sample] of samples.entries()) {
        expect(strengthFeatures(sample.name, sample.contours), sample.name).toEqual([]);
        expect(measuredStrength(family, sample.contours).level, sample.name).toBeCloseTo(
          sequence[index]![1],
          10,
        );
        const wrong = samples[(index + 1) % samples.length]!;
        expect(strengthFeatures(sample.name, wrong.contours), sample.name).toContain(
          "exact " + family + " intensity",
        );
      }
      expect(strengthSequenceFeatures(family, samples), family).toEqual([]);
      expect(strengthSequenceFeatures(family, samples.slice(1)), family).toContain(
        "missing strength level " + samples[0]!.name,
      );
      expect(strengthSequenceFeatures(family, [...samples, samples[0]!]), family).toContain(
        "illegal or duplicate strength identity",
      );
      const equal = samples.map((sample, index) =>
        index === 1 ? { ...sample, contours: samples[0]!.contours } : sample,
      );
      expect(strengthSequenceFeatures(family, equal), family).toContain(
        "strictly increasing strength sequence",
      );
      const swapped = samples.map((sample, index) =>
        index < 2 ? { ...sample, contours: samples[1 - index]!.contours } : sample,
      );
      expect(strengthSequenceFeatures(family, swapped), family).toContain(
        "strictly increasing strength sequence",
      );
      const symbols = semanticDomains.TC12!.filter(
        (name) =>
          name.split("-")[0] === family && !sequence.some(([identity]) => identity === name),
      );
      if (symbols.length) {
        const state = {
          name: symbols[0]!,
          contours: shape(family, sequence[sequence.length - 1]![1]),
        };
        expect(strengthSequenceFeatures(family, [...samples, state]), family).toEqual([]);
        expect(strengthSequenceFeatures(family, [state, ...samples.slice(1)]), family).toContain(
          "missing strength level " + samples[0]!.name,
        );
      }
    }
    expect(
      measuredStrength(
        "battery",
        shape("battery", 1 / 3).filter((_value, index) => index !== 2),
      ).failures,
    ).toContain("battery shell and terminal");
    const battery = shape("battery", 1 / 3),
      unified = [
        [100, 100],
        [780, 100],
        [780, 230],
        [860, 230],
        [860, 410],
        [780, 410],
        [780, 540],
        [100, 540],
        [100, 100],
      ];
    expect(strengthFeatures("battery-low", [unified, battery[1]!, battery[3]!])).toEqual([]);
    expect(measuredStrength("signal", shape("signal", 0).slice(2)).failures).toContain(
      "four signal carrier bars",
    );
    expect(measuredStrength("wifi", shape("wifi", 3).slice(1)).failures).toContain(
      "wifi base point",
    );
    expect(measuredStrength("volume", shape("volume", 2).slice(1)).failures).toContain(
      "speaker body and flared cone",
    );
  });

  it("checks TC08 clock directions, hand lengths, alarm accessories and calendar variants", () => {
    /**
     * Constructs a closed analytic-circle polygon for independent time/date fixtures.
     * @param x - Center x.
     * @param y - Center y.
     * @param radius - Circle radius.
     * @returns Closed counterclockwise circle polygon.
     */
    function circle(x: number, y: number, radius: number): number[][] {
      return Array.from({ length: 361 }, (_, step) => [
        x + radius * Math.cos((step * Math.PI) / 180),
        y + radius * Math.sin((step * Math.PI) / 180),
      ]);
    }
    /**
     * Draws a positive-winding hand from its independent centerline and normal.
     * @param x - Dial center x.
     * @param y - Dial center y.
     * @param dx - Hand's axial x displacement.
     * @param dy - Hand's axial y displacement.
     * @param width - Actual normal thickness.
     * @returns Closed straight-hand contour.
     */
    function hand(x: number, y: number, dx: number, dy: number, width: number): number[][] {
      const length = Math.hypot(dx, dy),
        nx = (-dy * width) / length / 2,
        ny = (dx * width) / length / 2;
      return [
        [x - nx, y - ny],
        [x + dx - nx, y + dy - ny],
        [x + dx + nx, y + dy + ny],
        [x + nx, y + ny],
        [x - nx, y - ny],
      ];
    }
    /**
     * Draws an independent rectangle for bindings, feet, date pages and ranges.
     * @param x0 - Left edge.
     * @param y0 - Lower edge.
     * @param x1 - Right edge.
     * @param y1 - Upper edge.
     * @returns Positive-winding closed rectangle.
     */
    function rectangle(x0: number, y0: number, x1: number, y1: number): number[][] {
      return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ];
    }
    const dial = [circle(480, 320, 350), circle(480, 320, 280).reverse()];
    const minute = hand(480, 320, 0, 280, 70),
      short = hand(480, 320, 190, 0, 70),
      ordinary = [...dial, minute, short];
    expect(clockFeatures("clock", ordinary)).toEqual([]);
    expect(clockFeatures("clock", [...dial, minute])).toContain(
      "same-center long and short clock hands",
    );
    expect(clockFeatures("clock", [...dial, minute, hand(480, 320, 280, 0, 70)])).toContain(
      "same-center long and short clock hands",
    );
    const offStripe = fixtureRod([100, 700], [860, -60], 70),
      clockOff = [...ordinary, offStripe];
    for (const width of [62, 70, 82, 94, 106]) {
      const stripe = fixtureRod([100, 700], [860, -60], width),
        actual = [...ordinary, stripe];
      expect(clockFeatures("clock-off", actual), "stripe width " + width).toEqual([]);
      expect(basicStateFeatures("clock-off", actual), "stripe width " + width).toEqual([]);
      expect(
        clockFeatures("clock-off", [...dial, minute, stripe]),
        "missing hour " + width,
      ).toContain("same-center long and short clock hands");
      expect(
        basicStateFeatures("clock-off", [...ordinary, fixtureRod([100, -60], [860, 700], width)]),
        "mirrored stripe " + width,
      ).toContain("state off");
    }
    expect(clockFeatures("clock-off", clockOff)).toEqual([]);
    expect(basicStateFeatures("clock-off", clockOff)).toEqual([]);
    expect(clockFeatures("clock", clockOff)).toContain("same-center long and short clock hands");
    expect(clockFeatures("clock-off", [...dial, offStripe])).toContain(
      "same-center long and short clock hands",
    );
    expect(clockFeatures("clock-off", [...dial, minute, offStripe])).toContain(
      "same-center long and short clock hands",
    );
    expect(
      clockFeatures("clock-off", [...dial, minute, hand(480, 320, 280, 0, 70), offStripe]),
    ).toContain("same-center long and short clock hands");
    for (let hour = 1; hour <= 12; hour++) {
      const angle = (hour * Math.PI) / 6,
        selected = hand(480, 320, 220 * Math.sin(angle), 220 * Math.cos(angle), 70);
      expect(
        clockFeatures("clock-hour-" + hour, [...dial, minute, selected]),
        "hour " + hour,
      ).toEqual([]);
      const wrong = (((hour % 12) + 1) * Math.PI) / 6;
      expect(
        clockFeatures("clock-hour-" + hour, [
          ...dial,
          minute,
          hand(480, 320, 220 * Math.sin(wrong), 220 * Math.cos(wrong), 70),
        ]),
        "hour " + hour,
      ).not.toEqual([]);
      expect(
        clockFeatures("clock-hour-" + hour, [...dial, short, selected]),
        "minute " + hour,
      ).not.toEqual([]);
      expect(
        clockFeatures("clock-hour-" + hour, hour === 12 ? dial : [...dial, minute]),
        "missing hand " + hour,
      ).not.toEqual([]);
    }
    const bells = [circle(260, 650, 70), circle(700, 650, 70)],
      feet = [rectangle(250, -90, 380, -20), rectangle(580, -90, 710, -20)];
    for (const name of semanticDomains.TC08!.filter((value) => value.startsWith("alarm-clock"))) {
      expect(clockFeatures(name, [...ordinary, ...bells, ...feet]), name).toEqual([]);
      if (name.endsWith("-off")) {
        expect(clockFeatures(name, [...ordinary, ...bells, ...feet, offStripe]), name).toEqual([]);
        expect(
          clockFeatures(name, [...dial, minute, ...bells, ...feet, offStripe]),
          name,
        ).toContain("same-center long and short clock hands");
      }
      expect(clockFeatures(name, [...ordinary, bells[0]!, ...feet]), name).toContain(
        "two alarm bells",
      );
      expect(clockFeatures(name, [...ordinary, ...bells]), name).toContain("alarm base");
    }
    const page = [rectangle(100, -60, 860, 640), rectangle(170, 10, 790, 570).reverse()],
      bindings = [rectangle(285, 580, 355, 730), rectangle(605, 580, 675, 730)],
      calendar = [...page, ...bindings];
    /**
     * Filled bindings grow with stroke weight while remaining narrow relative to the date page.
     */
    for (const width of [62, 70, 82, 80.6, 91, 106.6]) {
      const weightedBindings = [320, 640].map((x) =>
        rectangle(x - width / 2, 550, x + width / 2, 710),
      );
      expect(
        calendarFeatures("calendar", [...page, ...weightedBindings]),
        "calendar binding width " + width,
      ).toEqual([]);
      expect(
        calendarFeatures("calendar", [...page, weightedBindings[0]!]),
        "missing second binding at width " + width,
      ).toContain("calendar date page and two bindings");
    }
    expect(
      calendarFeatures("calendar", [
        ...page,
        rectangle(220, 550, 420, 710),
        rectangle(540, 550, 740, 710),
      ]),
      "wide upper objects are not bindings",
    ).toContain("calendar date page and two bindings");
    const days = [
        [300, 140],
        [600, 140],
        [300, 360],
        [600, 360],
      ].map(([x, y]) => circle(x!, y!, 30)),
      dates = [280, 460, 640].map((x) => circle(x, 180, 30)),
      connection = rectangle(280, 165, 640, 195);
    const embedded = [
      circle(650, 160, 130),
      circle(650, 160, 100).reverse(),
      hand(650, 160, 0, 104, 26),
      hand(650, 160, 70, 0, 26),
    ];
    for (const name of semanticDomains.TC08!.filter((value) => value.startsWith("calendar"))) {
      const features =
        name === "calendar-days"
          ? days
          : name === "calendar-range"
            ? [...dates, connection]
            : name === "calendar-clock"
              ? embedded
              : [];
      expect(calendarFeatures(name, [...calendar, ...features]), name).toEqual([]);
      expect(calendarFeatures(name, [...page, bindings[0]!, ...features]), name).toContain(
        "calendar date page and two bindings",
      );
      expect(calendarFeatures(name, [...bindings, ...features]), name).toContain(
        "calendar date page and two bindings",
      );
    }
    expect(calendarFeatures("calendar-days", [...calendar, ...days.slice(0, 2)])).toContain(
      "calendar two-row two-column dates",
    );
    expect(calendarFeatures("calendar-range", [...calendar, ...dates])).toContain(
      "calendar three-position connected range",
    );
    expect(
      calendarFeatures("calendar-range", [...calendar, ...dates.slice(0, 2), connection]),
    ).toContain("calendar three-position connected range");
    expect(calendarFeatures("calendar-clock", calendar)).toContain("clock dial");
  });

  it("keeps every TC05 carrier and rejects missing folds, tabs, clips and overlapping objects", () => {
    const paper = [
      [160, -60],
      [800, -60],
      [800, 500],
      [600, 700],
      [160, 700],
      [160, -60],
    ];
    const folder = [
      [100, -60],
      [860, -60],
      [860, 520],
      [400, 520],
      [320, 680],
      [100, 680],
      [100, -60],
    ];
    const board = [
      [180, -60],
      [780, -60],
      [780, 640],
      [180, 640],
      [180, -60],
    ];
    const clip = [
      [340, 600],
      [620, 600],
      [620, 730],
      [340, 730],
      [340, 600],
    ];
    const rectangle = [
      [160, -60],
      [800, -60],
      [800, 700],
      [160, 700],
      [160, -60],
    ];
    /**
     * Places two independent carriers inside the canvas with genuine overlap.
     * @param contour - Independent paper or folder construction.
     * @returns Two distinguishable overlapping contours, not outer/inner hole duplicates.
     */
    function overlap(contour: number[][]): number[][][] {
      const first = contour.map(([x, y]) => [480 + (x! - 480) * 0.8, 320 + (y! - 320) * 0.8]);
      return [first, first.map(([x, y]) => [x! + 110, y! - 70])];
    }
    for (const name of semanticDomains.TC05!) {
      const base = name.split("-")[0]!;
      const shape =
        base === "file"
          ? [paper]
          : base === "files"
            ? overlap(paper)
            : base === "folder"
              ? [folder]
              : base === "folders"
                ? overlap(folder)
                : [board, clip];
      expect(documentFeatures(name, shape), name).toEqual([]);
      expect(documentFeatures(name, [rectangle]), name).not.toEqual([]);
      expect(documentFeatures(name, []), name).not.toEqual([]);
      if (base === "files" || base === "folders") {
        expect(documentFeatures(name, shape.slice(0, 1)), name).not.toEqual([]);
        expect(documentFeatures(name, [shape[0]!, shape[0]!]), name).not.toEqual([]);
        expect(
          documentFeatures(name, [shape[0]!, shape[1]!.map(([x, y]) => [x! + 1200, y!])]),
          name,
        ).toContain("overlapping document carriers");
      } else if (base === "clipboard") {
        expect(documentFeatures(name, [board]), name).toContain("clipboard board and top clip");
        expect(documentFeatures(name, [clip]), name).toContain("clipboard board and top clip");
      }
    }
  });

  it("recognizes connected miniature folder nodes without inventing a full-size enclosing folder", () => {
    /**
     * Creates an independent hollow miniature folder with a proportionate raised tab.
     * @param x - Left edge.
     * @param y - Bottom edge.
     * @returns Outer contour and oppositely wound counter.
     */
    function node(x: number, y: number): number[][][] {
      const outer = [
        [x, y],
        [x + 320, y],
        [x + 320, y + 200],
        [x + 150, y + 200],
        [x + 120, y + 230],
        [x, y + 230],
        [x, y],
      ];
      const inner = [
        [x + 45, y + 45],
        [x + 275, y + 45],
        [x + 275, y + 155],
        [x + 130, y + 155],
        [x + 100, y + 185],
        [x + 45, y + 185],
        [x + 45, y + 45],
      ].reverse();
      return [outer, inner];
    }
    const parent = node(100, 470),
      upper = node(520, 210),
      lower = node(520, -60);
    const spine = fixtureRod([220, 480], [220, 55], 36);
    const upperLink = fixtureRod([220, 325], [535, 325], 36);
    const lowerLink = fixtureRod([220, 55], [535, 55], 36);
    const valid = [...parent, ...upper, ...lower, spine, upperLink, lowerLink];
    expect(documentFeatures("folder-tree", valid)).toEqual([]);
    expect(documentDetailFeatures("folder-tree", valid)).toEqual([]);
    expect(semanticFeatures("folder-tree", valid)).toEqual([]);
    expect(
      semanticFeatures(
        "folder-tree",
        valid.map((part) => [...part].reverse()),
      ),
    ).toEqual([]);
    expect(
      semanticFeatures("folder-tree", [
        ...parent,
        ...upper,
        ...lower,
        ...[spine, upperLink, lowerLink].map((part) => [...part].reverse()),
      ]),
    ).not.toEqual([]);
    const disconnected = [...parent, ...upper, ...lower];
    expect(semanticFeatures("folder-tree", disconnected)).not.toEqual([]);
    expect(semanticFeatures("folder-tree", [...parent, spine, upperLink, lowerLink])).not.toEqual(
      [],
    );
    const noTabs = [
      fixtureRectangle(100, 470, 420, 700),
      fixtureRectangle(520, 210, 840, 440),
      fixtureRectangle(520, -60, 840, 170),
      spine,
      upperLink,
      lowerLink,
    ];
    expect(semanticFeatures("folder-tree", noTabs)).not.toEqual([]);
    expect(
      semanticFeatures("folder-tree", [...parent, ...upper, ...lower, upperLink, lowerLink]),
    ).not.toEqual([]);
  });

  it("requires open TC07 command loops and a hexagonal nut instead of a lightning bolt", () => {
    /**
     * Creates a closed independent analytic-circle polygon with a known winding.
     * @param x - Center x.
     * @param y - Center y.
     * @param radius - Analytic reference radius.
     * @returns Closed counterclockwise polygon.
     */
    function circle(x: number, y: number, radius: number): number[][] {
      return Array.from({ length: 361 }, (_, step) => [
        x + radius * Math.cos((step * Math.PI) / 180),
        y + radius * Math.sin((step * Math.PI) / 180),
      ]);
    }
    /**
     * Constructs a closed foreground connection without importing glyph paths.
     * @param x0 - Left edge.
     * @param y0 - Lower edge.
     * @param x1 - Right edge.
     * @param y1 - Upper edge.
     * @returns Closed rectangle with positive winding.
     */
    function rectangle(x0: number, y0: number, x1: number, y1: number): number[][] {
      return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ];
    }
    const loops = [
      [210, 70],
      [750, 70],
      [210, 570],
      [750, 570],
    ].flatMap(([x, y]) => [circle(x!, y!, 130), circle(x!, y!, 70).reverse()]);
    const connections = [
      rectangle(305, 70, 375, 570),
      rectangle(585, 70, 655, 570),
      rectangle(210, 165, 750, 235),
      rectangle(210, 405, 750, 475),
    ];
    const command = [...loops, ...connections];
    expect(semanticFeatures("command", command)).toEqual([]);
    expect(commandFeatures([...loops.slice(2), ...connections])).toContain(
      "four open command loops",
    );
    expect(commandFeatures([...command, rectangle(160, 20, 260, 120)])).toContain(
      "four open command loops",
    );
    expect(commandFeatures([...command, rectangle(180, 35, 780, 105)])).toContain(
      "four open command loops",
    );
    expect(commandFeatures(loops)).toContain("rectangular command connection");
    const hexagon = Array.from({ length: 7 }, (_, step) => [
      480 + 380 * Math.cos((step * Math.PI) / 3),
      320 + 380 * Math.sin((step * Math.PI) / 3),
    ]);
    const hole = circle(480, 320, 120).reverse();
    expect(semanticFeatures("bolt", [hexagon, hole])).toEqual([]);
    expect(boltFeatures([hexagon])).toContain("open nut center");
    expect(boltFeatures([hexagon, hole, circle(480, 320, 125)])).toContain("open nut center");
    const lightning = [
      [620, 700],
      [230, 280],
      [430, 280],
      [340, -60],
      [750, 380],
      [540, 380],
      [620, 700],
    ];
    expect(boltFeatures([lightning])).toContain("six-sided nut exterior");
    const pentagon = Array.from({ length: 6 }, (_, step) => [
      480 + 380 * Math.cos((step * Math.PI * 2) / 5),
      320 + 380 * Math.sin((step * Math.PI * 2) / 5),
    ]);
    expect(boltFeatures([pentagon, hole])).toContain("six-sided nut exterior");
  });

  it("distinguishes all five TC03 frames and rejects wrong sides, lobes and interrupted-circle states", () => {
    const circle = Array.from({ length: 721 }, (_, step) => [
      480 + 350 * Math.cos((step * Math.PI) / 360),
      320 + 350 * Math.sin((step * Math.PI) / 360),
    ]);
    const square = [
      [100, -60],
      [860, -60],
      [860, 700],
      [100, 700],
      [100, -60],
    ];
    const diamond = [
      [480, 710],
      [870, 320],
      [480, -70],
      [90, 320],
      [480, 710],
    ];
    const octagon = Array.from({ length: 9 }, (_, step) => [
      480 + 390 * Math.cos(Math.PI / 8 + (step * Math.PI) / 4),
      320 + 390 * Math.sin(Math.PI / 8 + (step * Math.PI) / 4),
    ]);
    /**
     * Draws an independently specified badge with a prescribed radial lobe count.
     * @param count - Number of visible badge protrusions.
     * @returns Closed analytic polygon with alternating outer/inner radii.
     */
    function badge(count: number): number[][] {
      return Array.from({ length: count * 2 + 1 }, (_, step) => {
        const radius = step % 2 ? 300 : 380,
          angle = (step * Math.PI) / count;
        return [480 + radius * Math.cos(angle), 320 + radius * Math.sin(angle)];
      });
    }
    const shapes = { circle, square, diamond, octagon, badge: badge(8) };
    for (const [name, contour] of Object.entries(shapes)) {
      expect(semanticFeatures(name, [contour]), name).toEqual([]);
      const wrong = name === "circle" ? square : circle;
      expect(semanticFeatures(name, [wrong]), name).not.toEqual([]);
    }
    expect(extraFrameFeatures("badge", [badge(7)])).toContain("eight badge protrusions");
    expect(extraFrameFeatures("badge", [badge(9)])).toContain("eight badge protrusions");
    const heptagon = Array.from({ length: 8 }, (_, step) => [
      480 + 390 * Math.cos((step * Math.PI * 2) / 7),
      320 + 390 * Math.sin((step * Math.PI * 2) / 7),
    ]);
    expect(extraFrameFeatures("octagon", [heptagon])).toContain("eight convex octagon sides");
    expect(extraFrameFeatures("diamond", [diamond.slice(0, 3).concat([diamond[0]!])])).toContain(
      "four diamond vertices",
    );
    expect(semanticFeatures("square", [square.slice(0, 3).concat([square[0]!])])).toContain(
      "square container",
    );
    /**
     * Draws an annular circular arc from an independent polar formula.
     * @param start - Beginning angle in degrees.
     * @param length - Arc sweep in degrees.
     * @returns Closed annular arc without an imported production path.
     */
    function arc(start: number, length: number): number[][] {
      const points = Array.from({ length: Math.round(length * 2) + 1 }, (_, step) => {
        const angle = ((start + step / 2) * Math.PI) / 180;
        return [480 + 350 * Math.cos(angle), 320 + 350 * Math.sin(angle)];
      });
      points.push(
        ...Array.from({ length: Math.round(length * 2) + 1 }, (_, step) => {
          const angle = ((start + length - step / 2) * Math.PI) / 180;
          return [480 + 280 * Math.cos(angle), 320 + 280 * Math.sin(angle)];
        }),
      );
      points.push(points[0]!);
      return points;
    }
    const dashed = Array.from({ length: 8 }, (_, index) => arc(index * 45, 28));
    const dot = Array.from({ length: 121 }, (_, step) => [
      480 + 40 * Math.cos((step * Math.PI) / 60),
      320 + 40 * Math.sin((step * Math.PI) / 60),
    ]);
    expect(semanticFeatures("circle-dashed", dashed)).toEqual([]);
    expect(semanticFeatures("circle-dot-dashed", [...dashed, dot])).toEqual([]);
    expect(semanticFeatures("circle-dot-dashed", dashed)).toContain("central circle dot");
    for (const name of ["circle-dashed", "circle-dot-dashed"])
      expect(extraFrameFeatures(name, [circle, dot])).toContain(
        "equally spaced interrupted circular arcs",
      );
    expect(extraFrameFeatures("circle-dashed", [arc(0, 28), ...dashed.slice(2)])).toContain(
      "equally spaced interrupted circular arcs",
    );
    for (const name of ["circle-check-big", "circle-off"]) {
      expect(extraFrameFeatures(name, [arc(35, 290)])).toEqual([]);
      expect(extraFrameFeatures(name, [square])).toContain("circular frame with defined opening");
    }
  });

  it("keeps every TC01–TC13 domain closed, nonempty, unique and present in the actual catalog", async () => {
    const catalog = (await sourceTools.loadIconSource()).icons.map(
      (icon: { name: string }) => icon.name,
    );
    expect(Object.keys(semanticDomains)).toEqual(
      Array.from({ length: 13 }, (_, index) => "TC" + String(index + 1).padStart(2, "0")),
    );
    for (const [category, names] of Object.entries(semanticDomains)) {
      expect(names.length, category).toBeGreaterThan(0);
      expect(new Set(names).size, category).toBe(names.length);
      expect(catalog.filter((name: string) => names.includes(name)).sort(), category).toEqual(
        [...names].sort(),
      );
    }
    expect([...activeSemanticNames].sort()).toEqual(
      [...new Set(Object.values(semanticDomains).flat())].sort(),
    );
  });

  it("recognizes every TC02 terminal and rejects reversed, removed or single-ended markers", () => {
    const arrow = [
      [0, 250],
      [-220, 20],
      [-40, 20],
      [-40, -250],
      [40, -250],
      [40, 20],
      [220, 20],
      [0, 250],
    ];
    /**
     * Rotates independently drawn points to a prescribed font-coordinate direction.
     * @param shape - Closed independent polygon around the zero origin.
     * @param key - Expected unit direction.
     * @returns Closed polygon around the production optical center.
     */
    function rotate(shape: number[][], key: string): number[][] {
      const [dx, dy] = directions[key]!;
      return shape.map(([x, y]) => [480 + x! * dy + y! * dx, 320 - x! * dx + y! * dy]);
    }
    for (const name of endpointNames) {
      const suffix = name.replace(/^arrows?-/u, ""),
        marker = /^(up|down|left|right)-(from|to)-(line|dot)$/u.exec(suffix);
      if (!marker) {
        const keys = suffix.split("-"),
          both = keys.map((key) => rotate(arrow, key));
        expect(endpointFeatures(name, both), name).toEqual([]);
        for (const single of both) expect(endpointFeatures(name, [single]), name).not.toEqual([]);
        continue;
      }
      const key = marker[1]!,
        position = marker[2] === "from" ? -350 : 350;
      const terminal =
        marker[3] === "line"
          ? [
              [-270, position - 35],
              [270, position - 35],
              [270, position + 35],
              [-270, position + 35],
              [-270, position - 35],
            ]
          : Array.from({ length: 121 }, (_, index) => [
              40 * Math.cos((index * Math.PI) / 60),
              position + 40 * Math.sin((index * Math.PI) / 60),
            ]);
      const body =
        name === "arrows-up-from-line"
          ? [-160, 160].map((offset) =>
              rotate(
                arrow.map(([x, y]) => [x! * 0.5 + offset, y!]),
                key,
              ),
            )
          : [rotate(arrow, key)];
      const correct = [...body, rotate(terminal, key)];
      expect(endpointFeatures(name, correct), name).toEqual([]);
      expect(endpointFeatures(name, body), name).toContain(
        "endpoint " + marker[2] + " " + marker[3],
      );
      const swapped = rotate(
        terminal.map(([x, y]) => [x!, -y!]),
        key,
      );
      expect(endpointFeatures(name, [...body, swapped]), name).toContain(
        "endpoint " + marker[2] + " " + marker[3],
      );
      const opposite = Object.keys(directions).find(
        (other) =>
          directions[other]![0] === -directions[key]![0] &&
          directions[other]![1] === -directions[key]![1],
      )!;
      expect(
        endpointFeatures(name, [rotate(arrow, opposite), rotate(terminal, key)]),
        name,
      ).not.toEqual([]);
      if (body.length === 2)
        expect(endpointFeatures(name, [body[0]!, rotate(terminal, key)]), name).toContain(
          "plural upward arrowheads",
        );
    }
  });

  it("recognizes split plural arrow strokes without counting detached or incomplete heads", () => {
    /**
     * Draws independent finite-width strokes without reading any current glyph.
     * @param a - Analytic first centerline endpoint.
     * @param b - Analytic second centerline endpoint.
     * @returns Closed counterclockwise stroke polygon of width 60.
     */
    function stroke(a: number[], b: number[]): number[][] {
      const length = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!);
      const nx = (-(b[1]! - a[1]!) * 30) / length;
      const ny = ((b[0]! - a[0]!) * 30) / length;
      return [
        [a[0]! - nx, a[1]! - ny],
        [b[0]! - nx, b[1]! - ny],
        [b[0]! + nx, b[1]! + ny],
        [a[0]! + nx, a[1]! + ny],
        [a[0]! - nx, a[1]! - ny],
      ];
    }
    const baseline = stroke([150, 0], [810, 0]);
    const first = [
      stroke([290, 130], [290, 630]),
      stroke([180, 500], [290, 630]),
      stroke([290, 630], [400, 500]),
    ];
    const second = first.map((part) => part.map(([x, y]) => [x! + 380, y!]));
    const name = "arrows-up-from-line";
    expect(endpointFeatures(name, [...first, ...second, baseline])).toEqual([]);
    for (const invalid of [
      [...first, baseline],
      [...first, ...second.slice(0, 2), baseline],
      [...first.slice(1), ...second.slice(1), baseline],
      [
        ...first,
        ...second.map((part, index) => part.map(([x, y]) => [x!, y! + (index === 0 ? -260 : 0)])),
        baseline,
      ],
      [...first, ...second.map((part) => part.map(([x, y]) => [x!, 760 - y!])), baseline],
    ])
      expect(endpointFeatures(name, invalid)).not.toEqual([]);
    expect(endpointFeatures(name, [...first, ...second])).toContain("endpoint from line");
  });

  it("keeps TC11 closed and rejects missing, excess, hollow and false fifth counting marks", async () => {
    const catalog = (await sourceTools.loadIconSource()).icons.map(
      (icon: { name: string }) => icon.name,
    );
    expect(
      catalog.filter((name: string) => /^(?:dice-[1-6]|tally-[1-5])$/u.test(name)).sort(),
    ).toEqual([...countingNames].sort());
    expect(countingNames.size).toBe(11);
    /**
     * Constructs a closed foreground rectangle with a known counterclockwise winding.
     * @param x0 - Left edge.
     * @param y0 - Bottom edge.
     * @param x1 - Right edge.
     * @param y1 - Top edge.
     * @returns Independent rectangle, including its closing point.
     */
    function rectangle(x0: number, y0: number, x1: number, y1: number): number[][] {
      return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ];
    }
    const frame = [rectangle(100, -60, 860, 700), rectangle(170, 10, 790, 630).reverse()];
    const dots = Array.from({ length: 7 }, (_, index) => {
      const x = 270 + (index % 3) * 200,
        y = 130 + Math.floor(index / 3) * 180;
      const dot = Array.from({ length: 120 }, (_, step) => [
        x + 35 * Math.cos((step * Math.PI) / 60),
        y + 35 * Math.sin((step * Math.PI) / 60),
      ]);
      dot.push(dot[0]!);
      return dot;
    });
    for (let count = 1; count <= 6; count++) {
      const name = "dice-" + count,
        selected = dots.slice(0, count);
      expect(semanticFeatures(name, [...frame, ...selected]), name).toEqual([]);
      expect(semanticFeatures(name, [...frame, ...dots.slice(0, count - 1)]), name).toContain(
        "exact dice dot count",
      );
      expect(semanticFeatures(name, [...frame, ...dots.slice(0, count + 1)]), name).toContain(
        "exact dice dot count",
      );
      const hollow = selected.flatMap((dot) => {
        const cx = (dot[0]![0]! + dot[60]![0]!) / 2,
          cy = dot[0]![1]!;
        return [
          dot,
          dot.map((point) => [cx + (point[0]! - cx) * 0.6, cy + (point[1]! - cy) * 0.6]).reverse(),
        ];
      });
      expect(semanticFeatures(name, [...frame, ...hollow]), name).toContain("exact dice dot count");
      expect(diceDotCenters([...frame, ...selected, ...selected])).toHaveLength(count);
    }
    const verticals = Array.from({ length: 5 }, (_, index) =>
      rectangle(180 + index * 140, 70, 240 + index * 140, 570),
    );
    const diagonal = [
      [170, 85],
      [215, 35],
      [685, 545],
      [640, 595],
      [170, 85],
    ];
    const horizontal = rectangle(170, 285, 685, 355);
    for (let count = 1; count <= 5; count++) {
      const name = "tally-" + count,
        selected = count === 5 ? [...verticals.slice(0, 4), diagonal] : verticals.slice(0, count);
      expect(semanticFeatures(name, selected), name).toEqual([]);
      expect(semanticFeatures(name, selected.slice(1)), name).not.toEqual([]);
      expect(semanticFeatures(name, [...selected, rectangle(850, 70, 910, 570)]), name).not.toEqual(
        [],
      );
    }
    expect(semanticFeatures("tally-5", verticals)).toContain("exact tally vertical count");
    expect(semanticFeatures("tally-5", verticals.slice(0, 4))).toContain(
      "fifth diagonal spans four tally strokes",
    );
    expect(semanticFeatures("tally-5", [...verticals.slice(0, 4), horizontal])).toContain(
      "fifth diagonal spans four tally strokes",
    );
  });

  it("keeps the TC01 selection closed and every selected identity present in the actual catalog", async () => {
    const names = (await sourceTools.loadIconSource()).icons.map(
      (icon: { name: string }) => icon.name,
    );
    const actual = names.filter((name: string) =>
      /^(?:arrow(?:-big)?-(?:up(?:-(?:left|right))?|down(?:-(?:left|right))?|left(?:-right)?|right(?:-left)?)|chevron-(?:up|down|left|right))$/u.test(
        name,
      ),
    );
    expect(actual.sort()).toEqual([...directionNames].sort());
    expect(directionNames.size).toBe(18);
  });

  it("recognizes every TC01 direction from independent arrows and rejects reversed heads", () => {
    const arrow = [
      [0, 350],
      [-280, 60],
      [-40, 60],
      [-40, -350],
      [40, -350],
      [40, 60],
      [280, 60],
      [0, 350],
    ];
    const chevron = [
      [0, 350],
      [-300, 0],
      [-250, -45],
      [0, 245],
      [250, -45],
      [300, 0],
      [0, 350],
    ];
    /**
     * Rotates an independent construction into font coordinates, not into a production source.
     * @param shape - Independent closed contour.
     * @param key - Prescribed unit direction.
     * @returns Closed rotated contour centered on the unchanged optical origin.
     */
    function rotate(shape: number[][], key: string): number[][] {
      const [dx, dy] = directions[key]!;
      return shape.map((point) => [
        480 + point[0]! * dy + point[1]! * dx,
        320 - point[0]! * dx + point[1]! * dy,
      ]);
    }
    for (const name of directionNames) {
      const main = name.replace(/^(?:arrow-big-|arrow-|chevron-)/u, "");
      const keys = main === "left-right" || main === "right-left" ? ["left", "right"] : [main];
      const shape = name.startsWith("chevron-") ? chevron : arrow;
      const positive = keys.map((key) => rotate(shape, key));
      expect(directionalFeatures(name, positive), name).toEqual([]);
      const reversed = keys.map((key) => {
        const d = directions[key]!;
        const opposite = Object.keys(directions).find(
          (other) => directions[other]![0] === -d[0] && directions[other]![1] === -d[1],
        )!;
        return rotate(shape, opposite);
      });
      if (keys.length === 1) expect(directionalFeatures(name, reversed), name).not.toEqual([]);
      else expect(directionalFeatures(name, [positive[0]!]), name).not.toEqual([]);
      expect(directionalFeatures(name, []), name).not.toEqual([]);
    }
  });

  it("accepts true half-stars and half-shields and rejects the opposite fill or a missing half", () => {
    const star = Array.from({ length: 10 }, (_empty, index) => {
      const angle = Math.PI / 2 + (index * Math.PI) / 5;
      const radius = index % 2 === 0 ? 390 : 180;
      return [480 + radius * Math.cos(angle), 320 + radius * Math.sin(angle)];
    });
    star.push(star[0]!);
    const shield = [
      [150, 650],
      [480, 710],
      [810, 650],
      [760, 240],
      [630, 0],
      [480, -70],
      [330, 0],
      [200, 240],
      [150, 650],
    ];
    /**
     * Clips a hole against the exact x=480 half boundary, preserving ordered intersections.
     * @param polygon - Independently defined closed polygon.
     * @param right - Whether the hollow region is on the right.
     * @returns Closed opposing-winding half-hole.
     */
    function halfHole(polygon: number[][], right: boolean): number[][] {
      const inner = polygon
        .slice(0, -1)
        .map((point) => [480 + (point[0]! - 480) * 0.72, 320 + (point[1]! - 320) * 0.72]);
      const clipped: number[][] = [];
      for (let index = 0; index < inner.length; index++) {
        const a = inner[index]!,
          b = inner[(index + 1) % inner.length]!;
        const insideA = right ? a[0]! >= 480 : a[0]! <= 480;
        const insideB = right ? b[0]! >= 480 : b[0]! <= 480;
        if (insideA) clipped.push(a);
        if (insideA !== insideB) {
          const t = (480 - a[0]!) / (b[0]! - a[0]!);
          clipped.push([480, a[1]! + t * (b[1]! - a[1]!)]);
        }
      }
      clipped.reverse();
      clipped.push(clipped[0]!);
      return clipped;
    }
    for (const [name, shape] of [
      ["star-half", star],
      ["shield-half", shield],
    ] as const) {
      expect(semanticFeatures(name, [shape, halfHole(shape, true)]), name).toEqual([]);
      expect(semanticFeatures(name, [shape]), name).toContain(
        name === "star-half"
          ? "left filled and right hollow star"
          : "left filled and right hollow shield",
      );
      expect(semanticFeatures(name, [shape, halfHole(shape, false)]), name).not.toEqual([]);
      const missing = shape.map((point) => [Math.max(480, point[0]!), point[1]!]);
      expect(semanticFeatures(name, [missing]), name).not.toEqual([]);
    }
    expect(semanticFeatures("shield", [shield])).toEqual([]);
    expect(
      semanticFeatures("shield", [
        [
          [100, -60],
          [860, -60],
          [860, 700],
          [100, 700],
          [100, -60],
        ],
      ]),
    ).toContain("shield shoulders and tapered bottom");
  });

  it("rejects inscribed polygons and verifies analytic curve, ring, line and point fixtures", () => {
    const circle = fixture.circleFixtureContour(350);
    const flat = geometryTools.flattenGlyphContours(
      [circle],
      designRules.visual.comparison.subdivisionUnits,
    ).contours;
    expect(circularContour(flat[0], 340, 360)).toBe(true);
    expect(
      geometryTools.measureCircleApproximation({
        contour: circle,
        center: [480, 320],
        radius: 350,
        tolerance: designRules.visual.comparison.subdivisionUnits,
      }),
    ).toBeLessThanOrEqual(designRules.visual.circleApproximationError);
    const polygon = Array.from({ length: 12 }, (_value, index) => [
      480 + 350 * Math.cos((index * Math.PI) / 6),
      320 + 350 * Math.sin((index * Math.PI) / 6),
    ]);
    polygon.push(polygon[0]!);
    expect(circularContour(polygon, 340, 360)).toBe(false);
    const inner = fixture.circleFixtureContour(200);
    inner.points.reverse();
    const ring = geometryTools.flattenGlyphContours(
      [circle, inner],
      designRules.visual.comparison.subdivisionUnits,
    ).contours;
    expect(sourceInk(ring, 480, 320)).toBe(false);
    expect(sourceInk(ring, 760, 320)).toBe(true);
    expect(sourceInk(flat, 480, 320)).toBe(true);
    const line = [
      [100, 280],
      [860, 280],
      [860, 360],
      [100, 360],
      [100, 280],
    ];
    expect(sourceInk([line], 480, 320)).toBe(true);
    expect(sourceInk([line], 480, 200)).toBe(false);
    const broken = [
      [100, 280],
      [380, 280],
      [380, 360],
      [100, 360],
      [100, 280],
    ];
    expect(sourceInk([broken], 480, 320)).toBe(false);
    const dots = Array.from({ length: 5 }, (_value, index) => {
      const points = Array.from({ length: 72 }, (_empty, step) => [
        160 + index * 160 + 30 * Math.cos((step * Math.PI) / 36),
        320 + 30 * Math.sin((step * Math.PI) / 36),
      ]);
      points.push(points[0]!);
      return points;
    });
    expect(dots.filter((dot) => circularContour(dot, 25, 35))).toHaveLength(5);
    expect(dots.slice(1).filter((dot) => circularContour(dot, 25, 35))).toHaveLength(4);
    expect([...dots, dots[0]!].filter((dot) => circularContour(dot, 25, 35))).toHaveLength(6);
  });

  it("measures an independent cubic rounded frame and rejects a sealed hole or changed corner", () => {
    /**
     * Builds four straight edges and four analytic quarter-circle cubic corners.
     * @param x0 - Left edge.
     * @param y0 - Bottom edge.
     * @param x1 - Right edge.
     * @param y1 - Top edge.
     * @param radius - Independently prescribed corner radius.
     * @returns Ordered source contour with no duplicated closing on-curve point.
     */
    function rounded(x0: number, y0: number, x1: number, y1: number, radius: number) {
      const k = (4 / 3) * Math.tan(Math.PI / 8) * radius;
      const records: [number, number, string | null][] = [
        [x0 + radius, y0, "curve"],
        [x1 - radius, y0, "line"],
        [x1 - radius + k, y0, null],
        [x1, y0 + radius - k, null],
        [x1, y0 + radius, "curve"],
        [x1, y1 - radius, "line"],
        [x1, y1 - radius + k, null],
        [x1 - radius + k, y1, null],
        [x1 - radius, y1, "curve"],
        [x0 + radius, y1, "line"],
        [x0 + radius - k, y1, null],
        [x0, y1 - radius + k, null],
        [x0, y1 - radius, "curve"],
        [x0, y0 + radius, "line"],
        [x0, y0 + radius - k, null],
        [x0 + radius - k, y0, null],
      ];
      return {
        closed: true,
        outlineIndex: 0,
        points: records.map(([x, y, type]) => ({
          x,
          y,
          type: type ?? "offcurve",
          smooth: type === "curve",
          name: null,
        })),
      };
    }
    const radius = designRules.visual.frameCornerRadius.standard;
    const outer = rounded(100, -60, 860, 700, radius),
      inner = rounded(170, 10, 790, 630, radius);
    inner.points = inner.points
      .map((point, index) => {
        if (point.type === "offcurve") return point;
        let next = (index + 1) % inner.points.length;
        while (inner.points[next]!.type === "offcurve") next = (next + 1) % inner.points.length;
        return { ...point, type: inner.points[next]!.type };
      })
      .reverse();
    const frame = geometryTools.flattenGlyphContours(
      [outer, inner],
      designRules.visual.comparison.subdivisionUnits,
    );
    expect(frame.errorBound).toBeLessThanOrEqual(designRules.visual.comparison.subdivisionUnits);
    const measured = geometryTools.measureGlyph({
      glyphName: "rounded",
      glyphs: new Map([["rounded", { contours: [outer, inner], components: [] }]]),
    });
    expect(measured.bounds).toEqual([100, -60, 860, 700]);
    expect(measured.center).toEqual([480, 320]);
    expect(semanticFeatures("square", frame.contours)).toEqual([]);
    expect(sourceInk(frame.contours, 480, 320)).toBe(false);
    expect(sourceInk(frame.contours, 135, 320)).toBe(true);
    const sealed = geometryTools.flattenGlyphContours(
      [outer],
      designRules.visual.comparison.subdivisionUnits,
    ).contours;
    expect(sourceInk(sealed, 480, 320)).toBe(true);
    const corner = geometryTools.contourSegments(outer)[1];
    expect(corner).toHaveLength(4);
    const center = [860 - radius, -60 + radius];
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const point = geometryTools.evaluateSegment(corner, t);
      expect(
        Math.abs(Math.hypot(point[0] - center[0]!, point[1] - center[1]!) - radius),
      ).toBeLessThanOrEqual(designRules.visual.circleApproximationError);
    }
    expect(
      geometryTools.validateFrameCornerRadius({
        radius,
        master: "outline-standard",
        design: designRules,
      }),
    ).toEqual([]);
    expect(
      geometryTools.validateFrameCornerRadius({
        radius: radius + 5,
        master: "outline-standard",
        design: designRules,
      }),
    ).not.toEqual([]);
    const broken = structuredClone(outer);
    broken.points[2]!.x += 30;
    const brokenCorner = geometryTools.contourSegments(broken)[1];
    const midpoint = geometryTools.evaluateSegment(brokenCorner, 0.5);
    expect(
      Math.abs(Math.hypot(midpoint[0] - center[0]!, midpoint[1] - center[1]!) - radius),
    ).toBeGreaterThan(designRules.visual.circleApproximationError);
  });

  it("checks analytic native shapes at the production origin in all three engines and both DPRs", async () => {
    if (!runsBrowserRefinement) return;
    const reference = await nativeReferenceFont();
    for (const error of reference.curveErrors)
      expect(error).toBeLessThanOrEqual(designRules.visual.comparison.compiledOutlineUnits);
    const css = await readFile(resolve(iconRoot, "src/styles/index.css"), "utf8");
    const sourceTools = await load(".github/scripts/modules/icons/source.mjs");
    const actualSource = await sourceTools.loadIconSource(),
      rules = actualSource.design.visual.comparison;
    const entries = Array.from({ length: 64 }, (_, index) => ({
      codepoint: 0xf0000 + (index % 4),
      rtl: "none",
      direction: "ltr",
    }));
    const paths = entries.map(
      (_entry, index) =>
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${reference.paths[index % 4]}" fill-rule="nonzero"/></svg>`,
    );
    const resources = await load(".github/scripts/modules/icons/hooks/package-assets.mjs");
    const fontCss = resources
      .packageStyles(actualSource, css)
      .replace(
        /url\([^)]*miaixz-icons\.woff2[^)]*\)/gu,
        `url("data:font/ttf;base64,${reference.bytes.toString("base64")}")`,
      )
      .replace('format("woff2")', 'format("truetype")');
    expect(fontCss).toContain("unicode-range: U+0020, U+F0000-F06F4;");
    /**
     * Constructs independent analytic circle polygons below the source subdivision bound.
     * @param radius - Font-unit mathematical radius.
     * @param reverse - Whether this is an opposing-winding counter.
     * @returns Independent closed contour, never a compiled-font outline.
     */
    const nativeCircle = (radius: number, reverse = false) => ({
      closed: true,
      points: Array.from({ length: 512 }, (_, i) => ({
        x: 480 + radius * Math.cos((i * 2 * Math.PI) / 512),
        y: 320 + radius * Math.sin(((reverse ? -1 : 1) * i * 2 * Math.PI) / 512),
        type: "line",
      })),
    });
    const nativeContours = [
      [nativeCircle(280)],
      [nativeCircle(280), nativeCircle(160, true)],
      [
        {
          closed: true,
          points: [
            [130, 280],
            [830, 280],
            [830, 360],
            [130, 360],
          ].map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
        },
      ],
      [
        {
          closed: true,
          points: [
            [440, -30],
            [520, -30],
            [520, 670],
            [440, 670],
          ].map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
        },
      ],
    ];
    for (const [browserName, browserType] of selectedRefinementBrowsers) {
      const browser = await browserType.launch(visual.coverageLaunchOptions(browserName));
      try {
        for (const dpr of [1, 2]) {
          const context = await browser.newContext({ deviceScaleFactor: dpr });
          try {
            const page = await context.newPage();
            for (const size of [12, 16, 20, 24, 32, 40]) {
              const cell = size + rules.paddingCssPixels * 2;
              await page.setViewportSize({
                width: 32 * cell,
                height: 2 * cell,
              });
              const sheets = [];
              for (const layer of ["source", "font"]) {
                await page.setContent(
                  visual.surface({
                    entries,
                    sourcePaths: paths,
                    css: fontCss,
                    size,
                    fill: 0,
                    padding: rules.paddingCssPixels,
                    layer,
                  }),
                );
                await page.evaluate(async () => {
                  const faces = await document.fonts.load(
                    '24px "Miaixz Icons"',
                    String.fromCodePoint(0xf0000),
                  );
                  if (!faces.length) throw new Error("Reference font failed to load.");
                  await document.fonts.ready;
                  await new Promise<void>((done) =>
                    requestAnimationFrame(() => requestAnimationFrame(() => done())),
                  );
                });
                const layout = await page.locator(".cell").evaluateAll((cells) =>
                  cells.map((element) => {
                    const root = element.querySelector(".miaixz-icon")!,
                      child = root.firstElementChild!,
                      style = getComputedStyle(child),
                      cellRect = element.getBoundingClientRect(),
                      rootRect = root.getBoundingClientRect(),
                      childRect = child.getBoundingClientRect();
                    return {
                      cell: [cellRect.x, cellRect.y, cellRect.width, cellRect.height],
                      root: [rootRect.x, rootRect.y, rootRect.width, rootRect.height],
                      child: [childRect.x, childRect.y, childRect.width, childRect.height],
                      fontSize: style.fontSize,
                      lineHeight: style.lineHeight,
                      axes: style.fontVariationSettings,
                      character: child.getAttribute("data-miaixz-icon-glyph"),
                      viewBox: child.querySelector("svg")?.getAttribute("viewBox"),
                    };
                  }),
                );
                expect(layout).toHaveLength(entries.length);
                for (const [index, box] of layout.entries()) {
                  const x = (index % 32) * cell,
                    y = Math.floor(index / 32) * cell,
                    origin = [x + rules.paddingCssPixels, y + rules.paddingCssPixels, size, size];
                  expect(box.cell).toEqual([x, y, cell, cell]);
                  expect(box.root).toEqual(origin);
                  expect(box.child).toEqual(origin);
                  if (layer === "font") {
                    expect(box.fontSize).toBe(size + "px");
                    expect(box.lineHeight).toBe(size + "px");
                    expect(box.axes).toBe('"FILL" 0, "opsz" ' + size);
                    expect(box.character).toBe(String.fromCodePoint(entries[index]!.codepoint));
                  } else expect(box.viewBox).toBe("0 0 24 24");
                }
                const raw = PNG.sync.read(await page.screenshot()),
                  sheet = visual.coverageRaster(raw);
                expect([sheet.width, sheet.height]).toEqual([32 * cell * dpr, 2 * cell * dpr]);
                /**
                 * Prove native grayscale recovery and cropping against direct byte addressing.
                 * Independent mathematical core regions also prove the actual production baseline.
                 */
                for (const [index, _entry] of entries.entries()) {
                  const extent = cell * dpr,
                    crop = visual.cropRaster(sheet, index, extent),
                    x = (index % 32) * extent,
                    y = Math.floor(index / 32) * extent;
                  const expected = Buffer.alloc(extent * extent * 4);
                  for (let row = 0; row < extent; row++)
                    for (let column = 0; column < extent; column++) {
                      const input = ((y + row) * raw.width + x + column) * 4,
                        output = (row * extent + column) * 4;
                      expected[output + 3] = 255 - raw.data[input]!;
                    }
                  expect(crop.data.equals(expected)).toBe(true);
                  const regions = visual.referencePixelRegions({
                    contours: nativeContours[index % 4],
                    size,
                    dpr,
                    rules,
                    unitsPerEm: 960,
                  });
                  const measured = visual.compareReferenceCoverage(crop, crop, regions, rules),
                    sampleKey = JSON.stringify({ browserName, dpr, size, layer, index });
                  expect(
                    { empty: measured.sourceEmpty, clipped: measured.clipped },
                    sampleKey,
                  ).toEqual({ empty: false, clipped: false });
                  expect(
                    visual.referenceRasterFailures(measured, rules, sampleKey),
                    sampleKey,
                  ).toEqual([]);
                }
                sheets.push(sheet);
              }
              expect(sheets).toHaveLength(2);
            }
          } finally {
            await context.close();
          }
        }
      } finally {
        await browser.close();
      }
    }
  }, 120_000);

  it("independently calculates all thirty six-master interpolation states and rejects invalid axes", () => {
    const masters = [
      { location: { FILL: 0, opsz: 12 } },
      { location: { FILL: 0, opsz: 24 } },
      { location: { FILL: 0, opsz: 40 } },
      { location: { FILL: 1, opsz: 12 } },
      { location: { FILL: 1, opsz: 24 } },
      { location: { FILL: 1, opsz: 40 } },
    ];
    const basePoints = [
      [100, 100],
      [800, 100],
      [800, 600],
      [100, 600],
    ];
    const rawMasters = masters.map((_master, index) => {
      const contour = {
        closed: true,
        outlineIndex: 0,
        points: basePoints.map(([x, y], pointIndex) => ({
          x: x! + index * (10 + pointIndex * 3),
          y: y! + index * (pointIndex * 2 - 3),
          type: "line",
          smooth: false,
          name: null as string | null,
        })),
      };
      return new Map([
        [
          "miaixz.fixture",
          {
            contours: [contour],
            components: [],
            topologySignature: "independent-four-lines",
          },
        ],
      ]);
    });
    const source = { masters, rawMasters };
    for (const size of [12, 16, 20, 24, 32, 40])
      for (const fill of [0, 0.25, 0.5, 0.75, 1]) {
        const opticalIndex = size <= 24 ? (size - 12) / 12 : 1 + (size - 24) / 16;
        const result = interpolationTools.interpolateIconSource({
          source,
          glyphName: "miaixz.fixture",
          fill,
          opticalSize: size,
        });
        const factor = opticalIndex + fill * 3;
        const expected = basePoints.map(([x, y], pointIndex) => [
          x! + factor * (10 + pointIndex * 3),
          y! + factor * (pointIndex * 2 - 3),
        ]);
        expect(result.contours).toHaveLength(1);
        expect(result.contours[0].points).toHaveLength(basePoints.length);
        for (const [pointIndex, [x, y]] of expected.entries()) {
          expect(result.contours[0].points[pointIndex].x).toBeCloseTo(x!, 12);
          expect(result.contours[0].points[pointIndex].y).toBeCloseTo(y!, 12);
          expect(result.contours[0].points[pointIndex].type).toBe("line");
        }
        const xs = expected.map(([x]) => x!),
          ys = expected.map(([, y]) => y!);
        expect(result.measurement.width).toBeCloseTo(Math.max(...xs) - Math.min(...xs), 12);
        expect(result.measurement.height).toBeCloseTo(Math.max(...ys) - Math.min(...ys), 12);
      }
    for (const [fill, size] of [
      [NaN, 24],
      [Infinity, 24],
      [-0.1, 24],
      [1.1, 24],
      [0, NaN],
      [0, Infinity],
      [0, 11],
      [0, 41],
    ])
      expect(() =>
        interpolationTools.interpolateIconSource({
          source,
          glyphName: "miaixz.fixture",
          fill,
          opticalSize: size,
        }),
      ).toThrow(/axes/);
    const missing = {
      masters: masters.slice(1),
      rawMasters: rawMasters.slice(1),
    };
    expect(() =>
      interpolationTools.compatibleSourceContours({
        source: missing,
        glyphName: "miaixz.fixture",
      }),
    ).toThrow(/Six/);
    const mismatch = structuredClone(source);
    mismatch.rawMasters[5]!.get("miaixz.fixture")!.contours[0]!.points[0]!.name = "different";
    expect(() =>
      interpolationTools.compatibleSourceContours({
        source: mismatch,
        glyphName: "miaixz.fixture",
      }),
    ).toThrow(/topology/);
    const missingPoint = structuredClone(source);
    missingPoint.rawMasters[5]!.get("miaixz.fixture")!.contours[0]!.points.pop();
    expect(() =>
      interpolationTools.compatibleSourceContours({
        source: missingPoint,
        glyphName: "miaixz.fixture",
      }),
    ).toThrow(/topology/);
    const reverse = structuredClone(source);
    reverse.rawMasters[5]!.get("miaixz.fixture")!.contours[0]!.points.reverse();
    expect(() =>
      interpolationTools.compatibleSourceContours({
        source: reverse,
        glyphName: "miaixz.fixture",
      }),
    ).toThrow(/orientation/);
    const duplicate = structuredClone(source);
    duplicate.masters[5] = structuredClone(duplicate.masters[0]!);
    expect(() =>
      interpolationTools.compatibleSourceContours({
        source: duplicate,
        glyphName: "miaixz.fixture",
      }),
    ).toThrow(/Duplicate/);
  });

  it("accepts independent geometric star, clock, square and exact-dot positive fixtures", () => {
    const circle = Array.from({ length: 360 }, (_, angle) => [
      480 + 350 * Math.cos((angle * Math.PI) / 180),
      320 + 350 * Math.sin((angle * Math.PI) / 180),
    ]);
    circle.push(circle[0]!);
    const hole = circle
      .map((point) => [480 + (point[0]! - 480) * 0.8, 320 + (point[1]! - 320) * 0.8])
      .reverse();
    const square = [
      [100, -60],
      [860, -60],
      [860, 700],
      [100, 700],
      [100, -60],
    ];
    expect(semanticFeatures("circle", [circle])).toEqual([]);
    expect(semanticFeatures("square", [square])).toEqual([]);
    const star = Array.from({ length: 10 }, (_, index) => {
      const angle = Math.PI / 2 + (index * Math.PI) / 5,
        radius = index % 2 === 0 ? 390 : 180;
      return [480 + radius * Math.cos(angle), 320 + radius * Math.sin(angle)];
    });
    star.push(star[0]!);
    expect(semanticFeatures("star", [star])).toEqual([]);
    expect(semanticFeatures("star-half", [circle, hole])).toContain("five-point star exterior");
    for (let hour = 1; hour <= 12; hour++) {
      const angle = (hour * Math.PI) / 6,
        dx = Math.sin(angle),
        dy = Math.cos(angle);
      const hand = [
        [480 - dy * 30, 320 + dx * 30],
        [480 + dx * 220 - dy * 30, 320 + dy * 220 + dx * 30],
        [480 + dx * 220 + dy * 30, 320 + dy * 220 - dx * 30],
        [480 + dy * 30, 320 - dx * 30],
      ];
      hand.push(hand[0]!);
      const minute = [
        [450, 320],
        [510, 320],
        [510, 540],
        [450, 540],
        [450, 320],
      ];
      /**
       * Both hand contours use the same winding as the outer circle.
       */
      hand.reverse();
      expect(
        semanticFeatures("clock-hour-" + hour, [circle, hole, hand, minute]),
        "hour " + hour,
      ).toEqual([]);
    }
    for (let count = 1; count <= 6; count++) {
      const dots = Array.from({ length: count }, (_, index) => {
        const x = 280 + (index % 3) * 200,
          y = 180 + Math.floor(index / 3) * 280;
        const dot = Array.from({ length: 72 }, (_, step) => [
          x + 35 * Math.cos((step * Math.PI) / 36),
          y + 35 * Math.sin((step * Math.PI) / 36),
        ]);
        dot.push(dot[0]!);
        return dot;
      });
      expect(semanticFeatures("dice-" + count, [square, ...dots])).toEqual([]);
    }
  });
});

describe("refinement source semantics", () => {
  it("keeps the repaired small counters oriented on the font integer grid in every source state", async () => {
    const reader = await load(".github/scripts/modules/icons/fonts/read-font-source.mjs"),
      font = await reader.inspectFontSource({ fontsRoot: sourceTools.fontsRoot });
    for (const [name, holes] of [
      ["roller-coaster", [6]],
      ["square-scissors", [3, 5]],
      ["star", [1]],
    ] as const) {
      const glyphName = "miaixz." + name,
        compatible = interpolationTools.compatibleSourceContours({ source: font, glyphName });
      for (const opticalSize of [12, 16, 20, 24, 32, 40])
        for (const fill of [0, 0.25, 0.5, 0.75, 1]) {
          const current = interpolationTools.interpolateIconSource({
            source: font,
            glyphName,
            compatible,
            opticalSize,
            fill,
          });
          for (const index of holes) {
            const original = current.contours[index],
              rounded = {
                ...original,
                points: original.points.map((point: { x: number; y: number }) => ({
                  ...point,
                  x: Math.round(point.x),
                  y: Math.round(point.y),
                })),
              };
            expect(
              Math.sign(interpolationTools.contourSignedArea(rounded)),
              name + " " + opticalSize + " " + fill + " counter " + index,
            ).toBe(Math.sign(interpolationTools.contourSignedArea(original)));
          }
        }
    }
  }, 30_000);

  it("checks every closed TC01–TC13 semantic identity in all six masters", async () => {
    const sourceTools = await load(".github/scripts/modules/icons/source.mjs"),
      reader = await load(".github/scripts/modules/icons/fonts/read-font-source.mjs");
    const source = await sourceTools.loadIconSource(),
      font = await reader.inspectFontSource({
        fontsRoot: sourceTools.fontsRoot,
      });
    const selected = source.icons.filter((icon: { name: string }) =>
      activeSemanticNames.has(icon.name),
    );
    expect(selected.map((icon: { name: string }) => icon.name).sort()).toEqual(
      [...activeSemanticNames].sort(),
    );
    expect(font.rawMasters).toHaveLength(6);
    for (const icon of selected) {
      for (const [index, master] of font.rawMasters.entries()) {
        const glyph = master.get("miaixz." + icon.name);
        expect(glyph, icon.name + " master " + index + " missing source glyph").toBeDefined();
        const contours = geometryTools.flattenGlyphContours(
          glyph.contours,
          designRules.visual.comparison.subdivisionUnits,
        ).contours;
        expect(semanticFeatures(icon.name, contours), icon.name + " master " + index).toEqual([]);
      }
    }
    for (const [index, master] of font.rawMasters.entries())
      for (const [family, sequence] of Object.entries(strengthSeries)) {
        const samples = sequence.map(([name]) => ({
          name,
          contours: geometryTools.flattenGlyphContours(
            master.get("miaixz." + name).contours,
            designRules.visual.comparison.subdivisionUnits,
          ).contours,
        }));
        expect(strengthSequenceFeatures(family, samples), family + " master " + index).toEqual([]);
      }
    for (const [index, master] of font.rawMasters.entries()) {
      const table = geometryTools.flattenGlyphContours(
        master.get("miaixz.table").contours,
        designRules.visual.comparison.subdivisionUnits,
      ).contours;
      for (const operation of ["merge", "split"] as const) {
        const variant = geometryTools.flattenGlyphContours(
          master.get("miaixz.table-cells-" + operation).contours,
          designRules.visual.comparison.subdivisionUnits,
        ).contours;
        expect(
          tableMutationFeatures(table, variant, operation),
          "table-cells-" + operation + " master " + index,
        ).toEqual([]);
      }
    }
  }, 120_000);
});

describe("refinement contract fixtures", () => {
  it("rejects missing frames, false half-stars, identical hour directions and filled-in essential holes", () => {
    const rectangle = [
      [100, -60],
      [860, -60],
      [860, 700],
      [100, 700],
      [100, -60],
    ];
    expect(semanticFeatures("circle-check", [rectangle])).toContain("circular frame");
    expect(semanticFeatures("square-check", [])).toContain("square container");
    expect(semanticFeatures("star-half", [rectangle])).toContain("five-point star exterior");
    expect(semanticFeatures("star-half", [rectangle])).toContain(
      "left filled and right hollow star",
    );
    expect(semanticFeatures("clock-hour-1", [rectangle])).toContain(
      "named hour and twelve-o'clock minute hand",
    );
    expect(semanticFeatures("dice-6", [rectangle])).toContain("exact dice dot count");
  });
});

describe("refinement source semantics", () => {
  it("keeps the application's action and object glyphs compatible and within the unchanged design bounds", async () => {
    const sourceTools = await load(".github/scripts/modules/icons/source.mjs"),
      reader = await load(".github/scripts/modules/icons/fonts/read-font-source.mjs"),
      interpolation = await load(".github/scripts/modules/icons/fonts/interpolate-icon-source.mjs"),
      geometry = await load(".github/scripts/modules/icons/fonts/font-geometry.mjs"),
      source = await sourceTools.loadIconSource(),
      font = await reader.inspectFontSource({
        fontsRoot: sourceTools.fontsRoot,
      });
    const names = source.icons.map((icon: { name: string }) => icon.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      const icon = source.icons.find((item: { name: string }) => item.name === name);
      expect(icon, name).toBeDefined();
      expect(() =>
        interpolation.compatibleSourceContours({
          source: font,
          glyphName: "miaixz." + name,
        }),
      ).not.toThrow();
      for (const glyphs of font.rawMasters) {
        const glyphName = "miaixz." + name,
          glyph = glyphs.get(glyphName),
          measurement = geometry.measureGlyph({ glyphName, glyphs });
        expect(glyph.codepoints, name).toContain(icon.codepoint);
        expect(
          geometry.validateGlyphGeometry({
            measurement,
            opticalClass: icon.opticalClass,
            design: source.design,
          }).violations,
          name,
        ).toEqual([]);
        const segments = new Set<string>();
        for (const contour of glyph.contours) {
          for (const segment of geometry.contourSegments(contour)) {
            const points = segment.map((point: number[]) =>
                point.map((value: number) => Math.round(value * 1000) / 1000),
              ),
              forward = JSON.stringify(points),
              reverse = JSON.stringify([...points].reverse()),
              key = forward < reverse ? forward : reverse;
            expect(segments.has(key), name + " must not repeat a boundary segment").toBe(false);
            segments.add(key);
          }
        }
        /**
         * Candidate rectangles are not a defect oracle; semantic checks decide their role.
         */
      }
    }
  }, 120_000);

  it("does not collapse unrelated semantic bodies back to the shared prototype", async () => {
    const sourceTools = await load(".github/scripts/modules/icons/source.mjs"),
      reader = await load(".github/scripts/modules/icons/fonts/read-font-source.mjs"),
      font = await reader.inspectFontSource({
        fontsRoot: sourceTools.fontsRoot,
      });
    for (const glyphs of font.rawMasters) {
      const body = (name: string) => JSON.stringify(glyphs.get("miaixz." + name).contours);
      for (const [left, right] of [
        ["help", "info"],
        ["delete", "close"],
        ["circle-check", "circle-check-big"],
        ["circle-power", "loading"],
        ["link", "component"],
        ["box", "boxes"],
        ["folder-plus", "folder-tree"],
        ["calendar-days", "calendar-range"],
        ["file-text", "file-chart-column"],
        ["user-round", "user-plus"],
      ] as const) {
        expect(body(left), left + "/" + right).not.toBe(body(right));
      }
      expect(
        semanticFeatures(
          "circle-power",
          geometryTools.flattenGlyphContours(
            glyphs.get("miaixz.circle-power").contours,
            designRules.visual.comparison.subdivisionUnits,
          ).contours,
        ),
      ).toEqual([]);
      expect(glyphs.get("miaixz.boxes").contours).toHaveLength(12);
      expect(glyphs.get("miaixz.component").contours).toHaveLength(8);
      expect(glyphs.get("miaixz.folder-tree").contours).toHaveLength(8);
    }
  }, 30_000);
});
