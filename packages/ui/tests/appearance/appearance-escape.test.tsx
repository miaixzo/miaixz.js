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
 * Verifies native Appearance dismissal and trigger focus through the real modal composition.
 */

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Appearance } from "../../src/appearance/index.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../../src/i18n/index.js";
import { Theme } from "../../src/theme/index.js";

const appearances = new Set<ReturnType<typeof createMiaixzAppearanceManager>>();

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  for (const appearance of appearances) appearance.destroy();
  appearances.clear();
});

/**
 * Renders Appearance with the public SDK-backed theme and locale providers.
 *
 * @returns Real locale runtime used to verify the nested language transition.
 */
function renderAppearance() {
  const values = new Map<string, string>();
  const appearance = createMiaixzAppearanceManager({
    appId: "appearance-escape-test",
    initialAppearance: { theme: "miaixz", colorMode: "light", density: "standard" },
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  appearances.add(appearance);
  const i18n = createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages });
  render(
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance}>
        <Appearance scope="entry" />
      </Theme>
    </MiaixzLocaleProvider>,
  );
  return i18n;
}

describe("Appearance native dismissal", () => {
  it("closes its settings Drawer on native cancel and restores its trigger", async () => {
    renderAppearance();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "打开外观设置" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "主题与风格" });
    expect(dialog).toHaveAttribute("open");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the same trigger after a locale change and resets the nested view on cancel", async () => {
    const i18n = renderAppearance();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "打开外观设置" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "主题与风格" });
    await user.click(screen.getByRole("button", { name: "切换界面语言" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: /English/ })).toBeEnabled());
    await user.click(screen.getByRole("radio", { name: /English/ }));
    await waitFor(() => expect(i18n.locale).toBe("en-US"));
    expect(screen.getByRole("button", { name: "Open appearance settings" })).toBe(trigger);
    expect(screen.getByRole("dialog", { name: "Appearance" })).toBe(dialog);
    await user.click(screen.getByRole("button", { name: "Change interface language" }));
    expect(screen.getByRole("dialog", { name: "Language" })).toBe(dialog);

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Appearance" })).toBe(dialog);
    expect(screen.queryByRole("dialog", { name: "Language" })).toBeNull();
  });
});
