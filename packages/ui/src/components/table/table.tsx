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
 * Implements the table UI component.
 */

import { forwardRef, useRef, type CSSProperties } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type {
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableContainerProps,
  TableFooterProps,
  TableHeaderProps,
  TableHeadProps,
  TableProps,
  TableRowHeight,
  TableRowProps,
} from "./table.types.js";
import { useTableRowLocation } from "./use-table-row-location.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Resolves the public row-height value to a CSS length.
 *
 * @param value - Numeric pixel value or arbitrary CSS length.
 * @returns A CSS length ready for the table custom property.
 * @throws MiaixzUiError when a numeric value is non-positive or a string is empty.
 */
function resolveTableRowHeight(value: TableRowHeight): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      throw new MiaixzUiError({ code: "UI_CONTROLLED_VALUE_INVALID" });
    }
    return `${value}px`;
  }
  const resolved = value.trim();
  if (resolved.length === 0) {
    throw new MiaixzUiError({ code: "UI_CONTROLLED_VALUE_INVALID" });
  }
  return resolved;
}

/**
 * Provides responsive overflow and framing for a data table.
 *
 * @public
 */
export const TableContainer = withMiaixzThemeComponent(
  "TableContainer",
  forwardRef<HTMLDivElement, TableContainerProps>(function TableContainer(
    {
      className,
      frame = "default",
      gutter = "inset",
      surface = "default",
      minimumWidth = "default",
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={classNames(
          "miaixz-table-container",
          frame === "plain" && "miaixz-table-container-plain",
          surface === "transparent" && "miaixz-table-container-transparent",
          className,
        )}
        data-gutter={gutter}
        data-minimum-width={minimumWidth}
      />
    );
  }),
);

/**
 * Renders a semantic table with the single global Miaixz table appearance.
 *
 * @public
 */
export const Table = withMiaixzThemeComponent(
  "Table",
  forwardRef<HTMLTableElement, TableProps>(function Table(
    {
      stickyHeader = false,
      rowHeight,
      slotProps,
      trackCurrentRow = true,
      onCurrentRowChange,
      ...props
    },
    ref,
  ) {
    const tableRef = useRef<HTMLTableElement>(null);
    useTableRowLocation(tableRef, trackCurrentRow, onCurrentRowChange);
    const ownerState = { stickyHeader, rowHeight };
    const rowHeightStyle =
      rowHeight === undefined
        ? undefined
        : ({ "--miaixz-table-row-height": resolveTableRowHeight(rowHeight) } as CSSProperties);
    return (
      <table
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-table" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalRef: tableRef,
          internalProps: {
            ...(rowHeightStyle === undefined ? {} : { style: rowHeightStyle }),
            ...(stickyHeader ? { "data-sticky-header": true } : {}),
          },
          ownedProps: ["data-sticky-header"],
        })}
      />
    );
  }),
);

/**
 * Renders a table header section.
 *
 * @public
 */
export const TableHeader = withMiaixzThemeComponent(
  "TableHeader",
  forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader(
    { slotProps, ...props },
    ref,
  ) {
    return (
      <thead
        {...mergeMiaixzSlotProps({
          ownerState: {},
          defaultProps: { className: "miaixz-table-head" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
        })}
      />
    );
  }),
);

/**
 * Renders a table body section.
 *
 * @public
 */
export const TableBody = withMiaixzThemeComponent(
  "TableBody",
  forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
    { className, ...props },
    ref,
  ) {
    return <tbody {...props} ref={ref} className={classNames("miaixz-table-body", className)} />;
  }),
);

/**
 * Renders a table footer section.
 *
 * @public
 */
export const TableFooter = withMiaixzThemeComponent(
  "TableFooter",
  forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter(
    { className, ...props },
    ref,
  ) {
    return <tfoot {...props} ref={ref} className={classNames("miaixz-table-foot", className)} />;
  }),
);

/**
 * Renders a table row with optional selection state.
 *
 * @public
 */
export const TableRow = withMiaixzThemeComponent(
  "TableRow",
  forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
    { selected = false, current, rowId, rowHeight, className, style, ...props },
    ref,
  ) {
    const rowStyle =
      rowHeight === undefined
        ? style
        : ({
            ...style,
            "--miaixz-table-row-height": resolveTableRowHeight(rowHeight),
          } as CSSProperties);
    return (
      <tr
        {...props}
        ref={ref}
        data-selected={selected || undefined}
        data-current-row={current || undefined}
        data-current-controlled={current === undefined ? undefined : true}
        data-row-id={rowId}
        className={classNames("miaixz-table-row", className)}
        style={rowStyle}
      />
    );
  }),
);

/**
 * Renders a column or row heading cell.
 *
 * @public
 */
export const TableHead = withMiaixzThemeComponent(
  "TableHead",
  forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
    { numeric = false, actions = false, scope = "col", slotProps, ...props },
    ref,
  ) {
    const ownerState = { numeric, actions };
    return (
      <th
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: {
            className: classNames(
              "miaixz-table-header",
              numeric && "miaixz-table-numeric",
              actions && "miaixz-table-actions",
            ),
          },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { scope },
          ownedProps: ["scope"],
        })}
      />
    );
  }),
);

/**
 * Renders a standard table data cell.
 *
 * @public
 */
export const TableCell = withMiaixzThemeComponent(
  "TableCell",
  forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
    { numeric = false, actions = false, empty = false, className, ...props },
    ref,
  ) {
    return (
      <td
        {...props}
        ref={ref}
        data-empty={empty || undefined}
        className={classNames(
          "miaixz-table-cell",
          numeric && "miaixz-table-numeric",
          actions && "miaixz-table-actions",
          className,
        )}
      />
    );
  }),
);

/**
 * Renders an accessible table caption.
 *
 * @public
 */
export const TableCaption = withMiaixzThemeComponent(
  "TableCaption",
  forwardRef<HTMLTableCaptionElement, TableCaptionProps>(function TableCaption(
    { className, ...props },
    ref,
  ) {
    return (
      <caption {...props} ref={ref} className={classNames("miaixz-table-caption", className)} />
    );
  }),
);
