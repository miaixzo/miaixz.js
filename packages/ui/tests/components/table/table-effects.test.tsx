/**
 * Verifies table effects behavior in the UI package.
 */

import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "../../../src/components/table/index.js";

afterEach(cleanup);

describe("table row effects", () => {
  it("uses inset gutters by default and supports flush content", () => {
    const { rerender } = render(<TableContainer data-testid="container" />);
    expect(screen.getByTestId("container")).toHaveAttribute("data-gutter", "inset");

    rerender(<TableContainer data-testid="container" gutter="flush" />);
    expect(screen.getByTestId("container")).toHaveAttribute("data-gutter", "flush");
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
