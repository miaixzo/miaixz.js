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
 * Verifies datagrid behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Datagrid, type DatagridColumn } from "../../../src/components/datagrid/index.js";
import { renderWithLocale } from "../../test-utils.helper.js";

afterEach(cleanup);

/**
 * Row identity and cell values used by datagrid interaction fixtures.
 */
interface Row {
  /**
   * Stable fixture identifier.
   */
  readonly id: string;
  /**
   * Visible fixture name.
   */
  readonly name: string;
}

const columns: readonly DatagridColumn<Row>[] = [
  { id: "name", header: "名称", cell: (row) => row.name, sortable: true, widthPercent: 80 },
];

describe("Datagrid", () => {
  it("preserves cell actions, full-text hints, and row selection with ellipsis enabled", () => {
    const onAction = vi.fn();
    const onSelection = vi.fn();
    renderWithLocale(
      <Datagrid
        caption="Truncated content"
        rows={[{ id: "one", name: "A long member name" }]}
        getRowId={(row) => row.id}
        columns={[
          {
            id: "name",
            header: "Name",
            overflow: "ellipsis",
            cell: (row) => (
              <button title={row.name} onClick={onAction}>
                {row.name}
              </button>
            ),
          },
        ]}
        selectionMode="multiple"
        selectedRowIds={[]}
        onSelectedRowIdsChange={onSelection}
      />,
    );
    fireEvent.click(screen.getByTitle("A long member name"));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onSelection).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("checkbox")[1]!);
    expect(onSelection).toHaveBeenCalledWith(["one"]);
  });

  it("supports fixed and calculated column widths without replacing percentage columns", () => {
    renderWithLocale(
      <Datagrid
        caption="Widths"
        layout="fixed"
        rows={[{ id: "one", name: "One" }]}
        getRowId={(row) => row.id}
        columns={[
          { id: "name", header: "Name", cell: (row) => row.name, width: "calc(100% - 240px)" },
          { id: "action", header: "Action", cell: () => "View", width: 240 },
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveStyle({
      width: "calc(100% - 240px)",
    });
    expect(screen.getByRole("columnheader", { name: "Action" })).toHaveStyle({ width: "240px" });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "", " "])(
    "rejects invalid fixed column width %s",
    (width) => {
      expect(() =>
        renderWithLocale(
          <Datagrid
            caption="Invalid"
            rows={[]}
            getRowId={(row: Row) => row.id}
            columns={[{ id: "name", header: "Name", cell: (row: Row) => row.name, width }]}
          />,
        ),
      ).toThrow();
    },
  );

  it("rejects two competing width definitions on the same column", () => {
    expect(() =>
      renderWithLocale(
        <Datagrid
          caption="Invalid"
          rows={[]}
          getRowId={(row: Row) => row.id}
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (row: Row) => row.name,
              width: 240,
              widthPercent: 20,
            },
          ]}
        />,
      ),
    ).toThrow();
  });

  it("renders a semantic table with the global appearance and custom row height", () => {
    renderWithLocale(
      <Datagrid
        bodyLayout="fill"
        caption="数据列表"
        captionVisibility="hidden"
        columns={columns}
        getRowId={(row) => row.id}
        layout="fixed"
        rowHeight={51}
        rows={[{ id: "a", name: "Alpha" }]}
        gutter="flush"
      />,
    );

    const table = screen.getByRole("table", { name: "数据列表" });
    expect(table).toBeVisible();
    const datagrid = table.closest(".miaixz-datagrid");
    expect(datagrid).toHaveAttribute("data-body-layout", "fill");
    expect(datagrid).toHaveAttribute("data-gutter", "flush");
    expect(datagrid).not.toHaveAttribute("data-surface");
    expect(datagrid).not.toHaveAttribute("data-density");
    expect(table).not.toHaveAttribute("data-density");
    expect(table).toHaveStyle({ "--miaixz-table-row-height": "51px" });
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: /名称/u })).toHaveStyle({ width: "80%" });
  });

  it("uses inset gutters by default", () => {
    renderWithLocale(
      <Datagrid
        caption="默认间距"
        columns={columns}
        getRowId={(row) => row.id}
        rows={[{ id: "a", name: "Alpha" }]}
      />,
    );

    expect(screen.getByRole("table").closest(".miaixz-datagrid")).toHaveAttribute(
      "data-gutter",
      "inset",
    );
  });

  it("cycles server-owned sorting without introducing grid semantics", () => {
    const onSortChange = vi.fn();
    renderWithLocale(
      <Datagrid
        caption="排序列表"
        columns={columns}
        getRowId={(row) => row.id}
        onSortChange={onSortChange}
        rows={[{ id: "a", name: "Alpha" }]}
      />,
    );
    expect(screen.queryByRole("grid")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "名称" }));
    expect(onSortChange).toHaveBeenCalledWith({ columnId: "name", direction: "ascending" });
  });

  it("reports multiple selection through controlled row ids", () => {
    const onSelectedRowIdsChange = vi.fn();
    renderWithLocale(
      <Datagrid
        caption="选择列表"
        columns={columns}
        getRowId={(row) => row.id}
        onSelectedRowIdsChange={onSelectedRowIdsChange}
        rows={[{ id: "a", name: "Alpha" }]}
        selectedRowIds={[]}
        selectionMode="multiple"
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "选择行" }));
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(["a"]);
  });
});

/**
 * Verifies current location stays separate from controlled checkbox selection.
 */
it("reports controlled current rows without selecting them", () => {
  const onCurrentRowChange = vi.fn();
  const onSelectedRowIdsChange = vi.fn();
  const rows = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
  ];
  renderWithLocale(
    <Datagrid
      caption="Located records"
      columns={columns}
      getRowId={(row) => row.id}
      rows={rows}
      currentRowId="a"
      onCurrentRowChange={onCurrentRowChange}
      selectionMode="multiple"
      selectedRowIds={["a"]}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
    />,
  );
  fireEvent.click(screen.getByRole("cell", { name: "Beta" }));
  expect(onCurrentRowChange).toHaveBeenCalledWith("b");
  expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
  expect(screen.getByRole("cell", { name: "Alpha" }).closest("tr")).toHaveAttribute(
    "data-current-row",
    "true",
  );
  cleanup();
  renderWithLocale(
    <Datagrid
      caption="Located records"
      columns={columns}
      getRowId={(row) => row.id}
      rows={rows}
      currentRowId="b"
      selectionMode="multiple"
      selectedRowIds={["a"]}
    />,
  );
  expect(screen.getByRole("cell", { name: "Beta" }).closest("tr")).toHaveAttribute(
    "data-current-row",
    "true",
  );
  expect(screen.getByRole("cell", { name: "Alpha" }).closest("tr")).toHaveAttribute(
    "data-selected",
    "true",
  );
});
