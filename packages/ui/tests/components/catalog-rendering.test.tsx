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
 * Verifies catalog rendering behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Badge,
  Bar,
  Brand,
  Breadcrumb,
  Checkbox,
  Cluster,
  Empty,
  Entry,
  Grid,
  Hidden,
  Input,
  Notice,
  Page,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  Slider,
  Sidebar,
  Skeleton,
  Split,
  Stack,
  Status,
  Switch,
  Textarea,
  Timeline,
  Toast,
  Toolbar,
} from "../../src/index.js";
import { renderWithLocale } from "../test-utils.helper.js";

afterEach(cleanup);

describe("catalog presentation components", () => {
  it("finishes real loading before removing the visual and can restart during completion", () => {
    const onAnimationEnd = vi.fn();
    const animationEnd = "AnimationEvent" in window ? "animationend" : "webkitAnimationEnd";
    const { container, rerender } = renderWithLocale(<Bar active={false} />);
    expect(container.querySelector(".miaixz-bar")).toBeNull();

    rerender(<Bar active label="Loading" />);
    const bar = screen.getByRole("progressbar", { name: "Loading" });
    expect(bar).toHaveAttribute("data-state", "indeterminate");
    rerender(<Bar active={false} onAnimationEnd={onAnimationEnd} />);
    expect(container.querySelector(".miaixz-bar")).toBe(bar);
    expect(bar).toHaveAttribute("data-state", "complete");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("progressbar")).toBeNull();

    fireEvent(
      bar.firstElementChild!,
      Object.assign(new Event(animationEnd, { bubbles: true }), {
        animationName: "miaixz-bar-complete",
      }),
    );
    expect(container.querySelector(".miaixz-bar")).toBe(bar);
    rerender(<Bar active label="Retrying" />);
    fireEvent(
      bar,
      Object.assign(new Event(animationEnd, { bubbles: true }), {
        animationName: "miaixz-bar-complete",
      }),
    );
    expect(screen.getByRole("progressbar", { name: "Retrying" })).toBe(bar);

    rerender(<Bar active={false} onAnimationEnd={onAnimationEnd} />);
    fireEvent(
      bar,
      Object.assign(new Event(animationEnd, { bubbles: true }), {
        animationName: "miaixz-bar-complete",
      }),
    );
    expect(onAnimationEnd).toHaveBeenCalledTimes(2);
    expect(onAnimationEnd.mock.calls.at(-1)?.[0].animationName).toBe("miaixz-bar-complete");
    expect(container.querySelector(".miaixz-bar")).toBeNull();
  });

  it("renders status, loading, empty, and brand variants with canonical state", () => {
    const { container } = renderWithLocale(
      <Stack gap="medium">
        <Badge icon={<span>!</span>} marker tone="success" variant="outlined">
          Ready
        </Badge>
        <Status tone="danger">Failed</Status>
        <Notice live="assertive" tone="warning">
          Warning
        </Notice>
        <Bar active label="Loading" max={200} value={50} />
        <Bar active decorative />
        <Bar active label="Indeterminate" />
        <Bar active={false} />
        <Progress label="Uploading" max={200} showValue value={50} />
        <Progress label="Working" />
        <Skeleton height={20} variant="rounded" width="50%" />
        <Empty
          actions={<button type="button">Retry</button>}
          compact
          description="Nothing matched"
          icon={<span>?</span>}
          title="No results"
          variant="framed"
        />
        <Brand mark={<span>M</span>} name="Miaixz" />
      </Stack>,
    );
    expect(screen.getByText("Ready").closest(".miaixz-badge")).toHaveAttribute(
      "data-tone",
      "success",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Warning");
    expect(screen.getByRole("progressbar", { name: "Loading" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(screen.getByRole("progressbar", { name: "Uploading" })).toHaveTextContent("25%");
    expect(screen.getByRole("heading", { name: "No results" })).toBeVisible();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("renders layout primitives with their single semantic ownership", () => {
    const { container } = renderWithLocale(
      <Entry aside={<span>Welcome</span>} contentComponent="main" layout="split">
        <Page aria-labelledby="page-title" component="section" fullWidth>
          <h1 id="page-title">Account</h1>
          <Sidebar
            footer={<span>Footer</span>}
            sidebar={<nav aria-label="Local">Menu</nav>}
            sidebarLabel="Settings"
            size="wide"
            stickySidebar
          >
            <Grid minItemWidth="wide">
              <Cluster align="center">Cluster</Cluster>
              <Split align="center">Split</Split>
              <Hidden>Compact</Hidden>
            </Grid>
          </Sidebar>
        </Page>
      </Entry>,
    );
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Account" }),
    );
    expect(screen.getByRole("complementary", { name: "Settings" })).toHaveAttribute(
      "data-sticky",
      "true",
    );
    expect(container.querySelector(".miaixz-grid-wide")).toBeTruthy();
    expect(screen.getByText("Compact")).toHaveClass("miaixz-hidden");
  });

  it("renders closed breadcrumb and timeline collections in source order", () => {
    renderWithLocale(
      <>
        <Breadcrumb
          items={[
            { id: "home", href: "/", label: "Home", icon: <span>H</span> },
            { id: "settings", current: true, label: "Settings" },
          ]}
          label="Path"
        />
        <Timeline
          aria-label="History"
          items={[
            {
              id: "created",
              title: "Created",
              description: "Initial record",
              meta: "09:00",
              status: "Done",
              tone: "success",
            },
            { id: "review", title: "Review", status: "Pending", tone: "warning" },
          ]}
          layout="rows"
          renderItem={(item, body) => <div data-custom={item.id}>{body}</div>}
        />
      </>,
    );
    const breadcrumb = screen.getByRole("navigation", { name: "Path" });
    expect(within(breadcrumb).getByRole("link", { name: /Home/u })).toHaveAttribute("href", "/");
    expect(within(breadcrumb).getByText("Settings").closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "page",
    );
    const timeline = screen.getByRole("list", { name: "History" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(2);
    expect(timeline.parentElement?.querySelector("[data-custom='created']")).toBeTruthy();
  });
});

describe("catalog input components", () => {
  it.each([
    ["date", "2026-10-09"],
    ["datetime-local", "2026-10-09T10:30"],
    ["month", "2026-10"],
    ["time", "10:30"],
    ["week", "2026-W41"],
  ])("tracks real values and reset for native %s inputs", async (type, value) => {
    renderWithLocale(
      <form data-testid="native-picker-form">
        <Input
          aria-label="Native picker"
          defaultValue=""
          type={type}
          slotProps={{
            root: (state) => ({ "data-owner-filled": String(state.filled) }),
          }}
        />
      </form>,
    );
    const input = screen.getByLabelText("Native picker");
    expect(input.parentElement).not.toHaveAttribute("data-filled");
    expect(input.parentElement).toHaveAttribute("data-owner-filled", "false");
    fireEvent.change(input, { target: { value } });
    expect(input).toHaveValue(value);
    expect(input.parentElement).toHaveAttribute("data-filled", "true");
    expect(input.parentElement).toHaveAttribute("data-owner-filled", "true");
    (screen.getByTestId("native-picker-form") as HTMLFormElement).reset();
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(input.parentElement).not.toHaveAttribute("data-filled");
      expect(input.parentElement).toHaveAttribute("data-owner-filled", "false");
    });
  });

  it.each([
    ["date", "2026-10-09"],
    ["datetime-local", "2026-10-09T10:30"],
    ["month", "2026-10"],
    ["time", "10:30"],
    ["week", "2026-W41"],
  ])("tracks controlled native %s values", (type, value) => {
    const { rerender } = renderWithLocale(
      <Input aria-label="Controlled picker" onChange={() => undefined} type={type} value="" />,
    );
    expect(screen.getByLabelText("Controlled picker").parentElement).not.toHaveAttribute(
      "data-filled",
    );
    rerender(
      <Input aria-label="Controlled picker" onChange={() => undefined} type={type} value={value} />,
    );
    expect(screen.getByLabelText("Controlled picker").parentElement).toHaveAttribute(
      "data-filled",
      "true",
    );
    rerender(
      <Input aria-label="Controlled picker" onChange={() => undefined} type={type} value="" />,
    );
    expect(screen.getByLabelText("Controlled picker").parentElement).not.toHaveAttribute(
      "data-filled",
    );
  });

  it("keeps Checkbox and Slider native state, field attributes, refs, and slots on one owner", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const checkboxRef = vi.fn();
    const sliderRef = vi.fn();
    const { container } = renderWithLocale(
      <>
        <span id="choice-label">Choice</span>
        <span id="choice-help">Choice help</span>
        <Checkbox
          aria-describedby="choice-help"
          aria-invalid="true"
          aria-labelledby="choice-label"
          checked
          className="checkbox-custom"
          description="Description"
          disabled
          id="choice"
          indeterminate
          invalid
          label="Visible choice"
          name="choice"
          onChange={onChange}
          ref={checkboxRef}
          required
          slotProps={{
            root: ({ checked }) => ({ className: checked ? "checkbox-checked" : undefined }),
            input: { className: "checkbox-input" },
            mark: { className: "checkbox-mark" },
            content: { className: "checkbox-content" },
            label: { className: "checkbox-label" },
            description: { className: "checkbox-description" },
          }}
          style={{ color: "red" }}
        />
        <Checkbox aria-label="Bare checkbox" />
        <span id="slider-label">Slider</span>
        <span id="slider-help">Slider help</span>
        <Slider
          aria-describedby="slider-help"
          aria-invalid="true"
          aria-labelledby="slider-label"
          disabled
          id="slider"
          invalid
          max={10}
          min={0}
          ref={sliderRef}
          required
          slotProps={{
            root: ({ invalid }) => ({ className: invalid ? "slider-invalid" : undefined }),
          }}
          value={5}
        />
        <Slider aria-label="Bare slider" />
      </>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Choice" });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");
    expect(checkbox.closest("label")).toHaveClass("checkbox-custom", "checkbox-checked");
    expect(container.querySelector(".checkbox-description")).toHaveTextContent("Description");
    await user.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: "Bare checkbox" })).not.toBeChecked();
    const slider = screen.getByRole("slider", { name: "Slider" });
    expect(slider).toBeDisabled();
    expect(slider).toHaveAttribute("required");
    expect(slider).toHaveClass("slider-invalid");
    expect(slider).toHaveAttribute("data-invalid", "true");
    expect(screen.getByRole("slider", { name: "Bare slider" })).not.toBeDisabled();
    expect(checkboxRef).toHaveBeenCalled();
    expect(sliderRef).toHaveBeenCalled();
  });

  it("uses native radio and switch controls with controlled and uncontrolled state", async () => {
    const user = userEvent.setup();
    const onGroupChange = vi.fn();
    const onRadioChange = vi.fn();
    const onSwitchChange = vi.fn();
    renderWithLocale(
      <>
        <Radio
          description="Primary choice"
          invalid
          label="Direct"
          name="direct"
          onChange={onRadioChange}
          value="direct"
        />
        <RadioGroup
          defaultValue="one"
          invalid
          items={[
            { id: "one", value: "one", label: "One", description: "First" },
            { id: "two", value: "two", label: "Two", disabled: true },
            { id: "three", value: "three", label: "Three" },
          ]}
          label="Options"
          name="options"
          onValueChange={onGroupChange}
          orientation="horizontal"
          required
        />
        <Switch
          defaultChecked
          description="Notifications"
          invalid
          label="Enabled"
          onChange={onSwitchChange}
          size="small"
        />
      </>,
    );
    await user.click(screen.getByRole("radio", { name: /Direct/u }));
    await user.click(screen.getByRole("radio", { name: "Three" }));
    await user.click(screen.getByRole("switch", { name: /Enabled/u }));
    expect(onRadioChange).toHaveBeenCalledOnce();
    expect(onGroupChange).toHaveBeenCalledWith("three", expect.anything());
    expect(onSwitchChange).toHaveBeenCalledOnce();
    expect(screen.getByRole("radio", { name: "Two" })).toBeDisabled();
  });

  it("tracks textarea filled state and forwards slider validity", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithLocale(
      <>
        <Textarea
          aria-label="Notes"
          defaultValue="Initial"
          invalid
          resize="horizontal"
          size="large"
        />
        <Slider aria-label="Volume" defaultValue={25} invalid max={100} min={0} />
      </>,
    );
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea.parentElement).toHaveAttribute("data-filled", "true");
    await user.clear(textarea);
    expect(textarea.parentElement).not.toHaveAttribute("data-filled");
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: 50 } });
    rerender(<Textarea aria-label="Notes" disabled readOnly value="Controlled" />);
    expect(screen.getByRole("textbox", { name: "Notes" })).toBeDisabled();
  });
});

describe("catalog actions", () => {
  it("changes pagination through previous, numbered, and next buttons", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderWithLocale(
      <Pagination
        inset
        onPageChange={onPageChange}
        page={5}
        pageCount={10}
        showNext
        showPrevious
        siblingCount={1}
        summary="Page 5 of 10"
        nextLabel="Next page"
        previousLabel="Previous page"
        variant="plain"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "第 6 页" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange.mock.calls.map(([page]) => page)).toEqual([4, 6, 6]);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("manages semantic toolbar focus and toast actions", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const close = vi.fn();
    renderWithLocale(
      <>
        <Toolbar aria-label="Formatting" behavior="toolbar" orientation="horizontal">
          <button type="button">Bold</button>
          <button disabled type="button">
            Italic
          </button>
          <button type="button">Link</button>
        </Toolbar>
        <Toast
          action={{ label: "Undo", onAction: action }}
          dismissLabel="Dismiss"
          id="toast-one"
          message="Saved successfully"
          onClose={close}
          title="Saved"
          tone="success"
        />
      </>,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    within(toolbar).getByRole("button", { name: "Bold" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(within(toolbar).getByRole("button", { name: "Link" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(within(toolbar).getByRole("button", { name: "Bold" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(action).toHaveBeenCalledOnce();
    expect(close).toHaveBeenNthCalledWith(1, "toast-one", "action");
    expect(close).toHaveBeenNthCalledWith(2, "toast-one", "dismiss");
  });
});
