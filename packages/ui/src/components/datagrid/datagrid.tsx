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
 * Implements the datagrid UI component.
 */

import { forwardRef, useId, useMemo, type ReactElement, type RefAttributes } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { Checkbox } from "../checkbox/checkbox.js";
import { Icon } from "@miaixz/icons";
import { Overlay } from "../overlay/overlay.js";
import { Radio } from "../radio/radio.js";
import { Scroll } from "../scroll/scroll.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table/table.js";
import type {
  DatagridColumn,
  DatagridProps,
  DatagridSort,
  DatagridSortDirection,
} from "./datagrid.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Stable row identity paired with its application-defined cell data.
 */
interface DatagridRow<Row> {
  readonly id: string;
  readonly value: Row;
}

/**
 * Validates an optional percentage used by datagrid column geometry.
 *
 * @param value - Percentage to validate when present.
 * @returns Nothing after validation.
 * @throws MiaixzUiError when the percentage is non-finite or outside the supported range.
 */
function validatePercent(value: number | undefined): void {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0 || value > 100)) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }
}

/**
 * Validates column identifiers and optional percentage widths.
 *
 * @typeParam Row - Row value represented by the columns.
 * @param columns - Column definitions to validate.
 * @returns Nothing after validation.
 * @throws MiaixzUiError when a column identifier is duplicated or a width is invalid.
 */
function validateColumns<Row>(columns: readonly DatagridColumn<Row>[]): void {
  const ids = new Set<string>();
  for (const column of columns) {
    if (ids.has(column.id)) {
      throw new MiaixzUiError({
        code: "UI_TABLE_DUPLICATE_COLUMN_ID",
        details: { id: column.id },
      });
    }
    validatePercent(column.widthPercent);
    if (
      column.width !== undefined &&
      (column.widthPercent !== undefined ||
        (typeof column.width === "number" &&
          (!Number.isFinite(column.width) || column.width <= 0)) ||
        (typeof column.width === "string" && column.width.trim() === ""))
    ) {
      throw new MiaixzUiError({ code: "UI_CONTROLLED_VALUE_INVALID" });
    }
    ids.add(column.id);
  }
}

/**
 * Resolves stable row identifiers while preserving source row order.
 *
 * @typeParam Row - Row value type.
 * @param rows - Source rows to normalize.
 * @param getRowId - Callback that returns each row's stable identifier.
 * @returns Datagrid rows paired with unique identifiers.
 * @throws MiaixzUiError when multiple rows resolve to the same identifier.
 */
function resolveRows<Row>(
  rows: readonly Row[],
  getRowId: (row: Readonly<Row>) => string,
): readonly DatagridRow<Row>[] {
  const ids = new Set<string>();
  return rows.map((value) => {
    const id = getRowId(value);
    if (ids.has(id)) {
      throw new MiaixzUiError({
        code: "UI_TABLE_DUPLICATE_ROW_ID",
        details: { id },
      });
    }
    ids.add(id);
    return { id, value };
  });
}

/**
 * Advances a column through ascending, descending, and unsorted states.
 *
 * @param columnId - Column selected for sorting.
 * @param current - Current datagrid sort state.
 * @returns Next sort state, or undefined after descending order.
 */
function getNextSort(columnId: string, current: DatagridSort | undefined) {
  if (current?.columnId !== columnId) return { columnId, direction: "ascending" as const };
  if (current.direction === "ascending") return { columnId, direction: "descending" as const };
  return undefined;
}

/**
 * Resolves the active sort direction for one column.
 *
 * @param columnId - Column whose direction should be resolved.
 * @param sort - Current datagrid sort state.
 * @returns Active direction for the column, or undefined when another column is sorted.
 */
function getSortDirection(
  columnId: string,
  sort: DatagridSort | undefined,
): DatagridSortDirection | undefined {
  return sort?.columnId === columnId ? sort.direction : undefined;
}

/**
 * Implements the generic, ref-forwarding datagrid component.
 *
 * @typeParam Row - Row value rendered by the datagrid.
 * @param properties - Datagrid data, state, behavior, and slot configuration.
 * @param reference - Forwarded datagrid root reference.
 * @returns Semantic datagrid element tree.
 */
function DatagridImplementation<Row>(
  properties: DatagridProps<Row>,
  reference: React.ForwardedRef<HTMLDivElement>,
): ReactElement {
  const {
    rows,
    columns,
    getRowId,
    sort,
    onSortChange,
    selectedRowIds,
    currentRowId,
    onCurrentRowChange,
    onSelectedRowIdsChange,
    selectionMode = "none",
    selectionWidthPercent,
    loading = false,
    error,
    emptyState,
    pagination,
    caption,
    gutter = "inset",
    captionVisibility = "visible",
    layout = "auto",
    rowHeight,
    bodyLayout = "content",
    className,
    ...props
  } = properties;
  const { t } = useMiaixzLocale();
  const radioName = useId();
  const resolvedColumns = useMemo(() => {
    validateColumns(columns);
    return columns;
  }, [columns]);
  const resolvedRows = useMemo(() => resolveRows(rows, getRowId), [getRowId, rows]);
  validatePercent(selectionWidthPercent);
  const selectedValues = selectedRowIds ?? [];
  if (selectionMode === "single" && selectedValues.length > 1) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }
  const selectedIds = new Set(selectedValues);
  const currentIds = new Set(resolvedRows.map((row) => row.id));
  const selectedCurrent = resolvedRows.filter((row) => selectedIds.has(row.id));
  const allCurrentSelected =
    resolvedRows.length > 0 && selectedCurrent.length === resolvedRows.length;
  const someCurrentSelected = selectedCurrent.length > 0 && !allCurrentSelected;
  const hasSelection = selectionMode !== "none";
  const columnCount = resolvedColumns.length + (hasSelection ? 1 : 0);
  const state = loading
    ? "loading"
    : error !== undefined
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  /**
   * Reports one row-selection change according to the active selection mode.
   *
   * @param rowId - Stable identifier of the row being toggled.
   * @param checked - Whether that row should be selected.
   * @returns No return value; disabled selection mode does not report changes.
   */
  const changeRowSelection = (rowId: string, checked: boolean) => {
    if (selectionMode === "single") {
      (onSelectedRowIdsChange as ((ids: readonly [] | readonly [string]) => void) | undefined)?.(
        checked ? [rowId] : [],
      );
      return;
    }
    if (selectionMode !== "multiple") return;
    const next = new Set(selectedIds);
    if (checked) next.add(rowId);
    else next.delete(rowId);
    (onSelectedRowIdsChange as ((ids: readonly string[]) => void) | undefined)?.([...next]);
  };
  /**
   * Toggles all rows on the current page while retaining selections on other pages.
   *
   * @returns No return value; only multiple-selection mode supports page-wide changes.
   */
  const changePageSelection = () => {
    if (selectionMode !== "multiple") return;
    const next = new Set(selectedIds);
    for (const id of currentIds) {
      if (allCurrentSelected) next.delete(id);
      else next.add(id);
    }
    (onSelectedRowIdsChange as ((ids: readonly string[]) => void) | undefined)?.([...next]);
  };

  return (
    <div
      {...props}
      ref={reference}
      aria-busy={loading || undefined}
      data-state={state}
      data-gutter={gutter}
      data-layout={layout}
      data-body-layout={bodyLayout}
      data-caption-visibility={captionVisibility}
      className={classNames("miaixz-datagrid", className)}
    >
      <Overlay active={loading} label={t("ui.loading")}>
        <Scroll
          focusable="auto"
          aria-label={caption}
          className="miaixz-table-container miaixz-table-container-plain miaixz-datagrid-container"
        >
          <Table
            trackCurrentRow={currentRowId === undefined}
            {...(onCurrentRowChange
              ? {
                  onCurrentRowChange: (row) => {
                    const id = row.dataset.rowId;
                    if (id) onCurrentRowChange(id);
                  },
                }
              : {})}
            stickyHeader={bodyLayout === "fill"}
            {...(rowHeight === undefined ? {} : { rowHeight })}
          >
            <TableCaption>{caption}</TableCaption>
            <TableHeader>
              <TableRow>
                {hasSelection && (
                  <TableHead
                    className="miaixz-datagrid-selection-cell"
                    style={
                      selectionWidthPercent === undefined
                        ? undefined
                        : { width: `${selectionWidthPercent}%` }
                    }
                  >
                    {selectionMode === "multiple" && (
                      <Checkbox
                        aria-label={t("ui.table.selectPage")}
                        checked={allCurrentSelected}
                        indeterminate={someCurrentSelected}
                        disabled={resolvedRows.length === 0 || onSelectedRowIdsChange === undefined}
                        onChange={changePageSelection}
                      />
                    )}
                  </TableHead>
                )}
                {resolvedColumns.map((column) => {
                  const direction = getSortDirection(column.id, sort);
                  return (
                    <TableHead
                      key={column.id}
                      aria-sort={direction}
                      style={
                        column.width !== undefined
                          ? { width: column.width }
                          : column.widthPercent === undefined
                            ? undefined
                            : { width: `${column.widthPercent}%` }
                      }
                      className={`miaixz-datagrid-align-${column.align ?? "start"}`}
                    >
                      {column.sortable === true ? (
                        <button
                          type="button"
                          disabled={onSortChange === undefined}
                          data-state={direction ?? "none"}
                          className="miaixz-datagrid-sort"
                          onClick={() => onSortChange?.(getNextSort(column.id, sort))}
                        >
                          <span>{column.header}</span>
                          <Icon
                            name="chevron-down"
                            size="inline"
                            className="miaixz-datagrid-sort-icon"
                          />
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {error !== undefined ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="miaixz-datagrid-state-cell">
                    <div className="miaixz-datagrid-error" role="alert">
                      {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : resolvedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="miaixz-datagrid-state-cell">
                    <div className="miaixz-datagrid-empty">{emptyState}</div>
                  </TableCell>
                </TableRow>
              ) : (
                resolvedRows.map((row) => {
                  const selected = hasSelection && selectedIds.has(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      selected={selected}
                      rowId={row.id}
                      {...(currentRowId === undefined ? {} : { current: row.id === currentRowId })}
                      {...(currentRowId === undefined || !onCurrentRowChange
                        ? {}
                        : {
                            onClickCapture: () => {
                              if (row.id !== currentRowId) onCurrentRowChange(row.id);
                            },
                            onFocusCapture: () => {
                              if (row.id !== currentRowId) onCurrentRowChange(row.id);
                            },
                          })}
                    >
                      {hasSelection && (
                        <TableCell className="miaixz-datagrid-selection-cell">
                          {selectionMode === "multiple" ? (
                            <Checkbox
                              aria-label={t("ui.table.selectRow")}
                              checked={selected}
                              disabled={onSelectedRowIdsChange === undefined}
                              onChange={(event) =>
                                changeRowSelection(row.id, event.currentTarget.checked)
                              }
                            />
                          ) : (
                            <Radio
                              aria-label={t("ui.table.selectRow")}
                              name={radioName}
                              checked={selected}
                              disabled={onSelectedRowIdsChange === undefined}
                              onChange={(event) =>
                                changeRowSelection(row.id, event.currentTarget.checked)
                              }
                            />
                          )}
                        </TableCell>
                      )}
                      {resolvedColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={`miaixz-datagrid-align-${column.align ?? "start"}`}
                        >
                          {column.overflow === "ellipsis" ? (
                            <div className="miaixz-datagrid-cell-ellipsis">
                              {column.cell(row.value)}
                            </div>
                          ) : (
                            column.cell(row.value)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Scroll>
      </Overlay>
      {pagination !== undefined && <div className="miaixz-datagrid-pagination">{pagination}</div>}
    </div>
  );
}

/**
 * Renders a semantic server-side data table. @public
 */
export const Datagrid = withMiaixzThemeComponent(
  "Datagrid",
  forwardRef(DatagridImplementation) as <Row>(
    props: DatagridProps<Row> & RefAttributes<HTMLDivElement>,
  ) => ReactElement,
);
