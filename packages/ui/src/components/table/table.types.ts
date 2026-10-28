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
 * Defines the table public type contracts.
 */

import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Controls whether table content is inset from or flush with its container edges.
 *
 * @public
 */
export type TableGutter = "inset" | "flush";

/**
 * Configures the responsive table framing container.
 *
 * @public
 */
export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the table's inline spacing within its container.
   *
   * @defaultValue `"inset"`
   */
  gutter?: TableGutter;
  /**
   * Removes the outer frame without disabling table scrolling.
   *
   * @defaultValue `"default"`
   */
  frame?: "default" | "plain";
  /**
   * Selects the existing panel background or an explicitly transparent surface.
   *
   * @defaultValue `"default"`
   */
  surface?: "default" | "transparent";
  /**
   * Selects the minimum table width used before horizontal scrolling begins.
   *
   * @defaultValue `"default"`
   */
  minimumWidth?: "default" | "compact";
}

/**
 * Explicit table row height. Numeric values are interpreted as CSS pixels; strings accept any
 * valid CSS length or custom-property expression.
 */
export type TableRowHeight = number | string;
/**
 * Named Table parts available for slot and style customization.
 */
export type TableSlot = "root";
/**
 * Resolved Table state exposed to theme and slot overrides.
 */
export interface TableOwnerState {
  readonly stickyHeader: boolean;
  readonly rowHeight: TableRowHeight | undefined;
}
/**
 * Attributes accepted by the Table Root slot.
 */
export type TableRootAttributes = TableHTMLAttributes<HTMLTableElement> &
  RefAttributes<HTMLTableElement> & {
    readonly "data-sticky-header"?: boolean;
  };
/**
 * Properties accepted by the Table renderer.
 */
export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /**
   * Keeps the clicked or keyboard-focused row visually located. Disable for controlled current rows.
   */
  readonly trackCurrentRow?: boolean;
  /**
   * Reports visual location independently of checkbox selection.
   */
  readonly onCurrentRowChange?: (row: HTMLTableRowElement) => void;
  /**
   * Keeps header rows visible within the table scroll container.
   *
   * @defaultValue `false`
   */
  stickyHeader?: boolean;
  /**
   * Overrides the active Theme's table-row height for this table.
   *
   * @example `51` or `"clamp(44px, 5vw, 60px)"`
   */
  readonly rowHeight?: TableRowHeight;
  readonly slotProps?: { readonly root?: MiaixzSlotProps<TableOwnerState, TableRootAttributes> };
}

/**
 * Configures the table header section.
 *
 * @public
 */
export type TableHeaderSlot = "root";
/**
 * Empty owner-state contract for table-header slot overrides.
 */
export type TableHeaderOwnerState = Record<never, never>;
/**
 * Properties accepted by the Table Header renderer.
 */
export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  readonly slotProps?: {
    readonly root?: MiaixzSlotProps<
      TableHeaderOwnerState,
      HTMLAttributes<HTMLTableSectionElement> & RefAttributes<HTMLTableSectionElement>
    >;
  };
}

/**
 * Configures the table body section.
 *
 * @public
 */
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures the table footer section.
 *
 * @public
 */
export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures one semantic table row.
 *
 * @public
 */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /**
   * Controls current-row highlighting independently of business selection.
   */
  readonly current?: boolean;
  /**
   * Stable record identity, also used by Datagrid current-row notifications.
   */
  readonly rowId?: string;
  /**
   * Applies the selected-row treatment.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
  /**
   * Overrides the containing table's row height for this row only.
   */
  readonly rowHeight?: TableRowHeight;
}

/**
 * Configures a semantic table heading cell.
 *
 * @public
 */
export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  readonly scope?: "col" | "row" | "colgroup" | "rowgroup";
  /**
   * Aligns and formats the heading as numeric content.
   *
   * @defaultValue `false`
   */
  numeric?: boolean;
  /**
   * Aligns the heading with an action column.
   *
   * @defaultValue `false`
   */
  actions?: boolean;
  readonly slotProps?: {
    readonly root?: MiaixzSlotProps<
      { readonly numeric: boolean; readonly actions: boolean },
      ThHTMLAttributes<HTMLTableCellElement> & RefAttributes<HTMLTableCellElement>
    >;
  };
}

/**
 * Configures a standard table data cell.
 *
 * @public
 */
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Presents this cell as an empty-result message.
   *
   * @defaultValue `false`
   */
  empty?: boolean;
  /**
   * Aligns and formats the cell as numeric content.
   *
   * @defaultValue `false`
   */
  numeric?: boolean;
  /**
   * Aligns the cell as an action column.
   *
   * @defaultValue `false`
   */
  actions?: boolean;
}

/**
 * Configures an accessible table caption.
 *
 * @public
 */
export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {}
