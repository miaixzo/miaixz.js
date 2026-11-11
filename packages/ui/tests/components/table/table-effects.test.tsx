/**
 * Verifies table effects behavior in the UI package.
 */

import { readFileSync } from "node:fs";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  type TableLoadState,
} from "../../../src/components/table/index.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../../../src/i18n/index.js";

afterEach(cleanup);

describe("asynchronous table loading", () => {
  it("keeps the header and scroll viewport while the body presents the current query state", async () => {
    const i18n = createMiaixzI18n({ locale: "en-US", messages: miaixzUiMessages });
    const retry = vi.fn();
    const view = (state: TableLoadState) => (
      <MiaixzLocaleProvider i18n={i18n}>
        <TableContainer data-testid="viewport" loadState={state}>
          <Table aria-label="Records">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody columnCount={2} emptyState="No matching records">
              <TableRow rowId="one">
                <TableCell>First record</TableCell>
                <TableCell>View record</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </MiaixzLocaleProvider>
    );
    const { rerender } = render(view({ status: "loading" }));
    const viewport = screen.getByTestId("viewport");
    const header = screen.getByRole("columnheader", { name: "Name" });
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(viewport).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("First record")).not.toBeInTheDocument();
    const placeholders = viewport.querySelectorAll<HTMLTableRowElement>(
      'tbody > tr[data-table-state-row="loading"]',
    );
    expect(placeholders).toHaveLength(3);
    for (const row of placeholders) {
      expect(row.cells).toHaveLength(2);
      expect(row).toHaveAttribute("aria-hidden", "true");
      fireEvent.click(row.cells[0]!);
      expect(row).not.toHaveAttribute("data-current-row");
    }

    rerender(view({ status: "ready" }));
    const record = screen.getByText("First record").closest("tr");
    expect(screen.getByRole("columnheader", { name: "Name" })).toBe(header);
    expect(viewport).not.toHaveAttribute("aria-busy");
    viewport.scrollLeft = 64;
    viewport.scrollTop = 48;

    rerender(view({ status: "refreshing", result: "rows", label: "Refreshing records" }));
    expect(screen.getByText("Refreshing records")).toBeInTheDocument();
    expect(viewport.closest("[inert]")).not.toBeNull();
    expect(screen.getByText("First record").closest("tr")).toBe(record);

    rerender(view({ status: "error", result: "rows", message: "Try again", onRetry: retry }));
    expect(screen.getByTestId("viewport")).toBe(viewport);
    expect(viewport.scrollLeft).toBe(64);
    expect(viewport.scrollTop).toBe(48);
    expect(viewport.closest("[inert]")).toBeNull();
    expect(screen.getByText("First record").closest("tr")).toBe(record);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not refresh the table");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(retry).toHaveBeenCalledOnce());

    rerender(view({ status: "error", message: "No response" }));
    const errorCell = screen.getByRole("alert").closest("td");
    expect(errorCell).toHaveAttribute("colspan", "2");
    expect(screen.queryByText("First record")).not.toBeInTheDocument();

    rerender(view({ status: "empty" }));
    const empty = screen.getByText("No matching records");
    expect(empty).toHaveAttribute("colspan", "2");
    rerender(view({ status: "refreshing", result: "empty" }));
    expect(screen.getByText("No matching records")).toBe(empty);
    rerender(view({ status: "error", result: "empty", message: "No response" }));
    expect(screen.getByText("No matching records")).toBe(empty);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not refresh the table");
  });
});

describe("table row effects", () => {
  it("uses inset gutters by default and supports flush content", () => {
    const { rerender } = render(<TableContainer data-testid="container" />);
    expect(screen.getByTestId("container")).toHaveAttribute("data-gutter", "inset");

    rerender(<TableContainer data-testid="container" gutter="flush" />);
    expect(screen.getByTestId("container")).toHaveAttribute("data-gutter", "flush");
  });

  it("makes a static table scroll container focusable by default", () => {
    render(
      <TableContainer data-testid="container">
        <Table aria-label="Static records">
          <TableBody>
            <TableRow>
              <TableCell>Record</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>,
    );

    const container = screen.getByTestId("container");
    expect(container).toHaveAttribute("tabindex", "0");
    expect(container).toContainElement(screen.getByRole("table", { name: "Static records" }));
    container.focus();
    expect(container).toHaveFocus();
  });

  it("preserves an explicit container tab index and restores the default when omitted", () => {
    const { rerender } = render(<TableContainer data-testid="container" tabIndex={-1} />);
    const container = screen.getByTestId("container");
    expect(container).toHaveAttribute("tabindex", "-1");

    rerender(<TableContainer data-testid="container" tabIndex={2} />);
    expect(screen.getByTestId("container")).toBe(container);
    expect(container).toHaveAttribute("tabindex", "2");

    rerender(<TableContainer data-testid="container" />);
    expect(screen.getByTestId("container")).toBe(container);
    expect(container).toHaveAttribute("tabindex", "0");
  });

  it("exposes one global table appearance and preserves selected-row state", () => {
    render(
      <Table aria-label="Records">
        <TableBody>
          <TableRow selected>
            <TableCell>Record</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole("table");
    expect(table).not.toHaveAttribute("data-density");
    expect(table).not.toHaveAttribute("data-divider-style");
    expect(table).not.toHaveAttribute("data-presentation");
    expect(screen.getByRole("row")).toHaveAttribute("data-selected", "true");
  });

  it.each([
    [51, "51px"],
    ["clamp(44px, 5vw, 60px)", "clamp(44px, 5vw, 60px)"],
  ] as const)("supports the custom row height %s", (rowHeight, expected) => {
    render(
      <Table aria-label="Records" rowHeight={rowHeight}>
        <TableBody>
          <TableRow>
            <TableCell>Record</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveStyle({ "--miaixz-table-row-height": expected });
  });

  it("supports one exceptional row height without changing its table", () => {
    render(
      <Table aria-label="Records" rowHeight={51}>
        <TableBody>
          <TableRow rowHeight={76}>
            <TableCell>Record</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveStyle({ "--miaixz-table-row-height": "51px" });
    expect(screen.getByRole("row")).toHaveStyle({ "--miaixz-table-row-height": "76px" });
  });

  it("defines theme-aware row states without density-specific height overrides", () => {
    const css = readFileSync("src/styles/components/table.css", "utf8");
    const selectedRule = '[data-selected="true"]';
    const selectedHoverRule = "> tr:hover:not(";

    expect(css).toContain(selectedRule);
    expect(css).toContain(
      "--miaixz-table-row-hover-background: var(--miaixz-surface-role-selected-background)",
    );
    expect(css).toContain(
      "--miaixz-table-row-selected-background: var(--miaixz-surface-role-selected-background)",
    );
    expect(css).toContain(
      "--miaixz-table-row-selected-hover-background: var(--miaixz-surface-role-selected-background)",
    );
    expect(css).toContain(
      "--miaixz-table-row-active-background: var(--miaixz-surface-role-selected-background)",
    );
    expect(css).toContain(selectedHoverRule);
    expect(css).toContain(".miaixz-table > :is(thead, tbody, tfoot) > tr");
    expect(css).toContain("height: var(--miaixz-table-row-height)");
    expect(css).toContain("--miaixz-table-gutter-inline: var(--miaixz-density-panel-padding)");
    expect(css).toContain("[data-miaixz-theme] table :where(*)");
    expect(css).toContain("font-weight: var(--miaixz-font-weight-regular) !important");
    expect(css).toContain("[data-miaixz-theme] table :is(th, td)");
    expect(css).toContain("font-size: var(--miaixz-text-body-size) !important");
    expect(css).toContain("[data-miaixz-theme] table > thead > tr > :is(th, td)");
    expect(css).toContain(
      "border-block-end: var(--miaixz-border-width-default) solid var(--miaixz-color-border)",
    );
    expect(css).toContain("[data-miaixz-theme] table > tbody > tr > :is(th, td)");
    expect(css).toContain(
      "border-block-end: var(--miaixz-border-width-default) dashed var(--miaixz-color-border)",
    );
    expect(css).toContain("[data-miaixz-theme] table > tbody > tr:last-child > :is(th, td)");
    expect(css).toMatch(
      /\.miaixz-table-actions\s*\{[^}]*background-color:\s*var\(--miaixz-surface-role-panel-background\)/u,
    );
    expect(css.indexOf(selectedRule)).toBeGreaterThan(css.indexOf(".miaixz-table-actions"));
    expect(css.indexOf(selectedHoverRule)).toBeGreaterThan(css.indexOf(selectedRule));
    expect(css).not.toContain("block-size: 48px");
    expect(css).not.toContain("height: 42px");
    expect(css).not.toContain("--miaixz-table-row-height: calc(");
    expect(css).not.toContain("data-density");
    expect(css).not.toContain("data-divider-style");
    expect(css).not.toContain("data-presentation");
    expect(css).not.toContain("border-block-end-style: dashed");
    expect(css).not.toContain("font-size: var(--miaixz-text-table-header-size)");
  });
});
