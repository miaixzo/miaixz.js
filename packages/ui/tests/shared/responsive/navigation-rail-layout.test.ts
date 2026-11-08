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
 * Verifies navigation rail layout behavior in the UI package.
 */

import { describe, expect, it } from "vitest";

import {
  createOverflowEntries,
  getBlockSize,
  resolveRailLayout,
  validateRail,
} from "../../../src/components/navigation/navigation-rail-layout.js";
import type {
  NavigationRailGroupModel,
  NavigationRailItem,
} from "../../../src/components/navigation/navigation-rail.types.js";

/**
 * Creates a navigation rail item with deterministic defaults.
 *
 * @param id - Item identifier and default label value.
 * @param options - Item properties that override the defaults.
 * @returns Complete navigation rail item.
 */
function item(id: string, options: Partial<NavigationRailItem> = {}): NavigationRailItem {
  return {
    id,
    href: `/${id}`,
    label: id,
    textValue: id,
    ...options,
  };
}

const groups: readonly NavigationRailGroupModel[] = [
  {
    id: "primary",
    label: "Primary",
    items: [
      item("home", { current: "page", overflow: "never" }),
      item("low", { priority: -1 }),
      item("normal"),
    ],
  },
  {
    id: "secondary",
    label: "Secondary",
    placement: "end",
    items: [
      item("last", {
        icon: "settings",
        meta: "meta",
        anchorProps: { target: "_blank" },
      }),
    ],
  },
];

/**
 * Creates one deterministic navigation rail measurement snapshot.
 *
 * @param available - Available block size for visible items.
 * @returns Measurement maps used by layout resolution tests.
 */
function measurements(available: number) {
  return {
    available,
    overflow: 10,
    groups: new Map([
      ["primary", 70],
      ["secondary", 30],
    ]),
    items: new Map([
      ["home", 20],
      ["low", 20],
      ["normal", 20],
      ["last", 20],
    ]),
  };
}

describe("navigation rail layout", () => {
  it("keeps all items before measurement and when capacity is sufficient", () => {
    const unmeasured = resolveRailLayout(groups, measurements(0));
    expect([...unmeasured.visibleIds]).toEqual(["home", "low", "normal", "last"]);
    expect(unmeasured.overflowItems).toEqual([]);
    expect(unmeasured.protectedOverflow).toBe(false);

    const roomy = resolveRailLayout(groups, measurements(200));
    expect(roomy.overflowItems).toEqual([]);
    expect(roomy.protectedOverflow).toBe(false);
  });

  it("removes eligible items by priority then reverse document order", () => {
    const result = resolveRailLayout(groups, measurements(75));
    expect(result.overflowItems.map(({ id }) => id)).toEqual(["low", "last"]);
    expect([...result.visibleIds]).toEqual(["home", "normal"]);
    expect(result.protectedOverflow).toBe(false);
  });

  it("reports protected overflow when mandatory content cannot fit", () => {
    const result = resolveRailLayout(groups, measurements(5));
    expect(result.visibleIds.has("home")).toBe(true);
    expect(result.protectedOverflow).toBe(true);
    expect(result.overflowItems.map(({ id }) => id)).toEqual(["low", "normal", "last"]);
  });

  it("creates grouped Dropdown entries without flattening presentation metadata", () => {
    const entries = createOverflowEntries(
      groups,
      [groups[0]!.items[1]!, groups[1]!.items[0]!],
      "rail",
    );
    expect(entries.map(({ kind }) => kind)).toEqual(["label", "link", "divider", "label", "link"]);
    expect(entries[1]).toMatchObject({ id: "low", kind: "link", icon: null });
    expect(entries[4]).toMatchObject({
      id: "last",
      kind: "link",
      href: "/last",
      description: "meta",
      anchorProps: { target: "_blank" },
    });
    expect("icon" in entries[4]!).toBe(true);
    expect(createOverflowEntries(groups, [], "rail")).toEqual([]);
  });

  it("rejects duplicate group/item IDs and blank searchable text", () => {
    expect(() => validateRail([groups[0]!, groups[0]!])).toThrowError(
      expect.objectContaining({ code: "UI_NAVIGATION_DUPLICATE_ID" }),
    );
    expect(() => validateRail([{ id: "one", label: "One", items: [item("one")] }])).toThrowError(
      expect.objectContaining({ code: "UI_NAVIGATION_DUPLICATE_ID" }),
    );
    expect(() =>
      validateRail([
        { id: "one", label: "One", items: [item("duplicate")] },
        { id: "two", label: "Two", items: [item("duplicate")] },
      ]),
    ).toThrowError(expect.objectContaining({ code: "UI_NAVIGATION_DUPLICATE_ID" }));
    expect(() =>
      validateRail([{ id: "one", label: "One", items: [item("blank", { textValue: " " })] }]),
    ).toThrowError(expect.objectContaining({ code: "UI_NAVIGATION_TEXT_VALUE_INVALID" }));
  });

  it("measures block geometry with rect, offset, and null fallbacks", () => {
    expect(getBlockSize(null)).toBe(0);
    const element = document.createElement("div");
    element.getBoundingClientRect = () => ({ height: 24 }) as DOMRect;
    expect(getBlockSize(element)).toBe(24);
    element.getBoundingClientRect = () => ({ height: 0 }) as DOMRect;
    Object.defineProperty(element, "offsetHeight", { configurable: true, value: 18 });
    expect(getBlockSize(element)).toBe(18);
  });
});
