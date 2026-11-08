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
 * Partitions measured rail items and groups into visible and overflow sets.
 */

import { createElement } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import type { DropdownEntry } from "../dropdown/dropdown.types.js";
import { Icon } from "@miaixz/icons";
import type { NavigationRailGroupModel, NavigationRailItem } from "./navigation-rail.types.js";

/**
 * Rail geometry captured from owned elements.
 */
export interface RailMeasurements {
  /**
   * Available body height.
   */
  readonly available: number;
  /**
   * Overflow control height.
   */
  readonly overflow: number;
  /**
   * Heights keyed by group id.
   */
  readonly groups: ReadonlyMap<string, number>;
  /**
   * Heights keyed by item id.
   */
  readonly items: ReadonlyMap<string, number>;
}

/**
 * Deterministic result of one adaptive rail calculation.
 */
export interface RailLayout {
  /**
   * Item ids retained in the rail.
   */
  readonly visibleIds: ReadonlySet<string>;
  /**
   * Items moved to the overflow menu.
   */
  readonly overflowItems: readonly NavigationRailItem[];
  /**
   * Whether mandatory content still requires scrolling.
   */
  readonly protectedOverflow: boolean;
}

/**
 * Initial unmeasured geometry.
 */
export const emptyMeasurements: RailMeasurements = {
  available: 0,
  overflow: 0,
  groups: new Map(),
  items: new Map(),
};

/**
 * Resolves visible and overflowing items from measured geometry.
 *
 * @param groups - Structured rail groups.
 * @param measurements - Current owned element measurements.
 * @returns Deterministic adaptive layout.
 */
export function resolveRailLayout(
  groups: readonly NavigationRailGroupModel[],
  measurements: RailMeasurements,
): RailLayout {
  const items = groups.flatMap((group) => group.items);
  const visibleIds = new Set(items.map((item) => item.id));
  if (measurements.available <= 0) {
    return { visibleIds, overflowItems: [], protectedOverflow: false };
  }
  /**
   * Measures the current visible rail allocation including group chrome.
   *
   * @param reserveOverflow - Whether to reserve the overflow control height.
   * @returns Required block-axis extent in CSS pixels.
   */
  const required = (reserveOverflow: boolean) => {
    let total = reserveOverflow ? measurements.overflow : 0;
    for (const group of groups) {
      const groupItems = group.items.filter((item) => visibleIds.has(item.id));
      if (groupItems.length === 0) continue;
      const itemHeight = groupItems.reduce(
        (sum, item) => sum + (measurements.items.get(item.id) ?? 0),
        0,
      );
      const allItemHeight = group.items.reduce(
        (sum, item) => sum + (measurements.items.get(item.id) ?? 0),
        0,
      );
      const groupChrome = Math.max(0, (measurements.groups.get(group.id) ?? 0) - allItemHeight);
      total += groupChrome + itemHeight;
    }
    return total;
  };
  if (required(false) <= measurements.available) {
    return { visibleIds, overflowItems: [], protectedOverflow: false };
  }
  const removable = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.overflow !== "never" && item.current === undefined)
    .sort((left, right) => {
      const priority = (left.item.priority ?? 0) - (right.item.priority ?? 0);
      return priority === 0 ? right.index - left.index : priority;
    });
  for (const { item } of removable) {
    visibleIds.delete(item.id);
    if (required(true) <= measurements.available) break;
  }
  const overflowItems = items.filter((item) => !visibleIds.has(item.id));
  return {
    visibleIds,
    overflowItems,
    protectedOverflow: required(overflowItems.length > 0) > measurements.available,
  };
}

/**
 * Builds structured Dropdown entries for overflowing items.
 *
 * @param groups - Structured rail groups.
 * @param overflowItems - Items selected by the layout.
 * @param instanceId - Stable component instance id.
 * @returns Dropdown entries in group order.
 */
export function createOverflowEntries(
  groups: readonly NavigationRailGroupModel[],
  overflowItems: readonly NavigationRailItem[],
  instanceId: string,
): readonly DropdownEntry[] {
  const ids = new Set(overflowItems.map((item) => item.id));
  const entries: DropdownEntry[] = [];
  groups.forEach((group, groupIndex) => {
    const items = group.items.filter((item) => ids.has(item.id));
    if (items.length === 0) return;
    if (entries.length > 0) {
      entries.push({ kind: "divider", id: `${instanceId}-divider-${groupIndex}` });
    }
    entries.push({ kind: "label", id: `${instanceId}-label-${groupIndex}`, label: group.label });
    for (const item of items) {
      entries.push({
        kind: "link",
        id: item.id,
        label: item.label,
        textValue: item.textValue,
        href: item.href,
        ...(item.anchorProps === undefined ? {} : { anchorProps: item.anchorProps }),
        ...(item.meta === undefined ? {} : { description: item.meta }),
        icon:
          item.icon === undefined
            ? null
            : createElement(Icon, { name: item.icon, size: "control" }),
      });
    }
  });
  return entries;
}

/**
 * Validates unique ids and searchable item text.
 *
 * @param groups - Structured rail groups.
 */
export function validateRail(groups: readonly NavigationRailGroupModel[]): void {
  const ids = new Set<string>();
  for (const group of groups) {
    if (ids.has(group.id)) throwDuplicate(group.id);
    ids.add(group.id);
    for (const item of group.items) {
      if (ids.has(item.id)) throwDuplicate(item.id);
      ids.add(item.id);
      if (item.textValue.trim() === "") {
        throw new MiaixzUiError({
          code: "UI_NAVIGATION_TEXT_VALUE_INVALID",
          details: { id: item.id },
        });
      }
    }
  }
}

/**
 * Throws the canonical duplicate id error.
 *
 * @param id - Duplicate public id.
 */
function throwDuplicate(id: string): never {
  throw new MiaixzUiError({ code: "UI_NAVIGATION_DUPLICATE_ID", details: { id } });
}

/**
 * Reads the measured block size of an owned element.
 *
 * @param element - Measured element or null.
 * @returns Its block size in pixels.
 */
export function getBlockSize(element: HTMLElement | null): number {
  if (element === null) return 0;
  return element.getBoundingClientRect().height || element.offsetHeight;
}
