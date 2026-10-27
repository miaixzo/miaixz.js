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
 * Renders appearance controls and binds them to the SDK appearance manager.
 */

import {
  miaixzBaseFontSizes,
  miaixzRadiusScales,
  miaixzShellLayouts,
  type MiaixzBaseFontSize,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzRadiusScale,
  type MiaixzShellLayout,
} from "@miaixz/sdk/appearance";
import { useId, useState, type CSSProperties, type ReactNode } from "react";

import { MiaixzUiError } from "../errors/ui-error.js";
import { useMiaixzLocale } from "../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../shared/slots.js";
import { useTheme } from "../theme/context.js";
import { ActionText } from "../components/action/action-text.js";
import { Drawer } from "../components/drawer/drawer.js";
import { Icon } from "@miaixz/icons";
import { Locale } from "../components/locale/locale.js";
import { Radio } from "../components/radio/radio.js";
import type { AppearanceOwnerState, AppearanceProps } from "./appearance.types.js";
import { useAppearancePosition } from "./use-appearance-position.js";
import { withMiaixzThemeComponent } from "../theme/binding.js";

const colorModes: readonly MiaixzColorMode[] = ["light", "dark", "system"];
const densities: readonly MiaixzDensity[] = ["compact", "standard", "comfortable"];
/**
 * Renders the shared draggable Appearance trigger and scope-controlled drawer. @public
 *
 * @param props - Scope, header, position, and drag configuration.
 * @returns Shared Appearance trigger and drawer.
 */
function Appearance(props: AppearanceProps) {
  const {
    scope,
    headerBehavior,
    onHeaderBehaviorChange,
    positionBlockPx,
    onPositionBlockPxChange,
    draggable = true,
    capabilities,
    slotProps,
  } = props;
  if (positionBlockPx !== undefined && !Number.isFinite(positionBlockPx)) {
    throw new MiaixzUiError({
      code: "UI_APPEARANCE_POSITION_INVALID",
      details: { positionBlockPx },
    });
  }
  const theme = useTheme();
  const localeRuntime = useMiaixzLocale();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"settings" | "language">("settings");
  const currentHeaderBehavior = headerBehavior;
  const { canMove, dragging, positionStyle, rootRef, triggerHandlers } = useAppearancePosition({
    draggable,
    positionBlockPx,
    onPositionBlockPxChange,
    onActivate: () => setOpen(true),
  });
  const drawerId = `miaixz-appearance-${useId()}`;
  const namePrefix = `miaixz-appearance-choice-${useId()}`;
  const authenticated = scope === "authenticated";
  const shellLayouts = capabilities?.shellLayouts ?? miaixzShellLayouts;
  const radiusScales = capabilities?.radiusScales ?? miaixzRadiusScales;
  const baseFontSizes = capabilities?.baseFontSizes ?? miaixzBaseFontSizes;
  const isLoading = theme.status === "loading" || localeRuntime.loadStatus === "loading";
  const activeLocale =
    localeRuntime.locales.find((descriptor) => descriptor.id === localeRuntime.locale) ??
    localeRuntime.locales[0];

  const ownerState: AppearanceOwnerState = {
    scope,
    open,
    draggable: canMove,
    readOnlyPosition: draggable && !canMove,
  };
  const rootSlotProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-appearance-floating" },
    componentProps: { style: positionStyle },
    slotProps: slotProps?.root,
    internalRef: rootRef,
    internalProps: {
      ...(dragging ? { "data-dragging": true } : {}),
    },
    ownedProps: ["data-dragging"],
  });
  const triggerSlotProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-appearance-trigger" },
    slotProps: slotProps?.trigger,
    internalProps: {
      type: "button",
      "aria-controls": drawerId,
      "aria-expanded": open,
      "aria-haspopup": "dialog",
      "aria-keyshortcuts": canMove ? "ArrowUp ArrowDown" : undefined,
      "aria-label": localeRuntime.t("ui.appearance.open"),
      title: localeRuntime.t("ui.appearance.open"),
      ...triggerHandlers,
    },
    ownedProps: [
      "type",
      "aria-controls",
      "aria-expanded",
      "aria-haspopup",
      "aria-keyshortcuts",
      "aria-label",
    ],
  });
  const sectionSlotProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-appearance-group" },
    slotProps: slotProps?.section,
  });
  const optionSlotProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-appearance-option" },
    slotProps: slotProps?.option,
  });
  /**
   * Renders a decorative appearance preview beside its visible option label.
   *
   * @param kind - Appearance setting illustrated by the preview.
   * @param value - Setting value exposed to preview styling.
   * @param label - Visible option label.
   * @param style - Optional CSS preview overrides.
   * @returns Decorative preview and its visible label.
   */
  const preview = (
    kind: "theme" | "mode" | "density" | "header" | "layout",
    value: string,
    label: ReactNode,
    style?: CSSProperties,
  ) => (
    <span className="miaixz-appearance-option-label">
      <span
        aria-hidden="true"
        className={`miaixz-appearance-preview miaixz-appearance-${kind}-preview`}
        data-preview-value={value}
        style={style}
      >
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </span>
  );

  /**
   * Wraps appearance options in a labeled fieldset.
   *
   * @param label - Visible group legend.
   * @param children - Option controls belonging to the group.
   * @param className - Optional additional options-container class.
   * @returns Fieldset element with the shared section-slot attributes.
   */
  const group = (label: string, children: ReactNode, className = "") => (
    <fieldset {...sectionSlotProps}>
      <legend>{label}</legend>
      <div className={`miaixz-appearance-options ${className}`}>{children}</div>
    </fieldset>
  );

  const themeGroup = group(
    localeRuntime.t("ui.appearance.theme"),
    theme.themes.map((descriptor) => {
      const colors = descriptor.preview[theme.resolvedColorMode];
      const style = {
        "--miaixz-appearance-preview-brand": colors.brand,
        "--miaixz-appearance-preview-surface": colors.surface,
        "--miaixz-appearance-preview-text": colors.textPrimary,
      } as CSSProperties;
      return (
        <Radio
          key={descriptor.name}
          checked={theme.theme === descriptor.name}
          slotProps={{ root: optionSlotProps }}
          disabled={isLoading}
          label={preview("theme", descriptor.name, descriptor.label, style)}
          name={`${namePrefix}-theme`}
          onChange={() => {
            if (theme.theme !== descriptor.name) void theme.setTheme(descriptor.name);
          }}
          value={descriptor.name}
        />
      );
    }),
    "miaixz-appearance-options-cards",
  );

  const localeGroup = group(
    localeRuntime.t("ui.appearance.language"),
    <button
      aria-label={localeRuntime.t("ui.appearance.language.open")}
      className="miaixz-appearance-locale-summary"
      onClick={() => setView("language")}
      type="button"
    >
      <span aria-hidden="true" className="miaixz-appearance-locale-summary-short">
        {activeLocale?.shortLabel ?? localeRuntime.locale.slice(0, 2).toLocaleUpperCase()}
      </span>
      <span className="miaixz-appearance-locale-summary-copy">
        <span>{activeLocale?.label ?? localeRuntime.locale}</span>
        <span>{localeRuntime.t("ui.appearance.language.current")}</span>
      </span>
      <Icon name="chevron-right" size="control" />
    </button>,
    "miaixz-appearance-options-rows",
  );

  const modeGroup = group(
    localeRuntime.t("ui.appearance.mode"),
    colorModes.map((mode) => (
      <Radio
        key={mode}
        checked={theme.colorMode === mode}
        slotProps={{ root: optionSlotProps }}
        disabled={isLoading}
        label={preview("mode", mode, localeRuntime.t(`ui.appearance.${mode}`))}
        name={`${namePrefix}-mode`}
        onChange={() => {
          if (theme.colorMode !== mode) void theme.setColorMode(mode);
        }}
        value={mode}
      />
    )),
    "miaixz-appearance-options-cards",
  );

  const densityGroup = group(
    localeRuntime.t("ui.appearance.density"),
    densities.map((density) => (
      <Radio
        key={density}
        checked={theme.density === density}
        slotProps={{ root: optionSlotProps }}
        disabled={isLoading}
        label={preview("density", density, localeRuntime.t(`ui.appearance.${density}`))}
        name={`${namePrefix}-density`}
        onChange={() => {
          if (theme.density !== density) void theme.setDensity(density);
        }}
        value={density}
      />
    )),
    "miaixz-appearance-options-cards",
  );

  const layoutGroup =
    shellLayouts.length === 0
      ? null
      : group(
          localeRuntime.t("ui.appearance.layout"),
          shellLayouts.map((layout) => (
            <Radio
              key={layout}
              checked={theme.shellLayout === layout}
              slotProps={{ root: optionSlotProps }}
              disabled={isLoading}
              label={preview("layout", layout, localeRuntime.t(`ui.appearance.${layout}`))}
              name={`${namePrefix}-layout`}
              onChange={() => {
                if (theme.shellLayout !== layout) void theme.setShellLayout(layout);
              }}
              value={layout}
            />
          )),
          "miaixz-appearance-options-layouts",
        );

  const radiusGroup =
    radiusScales.length === 0
      ? null
      : group(
          localeRuntime.t("ui.appearance.radius"),
          radiusScales.map((scale) => (
            <Radio
              key={scale}
              checked={theme.radiusScale === scale}
              slotProps={{ root: optionSlotProps }}
              disabled={isLoading}
              label={String(scale)}
              name={`${namePrefix}-radius`}
              onChange={() => {
                if (theme.radiusScale !== scale)
                  void theme.setRadiusScale(scale as MiaixzRadiusScale);
              }}
              value={String(scale)}
            />
          )),
          "miaixz-appearance-options-radius",
        );

  const currentFontSizeIndex = Math.max(
    0,
    baseFontSizes.indexOf(theme.baseFontSize as MiaixzBaseFontSize),
  );
  const fontSizeGroup =
    baseFontSizes.length === 0
      ? null
      : group(
          localeRuntime.t("ui.appearance.fontSize"),
          <div className="miaixz-appearance-font-stepper">
            <button
              aria-label={localeRuntime.t("ui.appearance.fontSize.decrease")}
              disabled={isLoading || currentFontSizeIndex <= 0}
              onClick={() => {
                const size = baseFontSizes[currentFontSizeIndex - 1];
                if (size !== undefined) void theme.setBaseFontSize(size);
              }}
              type="button"
            >
              −
            </button>
            <output aria-label={localeRuntime.t("ui.appearance.fontSize.current")}>
              {theme.baseFontSize}
            </output>
            <button
              aria-label={localeRuntime.t("ui.appearance.fontSize.increase")}
              disabled={isLoading || currentFontSizeIndex >= baseFontSizes.length - 1}
              onClick={() => {
                const size = baseFontSizes[currentFontSizeIndex + 1];
                if (size !== undefined) void theme.setBaseFontSize(size);
              }}
              type="button"
            >
              +
            </button>
            <span aria-hidden="true">px</span>
          </div>,
          "miaixz-appearance-options-rows",
        );

  const headerGroup = group(
    localeRuntime.t("ui.appearance.header"),
    <>
      {(["fixed", "scroll"] as const).map((value) => (
        <Radio
          key={value}
          checked={currentHeaderBehavior === value}
          slotProps={{ root: optionSlotProps }}
          disabled={onHeaderBehaviorChange === undefined}
          label={preview("header", value, localeRuntime.t(`ui.appearance.${value}`))}
          name={`${namePrefix}-header`}
          onChange={() => {
            onHeaderBehaviorChange?.(value);
          }}
          value={value}
        />
      ))}
      {onHeaderBehaviorChange === undefined ? (
        <p className="miaixz-appearance-read-only">{localeRuntime.t("ui.appearance.readOnly")}</p>
      ) : null}
    </>,
    "miaixz-appearance-options-locales",
  );

  return (
    <>
      <div {...rootSlotProps}>
        <button {...triggerSlotProps}>
          <Icon name="palette" size="navigation" />
        </button>
      </div>

      <Drawer
        closeOnBackdrop
        footer={null}
        className="miaixz-appearance-drawer"
        closeLabel={localeRuntime.t("ui.appearance.close")}
        density="standard"
        description={
          view === "language"
            ? localeRuntime.t("ui.appearance.language.description")
            : localeRuntime.t("ui.appearance.description")
        }
        id={drawerId}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setView("settings");
        }}
        open={open}
        placement="right"
        width={360}
        title={
          view === "language"
            ? localeRuntime.t("ui.appearance.language")
            : localeRuntime.t("ui.appearance.title")
        }
      >
        {view === "language" ? (
          <div className="miaixz-appearance-language-view">
            <ActionText
              action={{
                id: "appearance-language-back",
                kind: "command",
                label: localeRuntime.t("ui.appearance.language.back"),
                icon: "chevron-left",
                tone: "neutral",
                size: "small",
                onAction: () => setView("settings"),
              }}
            />
            <Locale
              disabled={isLoading}
              locale={localeRuntime.locale}
              locales={localeRuntime.locales}
              onLocaleChange={async (nextLocale) => {
                await localeRuntime.setLocale(nextLocale);
                setView("settings");
              }}
            />
            {localeRuntime.loadError ? <p role="alert">{localeRuntime.loadError.message}</p> : null}
          </div>
        ) : (
          <div aria-busy={isLoading} className="miaixz-appearance-body">
            {authenticated && themeGroup}
            {authenticated && layoutGroup}
            {authenticated && radiusGroup}
            {authenticated && fontSizeGroup}
            {localeGroup}
            {modeGroup}
            {authenticated && densityGroup}
            {authenticated && headerGroup}
            {theme.error ? <p role="alert">{theme.error.message}</p> : null}
          </div>
        )}
      </Drawer>
    </>
  );
}

const ThemedAppearance = withMiaixzThemeComponent("Appearance", Appearance);
export { ThemedAppearance as Appearance };
