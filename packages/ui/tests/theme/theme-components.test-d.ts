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
 * Verifies theme components behavior in the UI package.
 */

import type { ThemeComponents } from "../../src/theme/registry.js";

/**
 * Closed set of component names required in the theme registry.
 */
type ExpectedComponentName =
  | "Pressable"
  | "Button"
  | "ButtonGroup"
  | "ButtonLink"
  | "Link"
  | "Tag"
  | "ActionText"
  | "IconButton"
  | "ActionBar"
  | "MoreActions"
  | "RowActions"
  | "FormActions"
  | "Field"
  | "Input"
  | "Calendar"
  | "DatePicker"
  | "TimePicker"
  | "NumberInput"
  | "Textarea"
  | "Search"
  | "Segmented"
  | "Checkbox"
  | "Radio"
  | "Rating"
  | "Masonry"
  | "RadioGroup"
  | "Switch"
  | "Slider"
  | "Select"
  | "Combobox"
  | "Picker"
  | "Alert"
  | "Notice"
  | "Overlay"
  | "Toast"
  | "Toaster"
  | "Tooltip"
  | "Popover"
  | "Dropdown"
  | "Dialog"
  | "Disclosure"
  | "Confirm"
  | "Drawer"
  | "Toolbar"
  | "Transfer"
  | "Tabs"
  | "View"
  | "Panel"
  | "PanelHeader"
  | "PanelFooter"
  | "PanelRow"
  | "List"
  | "ListItem"
  | "ListCounter"
  | "ListMarker"
  | "Metric"
  | "Metrics"
  | "Graph"
  | "Avatar"
  | "AvatarGroup"
  | "Divider"
  | "Spinner"
  | "Hidden"
  | "Cluster"
  | "Grid"
  | "Split"
  | "Stack"
  | "Dropzone"
  | "Upload"
  | "Locale"
  | "Appearance"
  | "Badge"
  | "Status"
  | "Progress"
  | "Skeleton"
  | "Empty"
  | "Exception"
  | "Bar"
  | "Brand"
  | "Scroll"
  | "Entry"
  | "Page"
  | "Header"
  | "Shell"
  | "Sidebar"
  | "Breadcrumb"
  | "Navigation"
  | "NavigationRail"
  | "NavigationRailGroup"
  | "Pagination"
  | "Sections"
  | "Table"
  | "TableHeader"
  | "TableBody"
  | "TableRow"
  | "TableHead"
  | "TableCell"
  | "TableContainer"
  | "TableFooter"
  | "TableCaption"
  | "Datagrid"
  | "Descriptions"
  | "Tree"
  | "Steps"
  | "Timeline"
  | "EditorForm"
  | "EditorLayout"
  | "EditorSummary"
  | "EditorSection"
  | "EditorFieldset"
  | "EditorFields"
  | "EditorActions"
  | "EditorBox"
  | "EditorGroup"
  | "EditorOverview"
  | "EditorPicker"
  | "EditorStatus"
  | "Sparkline"
  | "Donut"
  | "Columns"
  | "Heatmap"
  | "HeatmapLegend";

/**
 * Requires a compile-time registry assertion to evaluate to true.
 */
type Assert<T extends true> = T;
/**
 * Compares types through generic conditional functions for registry assertions.
 */
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;

/**
 * Compile-time comparison between the declared and expected theme component names.
 */
type RegistryIsExact = Assert<Equal<keyof ThemeComponents, ExpectedComponentName>>;

const buttonTheme: NonNullable<ThemeComponents["Button"]> = {
  defaultProps: { size: "large" },
  variants: [{ props: { tone: "brand", loading: false }, slotClassNames: { root: "brand" } }],
  slotClassNames: { label: "label" },
};

const invalidComponent: ThemeComponents = {
  /**
   * @ts-expect-error Unknown component names are not accepted. */
  Unknown: {},
};

const invalidSlot: NonNullable<ThemeComponents["Button"]> = {
  /**
   * @ts-expect-error Unknown component slots are not accepted. */
  slotClassNames: { content: "content" },
};

const invalidOwnerState: NonNullable<ThemeComponents["Button"]> = {
  variants: [
    {
      /**
       * @ts-expect-error React nodes are not owner-state variant selectors. */
      props: { children: "invalid" },
      slotClassNames: { root: "invalid" },
    },
  ],
};

const treeTheme: NonNullable<ThemeComponents["Tree"]> = {
  defaultProps: { view: "compact", viewOptions: { compression: "balanced" } },
  variants: [
    {
      props: { view: "focus", boundary: true, stateExpanded: true, visualLevel: 2 },
      slotClassNames: { item: "tree-boundary", description: "tree-description" },
    },
  ],
};

const invalidTreeTheme: NonNullable<ThemeComponents["Tree"]> = {
  variants: [
    {
      /**
       * @ts-expect-error Tree theme variants use the expanded owner-state contract. */
      props: { compression: "dense" },
      slotClassNames: { item: "invalid" },
    },
  ],
};

void buttonTheme;
void treeTheme;
void invalidTreeTheme;
void invalidComponent;
void invalidSlot;
void invalidOwnerState;
/**
 * Forces the exact theme-registry comparison to satisfy the true constraint.
 */
export type RegistryExactAssertion = RegistryIsExact;
