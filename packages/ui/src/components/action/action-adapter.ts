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
 * Adapts resolved presentation and caller-owned behavior without a business registry.
 */
import { createElement } from "react";
import { Icon } from "@miaixz/icons";
import type {
  ActionBase,
  CommandAction,
  FormCancelAction,
  FormSubmitAction,
  NavigationAction,
} from "./action.types.js";
import type { ButtonProps } from "../button/button.types.js";

/**
 * Presentation resolved by the caller's trusted configuration source.
 */
export interface ActionPresentation extends Pick<
  ActionBase,
  "label" | "icon" | "tone" | "size" | "description"
> {
  /**
   * Optional Button surface when no placement emphasis is specified.
   */
  readonly variant?: "solid" | "outlined" | "plain";
}

/**
 * Behavior required for command adaptation.
 */
export type CommandBehavior = Omit<CommandAction, keyof ActionPresentation>;
/**
 * Behavior required for navigation adaptation.
 */
export type NavigationBehavior = Omit<NavigationAction, keyof ActionPresentation>;
/**
 * Form cancellation behavior independent of presentation.
 */
export type FormCancelBehavior = Omit<FormCancelAction, "label" | "icon">;
/**
 * Native form submission state; it deliberately has no callback.
 */
export type FormSubmitBehavior = Omit<FormSubmitAction, "label" | "icon" | "tone">;

/**
 * Validates the minimum accessible name before creating a visible control.
 *
 * @param value - Resolved display fields supplied by a trusted caller.
 * @returns Only display fields, excluding runtime behavior or identity overrides.
 * @throws TypeError when the label is empty.
 */
function presentation(value: ActionPresentation): ActionPresentation {
  if (!value.label.trim()) throw new TypeError("Action label must not be empty.");
  return {
    label: value.label,
    ...(value.icon === undefined ? {} : { icon: value.icon }),
    ...(value.tone === undefined ? {} : { tone: value.tone }),
    ...(value.size === undefined ? {} : { size: value.size }),
    ...(value.description === undefined ? {} : { description: value.description }),
    ...(value.variant === undefined ? {} : { variant: value.variant }),
  };
}

/**
 * Copies behavior-only native attributes; presentation cannot be replaced by a spread.
 *
 * @param value - Native properties supplied by the behavior owner.
 * @returns Only native identity, form, keyboard, link and ARIA attributes.
 */
function nativeBehavior<T extends object>(value: T): T {
  const allowed = new Set([
    "id",
    "form",
    "formAction",
    "formEncType",
    "formMethod",
    "formNoValidate",
    "formTarget",
    "name",
    "value",
    "title",
    "tabIndex",
    "onKeyDown",
    "target",
    "rel",
    "download",
  ]);
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => allowed.has(key) || key.startsWith("aria-")),
  ) as T;
}

/**
 * Combines a resolved command with the owner's handler without invoking it.
 * @public
 *
 * @param display - Resolved label, icon, semantic tone and optional display details.
 * @param behavior - Command identity, callback, availability and permitted native attributes.
 * @returns A command descriptor without executing its callback.
 * @throws TypeError when the display label is empty.
 */
export function adaptCommand(
  display: ActionPresentation,
  behavior: CommandBehavior,
): CommandAction {
  return {
    ...behavior,
    ...presentation(display),
    ...(behavior.buttonProps ? { buttonProps: nativeBehavior(behavior.buttonProps) } : {}),
  };
}

/**
 * Combines resolved navigation with the owner's original anchor target.
 * @public
 *
 * @param display - Resolved navigation presentation.
 * @param behavior - Navigation identity, original destination and anchor behavior.
 * @returns A navigation descriptor retaining native anchor semantics.
 * @throws TypeError when the display label is empty.
 */
export function adaptNavigation(
  display: ActionPresentation,
  behavior: NavigationBehavior,
): NavigationAction {
  const native = behavior.anchorProps;
  return {
    ...behavior,
    ...presentation(display),
    ...(native
      ? {
          anchorProps: {
            ...nativeBehavior(native),
            ...(native.onClick ? { onClick: native.onClick } : {}),
          },
        }
      : {}),
  };
}

/**
 * Adapts a Button presentation without adding a click or submission handler.
 * @public
 *
 * @param display - Resolved presentation without event or submission behavior.
 * @param placement - Optional emphasis within the caller-owned action region.
 * @returns Button display properties; the caller supplies handlers and form ownership.
 * @throws TypeError when the display label is empty.
 */
export function adaptButton(
  display: ActionPresentation,
  placement?: "primary" | "secondary",
): Pick<ButtonProps, "children" | "startIcon" | "tone" | "variant" | "size"> {
  const value = presentation(display);
  const tone =
    value.tone === "danger"
      ? "danger"
      : placement === "primary"
        ? "brand"
        : placement === "secondary"
          ? "neutral"
          : (value.tone ?? "neutral");
  return {
    children: value.label,
    ...(value.icon
      ? {
          startIcon: createElement(Icon, {
            name: value.icon,
            size: "control",
          }),
        }
      : {}),
    tone,
    variant:
      placement === "primary"
        ? "solid"
        : placement === "secondary"
          ? "outlined"
          : (value.variant ?? (tone === "brand" ? "solid" : "outlined")),
    size: value.size ?? "medium",
  };
}

/**
 * Adapts a menu command without supplying business behavior or authorization.
 * @public
 *
 * @param display - Resolved menu label, icon and semantic tone.
 * @returns Menu display properties with a matching textValue for keyboard navigation.
 * @throws TypeError when the display label is empty.
 */
export function adaptMenu(display: ActionPresentation) {
  const value = presentation(display);
  return {
    label: value.label,
    textValue: value.label,
    tone: value.tone === "danger" ? ("danger" as const) : ("neutral" as const),
    ...(value.icon ? { icon: createElement(Icon, { name: value.icon, size: "control" }) } : {}),
  };
}

/**
 * Adapts cancellation with an explicit owner callback.
 * @public
 *
 * @param display - Explicit cancellation display fields.
 * @param behavior - Cancellation identity, callback and native behavior attributes.
 * @returns A FormActions cancellation descriptor with the original callback.
 * @throws TypeError when the display label is empty.
 */
export function adaptFormCancel(
  display: ActionPresentation,
  behavior: FormCancelBehavior,
): FormCancelAction {
  const { label, icon } = presentation(display);
  return {
    ...behavior,
    label,
    ...(icon ? { icon } : {}),
    ...(behavior.buttonProps ? { buttonProps: nativeBehavior(behavior.buttonProps) } : {}),
  };
}

/**
 * Preserves native form submission and never installs a second submit handler.
 * @public
 *
 * @param display - Resolved submission label, icon and semantic tone.
 * @param behavior - Form ownership, identity, disabled state and pending state.
 * @returns A native submit descriptor without an additional submit callback.
 * @throws TypeError when the display label is empty.
 */
export function adaptFormSubmit(
  display: ActionPresentation,
  behavior: FormSubmitBehavior,
): FormSubmitAction {
  const { label, icon, tone } = presentation(display);
  return {
    ...behavior,
    label,
    ...(icon ? { icon } : {}),
    tone: tone === "danger" ? "danger" : "brand",
    ...(behavior.buttonProps ? { buttonProps: nativeBehavior(behavior.buttonProps) } : {}),
  };
}
