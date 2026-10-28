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
 * Defines the datagrid public type contracts.
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { TableGutter, TableRowHeight } from "../table/table.types.js";

/**
 * Datagrid sort directions permitted by the component contract.
 */
export type DatagridSortDirection = "ascending" | "descending";
/**
 * Column identifier and direction of the active datagrid sort.
 */
export interface DatagridSort {
  readonly columnId: string;
  readonly direction: DatagridSortDirection;
}
/**
 * Column identity, heading, value rendering, and optional sorting configuration.
 */
export interface DatagridColumn<Row> {
  readonly id: string;
  readonly header: ReactNode;
  readonly cell: (row: Readonly<Row>) => ReactNode;
  readonly sortable?: boolean;
  readonly align?: "start" | "center" | "end";
  readonly widthPercent?: number;
  /**
   * Preserves wrapping by default or truncates cell content to one line.
   */
  readonly overflow?: "wrap" | "ellipsis";
  /**
   * Native CSS column width, including fixed lengths and calculations; exclusive with widthPercent.
   */
  readonly width?: CSSProperties["width"];
}

/**
 * Exclusive disabled, single-row, or multiple-row controlled selection settings.
 */
export type DatagridSelectionProps =
  | {
      readonly selectionMode?: "none";
      readonly selectedRowIds?: never;
      readonly onSelectedRowIdsChange?: never;
      readonly selectionWidthPercent?: never;
    }
  | {
      readonly selectionMode: "single";
      readonly selectedRowIds: readonly [] | readonly [string];
      readonly onSelectedRowIdsChange?: (ids: readonly [] | readonly [string]) => void;
      readonly selectionWidthPercent?: number;
    }
  | {
      readonly selectionMode: "multiple";
      readonly selectedRowIds: readonly string[];
      readonly onSelectedRowIdsChange?: (ids: readonly string[]) => void;
      readonly selectionWidthPercent?: number;
    };

/**
 * Component-specific Datagrid properties composed with the permitted native attributes.
 */
export interface MiaixzDatagridBaseProps<Row> {
  /**
   * Controls the visually located row independently of selectedRowIds.
   */
  readonly currentRowId?: string | null;
  /**
   * Reports the newly located stable row identity.
   */
  readonly onCurrentRowChange?: (id: string) => void;
  readonly rows: readonly Row[];
  readonly columns: readonly DatagridColumn<Row>[];
  readonly getRowId: (row: Readonly<Row>) => string;
  readonly sort?: DatagridSort;
  readonly onSortChange?: (sort: DatagridSort | undefined) => void;
  readonly loading?: boolean;
  readonly error?: ReactNode;
  readonly emptyState?: ReactNode;
  readonly pagination?: ReactNode;
  readonly caption: string;
  /**
   * Controls whether table content is inset from or flush with its container edges.
   *
   * @defaultValue `"inset"`
   */
  readonly gutter?: TableGutter;
  /**
   * Overrides the active Theme's table-row height for this datagrid.
   */
  readonly rowHeight?: TableRowHeight;
  readonly layout?: "auto" | "fixed";
  readonly bodyLayout?: "content" | "fill";
  readonly captionVisibility?: "visible" | "hidden";
}

/**
 * Component-specific Datagrid properties composed with the permitted native attributes.
 */
export type MiaixzDatagridOwnProps<Row> = MiaixzDatagridBaseProps<Row> & DatagridSelectionProps;
/**
 * Configures a semantic server-owned data table, not an ARIA grid. @public
 */
export type DatagridProps<Row> = MiaixzDatagridOwnProps<Row> &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDatagridOwnProps<Row> | "children">;
