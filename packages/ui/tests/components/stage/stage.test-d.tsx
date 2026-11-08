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
 * Verifies neutral state presentation contracts through both public source entries.
 */

import type { HTMLAttributes, ReactNode } from "react";

import * as Root from "../../../src/index.js";
import * as Scoped from "../../../src/components/stage/index.js";

/**
 * Requires one compile-time contract to evaluate to true.
 */
type Assert<Value extends true> = Value;
/**
 * Compares types without treating readonly and optional fields as interchangeable.
 */
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
/**
 * Extracts properties that must exist even when their values can be undefined.
 */
type RequiredKeys<Value> = {
  [Key in keyof Value]-?: {} extends Pick<Value, Key> ? never : Key;
}[keyof Value];
/**
 * Selects the callback form of a public slot contract.
 */
type SlotCallback<Slot> = Extract<NonNullable<Slot>, (...arguments_: never[]) => unknown>;
/**
 * Selects native properties returned by a public slot callback.
 */
type SlotProperties<Slot> = ReturnType<SlotCallback<Slot>>;
/**
 * Reads the native click target from a concrete slot-property contract.
 */
type ClickTarget<Properties extends { onClick?: unknown }> =
  NonNullable<Properties["onClick"]> extends (event: infer Event) => unknown
    ? Event extends { currentTarget: infer Target }
      ? Target
      : never
    : never;
/**
 * Names the loading branch without relying on JSX excess-property exceptions.
 */
type LoadingProps = Extract<Root.StageProps, { status: "loading" }>;
/**
 * Names the empty branch, whose title field must exist.
 */
type EmptyProps = Extract<Root.StageProps, { status: "empty" }>;
/**
 * Names the error branch, whose copy is supplied by the caller.
 */
type ErrorProps = Extract<Root.StageProps, { status: "error" }>;
/**
 * Names the content-only ready branch.
 */
type ReadyProps = Extract<Root.StageProps, { status: "ready" }>;
/**
 * Describes the public native data-attribute value contract.
 */
type DataAttributes = {
  readonly [name: `data-${string}`]: string | number | boolean | undefined;
};
/**
 * Names native keys accepted by branches with a presentation node.
 */
type PresentationKeys =
  | Exclude<keyof HTMLAttributes<HTMLElement>, "title" | "children" | "aria-busy">
  | `data-${string}`
  | "slotProps";

/**
 * Requires both public entries to expose the same components, hook, and six types.
 */
type PublicEntriesAgree = [
  Assert<Equal<typeof Root.Stage, typeof Scoped.Stage>>,
  Assert<Equal<typeof Root.StageLoading, typeof Scoped.StageLoading>>,
  Assert<Equal<typeof Root.useStageSettled, typeof Scoped.useStageSettled>>,
  Assert<Equal<Root.StageProps, Scoped.StageProps>>,
  Assert<Equal<Root.StageOwnerState, Scoped.StageOwnerState>>,
  Assert<Equal<Root.StageSlotProps, Scoped.StageSlotProps>>,
  Assert<Equal<Root.StageLoadingProps, Scoped.StageLoadingProps>>,
  Assert<Equal<Root.StageLoadingOwnerState, Scoped.StageLoadingOwnerState>>,
  Assert<Equal<Root.StageLoadingSlotProps, Scoped.StageLoadingSlotProps>>,
];
/**
 * Keeps every branch closed and distinguishes required presence from value types.
 */
type BranchContractsAreExact = [
  Assert<Equal<Root.StageProps["status"], "loading" | "empty" | "error" | "ready">>,
  Assert<Equal<keyof LoadingProps, PresentationKeys | "status" | "label" | "placeholder">>,
  Assert<
    Equal<keyof EmptyProps, PresentationKeys | "status" | "title" | "description" | "actions">
  >,
  Assert<
    Equal<
      keyof ErrorProps,
      | PresentationKeys
      | "status"
      | "title"
      | "description"
      | "loadingLabel"
      | "loadingSlotProps"
      | "presentation"
      | "retryLabel"
      | "onRetry"
      | "retrying"
      | "retryDisabled"
      | "actions"
    >
  >,
  Assert<Equal<ReadyProps, { readonly status: "ready"; readonly children: ReactNode }>>,
  Assert<Equal<RequiredKeys<LoadingProps>, "status" | "label">>,
  Assert<Equal<RequiredKeys<EmptyProps>, "status" | "title">>,
  Assert<Equal<RequiredKeys<ErrorProps>, "status" | "title" | "description" | "loadingLabel">>,
  Assert<Equal<RequiredKeys<ReadyProps>, "status" | "children">>,
  Assert<Equal<LoadingProps["label"], string>>,
  Assert<Equal<LoadingProps["placeholder"], ReactNode>>,
  Assert<Equal<EmptyProps["title"], ReactNode>>,
  Assert<Equal<EmptyProps["description"], ReactNode>>,
  Assert<Equal<EmptyProps["actions"], ReactNode>>,
  Assert<Equal<ErrorProps["title"], ReactNode>>,
  Assert<Equal<ErrorProps["description"], ReactNode>>,
  Assert<Equal<ErrorProps["loadingLabel"], string>>,
  Assert<Equal<ErrorProps["loadingSlotProps"], Root.StageLoadingSlotProps | undefined>>,
  Assert<Equal<ErrorProps["presentation"], "inline" | "region" | undefined>>,
  Assert<Equal<ErrorProps["retryLabel"], string | undefined>>,
  Assert<Equal<ErrorProps["onRetry"], (() => unknown) | undefined>>,
  Assert<Equal<ErrorProps["retrying"], boolean | undefined>>,
  Assert<Equal<ErrorProps["retryDisabled"], boolean | undefined>>,
  Assert<Equal<ErrorProps["actions"], ReactNode>>,
  Assert<Equal<LoadingProps["slotProps"], Root.StageSlotProps | undefined>>,
  Assert<Equal<EmptyProps["slotProps"], Root.StageSlotProps | undefined>>,
  Assert<Equal<ErrorProps["slotProps"], Root.StageSlotProps | undefined>>,
  Assert<Equal<RequiredKeys<Root.StageLoadingProps>, "active" | "label">>,
  Assert<
    Equal<
      keyof Root.StageLoadingProps,
      | Exclude<keyof HTMLAttributes<HTMLDivElement>, "children" | "aria-busy">
      | `data-${string}`
      | "active"
      | "label"
      | "children"
      | "placeholder"
      | "slotProps"
    >
  >,
  Assert<Equal<Root.StageLoadingProps["active"], boolean>>,
  Assert<Equal<Root.StageLoadingProps["label"], string>>,
  Assert<Equal<Root.StageLoadingProps["children"], ReactNode>>,
  Assert<Equal<Root.StageLoadingProps["placeholder"], ReactNode>>,
  Assert<Equal<Root.StageLoadingProps["slotProps"], Root.StageLoadingSlotProps | undefined>>,
  Assert<Equal<Root.StageLoadingProps[`data-${string}`], DataAttributes[`data-${string}`]>>,
  Assert<Equal<LoadingProps[`data-${string}`], DataAttributes[`data-${string}`]>>,
  Assert<Equal<Parameters<typeof Root.useStageSettled>, [settled: boolean]>>,
  Assert<Equal<ReturnType<typeof Root.useStageSettled>, boolean>>,
];
/**
 * Keeps owner state limited to readonly presentation scalars.
 */
type OwnerContractsAreExact = [
  Assert<
    Equal<Root.StageLoadingOwnerState, { readonly active: boolean; readonly hasContent: boolean }>
  >,
  Assert<
    Equal<
      Root.StageOwnerState,
      {
        readonly status: "loading" | "empty" | "error" | "ready";
        readonly presentation: "inline" | "region";
        readonly pending: boolean;
      }
    >
  >,
  Assert<Equal<keyof Root.StageLoadingSlotProps, "root" | "content" | "surface">>,
  Assert<
    Equal<keyof Root.StageSlotProps, "root" | "region" | "title" | "content" | "illustration">
  >,
  Assert<Equal<RequiredKeys<Root.StageLoadingSlotProps>, never>>,
  Assert<Equal<RequiredKeys<Root.StageSlotProps>, never>>,
];
/**
 * Requires all callbacks to receive only their own readonly owner state.
 */
type SlotOwnersAreExact = [
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageLoadingSlotProps["root"]>>,
      [ownerState: Readonly<Root.StageLoadingOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageLoadingSlotProps["content"]>>,
      [ownerState: Readonly<Root.StageLoadingOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageLoadingSlotProps["surface"]>>,
      [ownerState: Readonly<Root.StageLoadingOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageSlotProps["root"]>>,
      [ownerState: Readonly<Root.StageOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageSlotProps["region"]>>,
      [ownerState: Readonly<Root.StageOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageSlotProps["title"]>>,
      [ownerState: Readonly<Root.StageOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageSlotProps["content"]>>,
      [ownerState: Readonly<Root.StageOwnerState>]
    >
  >,
  Assert<
    Equal<
      Parameters<SlotCallback<Root.StageSlotProps["illustration"]>>,
      [ownerState: Readonly<Root.StageOwnerState>]
    >
  >,
];
/**
 * Requires native click handlers to retain each slot's actual element target.
 */
type SlotTargetsAreExact = [
  Assert<
    Equal<
      ClickTarget<SlotProperties<Root.StageLoadingSlotProps["root"]>>,
      EventTarget & HTMLDivElement
    >
  >,
  Assert<
    Equal<
      ClickTarget<SlotProperties<Root.StageLoadingSlotProps["content"]>>,
      EventTarget & HTMLDivElement
    >
  >,
  Assert<
    Equal<
      ClickTarget<SlotProperties<Root.StageLoadingSlotProps["surface"]>>,
      EventTarget & HTMLDivElement
    >
  >,
  Assert<
    Equal<ClickTarget<SlotProperties<Root.StageSlotProps["root"]>>, EventTarget & HTMLElement>
  >,
  Assert<
    Equal<ClickTarget<SlotProperties<Root.StageSlotProps["region"]>>, EventTarget & HTMLDivElement>
  >,
  Assert<
    Equal<
      ClickTarget<SlotProperties<Root.StageSlotProps["title"]>>,
      EventTarget & HTMLHeadingElement
    >
  >,
  Assert<
    Equal<ClickTarget<SlotProperties<Root.StageSlotProps["content"]>>, EventTarget & HTMLDivElement>
  >,
  Assert<
    Equal<
      ClickTarget<SlotProperties<Root.StageSlotProps["illustration"]>>,
      EventTarget & HTMLDivElement
    >
  >,
];

const loading: LoadingProps = { status: "loading", label: "Loading items" };
const empty: EmptyProps = { status: "empty", title: undefined };
const error: ErrorProps = {
  status: "error",
  title: undefined,
  description: undefined,
  loadingLabel: "Loading items",
};
const ready: ReadyProps = { status: "ready", children: undefined };
const retained: Root.StageLoadingProps = { active: true, label: "Loading", children: "Items" };
const retryLabelOnly: ErrorProps = { ...error, retryLabel: "Retry" };
const retryCallbackOnly: ErrorProps = { ...error, onRetry: () => 42 };
const retryTogether: ErrorProps = {
  ...error,
  retryLabel: "Retry",
  onRetry: async () => ({ completed: true }),
};
const nativePresentation: LoadingProps = {
  status: "loading",
  label: "Loading items",
  id: "neutral-presentation",
  className: "neutral",
  role: "status",
  tabIndex: 0,
  "aria-label": "Items",
  "data-count": 2,
  "data-active": true,
  "data-optional": undefined,
};
const nativeLoading: Root.StageLoadingProps = {
  active: false,
  label: "Loading items",
  id: "neutral-loading",
  "data-mode": "compact",
  "data-active": false,
};
const loadingStaticSlots: Root.StageLoadingSlotProps = {
  root: { className: "root", "aria-busy": true, "data-node": "root" },
  content: { tabIndex: 0 },
  surface: { role: "status" },
};
const asyncStaticSlots: Root.StageSlotProps = {
  root: { className: "root", "aria-busy": true, "data-node": "root" },
  region: { tabIndex: 0 },
  title: { id: "neutral-title" },
  content: { role: "note" },
  illustration: { "aria-hidden": true },
};
const loadingCallbackSlots: Root.StageLoadingSlotProps = {
  root: (ownerState) => ({ className: ownerState.active ? "active" : "idle" }),
  content: (ownerState) => ({ hidden: !ownerState.hasContent }),
  surface: (ownerState) => ({ "aria-hidden": !ownerState.active }),
};
const asyncCallbackSlots: Root.StageSlotProps = {
  root: (ownerState) => ({ className: ownerState.status }),
  region: (ownerState) => ({ "data-presentation": ownerState.presentation }),
  title: (ownerState) => ({ hidden: ownerState.pending }),
  content: (ownerState) => ({ "aria-hidden": ownerState.pending }),
  illustration: (ownerState) => ({ "data-pending": ownerState.pending }),
};
const rootComponents = [
  <Root.Stage {...loading} />,
  <Root.Stage {...empty} />,
  <Root.Stage {...error} />,
  <Root.Stage {...ready} />,
  <Root.StageLoading {...retained} />,
];
const scopedComponents = [
  <Scoped.Stage {...loading} />,
  <Scoped.Stage {...empty} />,
  <Scoped.Stage {...error} />,
  <Scoped.Stage {...ready} />,
  <Scoped.StageLoading {...retained} />,
];

/**
 * The loading branch requires caller-resolved feedback copy.
 * @ts-expect-error Loading requires the label field. */
const missingLoadingLabel: LoadingProps = { status: "loading" };
const undefinedLoadingLabel: LoadingProps = {
  status: "loading",
  /**
   * @ts-expect-error A required string label cannot be undefined. */
  label: undefined,
};
/**
 * The empty branch requires title presence even when the value may be undefined.
 * @ts-expect-error Empty requires the title field. */
const missingEmptyTitle: EmptyProps = { status: "empty" };
/**
 * The error title field remains required independently of its ReactNode value.
 * @ts-expect-error Error requires the title field. */
const missingErrorTitle: ErrorProps = {
  status: "error",
  description: null,
  loadingLabel: "Loading",
};
/**
 * The error description field is required independently of its ReactNode value.
 * @ts-expect-error Error requires the description field. */
const missingErrorDescription: ErrorProps = {
  status: "error",
  title: null,
  loadingLabel: "Loading",
};
/**
 * The error branch requires feedback copy for retry loading.
 * @ts-expect-error Error requires the loadingLabel field. */
const missingErrorLoadingLabel: ErrorProps = { status: "error", title: null, description: null };
const undefinedErrorLoadingLabel: ErrorProps = {
  ...error,
  /**
   * @ts-expect-error Loading feedback copy must be a string. */
  loadingLabel: undefined,
};
/**
 * The ready branch requires the children field to exist.
 * @ts-expect-error Ready requires the children field. */
const missingReadyChildren: ReadyProps = { status: "ready" };
/**
 * Content loading always receives an explicit active flag.
 * @ts-expect-error StageLoading requires the active field. */
const missingActive: Root.StageLoadingProps = { label: "Loading" };
/**
 * Content loading always receives caller-resolved feedback copy.
 * @ts-expect-error StageLoading requires the label field. */
const missingContentLabel: Root.StageLoadingProps = { active: true };
const invalidActive: Root.StageLoadingProps = {
  label: "Loading",
  /**
   * @ts-expect-error Active is a boolean rather than a caller status string. */
  active: "loading",
};
const invalidContentLabel: Root.StageLoadingProps = {
  active: true,
  /**
   * @ts-expect-error StageLoading feedback copy must be a string. */
  label: undefined,
};
const invalidRetry: ErrorProps = {
  ...error,
  /**
   * @ts-expect-error A retry callback must be callable. */
  onRetry: "retry",
};
const invalidStatus: Root.StageProps = {
  /**
   * @ts-expect-error Disabled is a caller state rather than a presentation branch. */
  status: "disabled",
};
const pageError: ErrorProps = {
  ...error,
  /**
   * @ts-expect-error Page is a project layout rather than an error presentation. */
  presentation: "page",
};
const panelError: ErrorProps = {
  ...error,
  /**
   * @ts-expect-error Panel is not an error presentation. */
  presentation: "panel",
};
const drawerError: ErrorProps = {
  ...error,
  /**
   * @ts-expect-error Drawer is not an error presentation. */
  presentation: "drawer",
};
const businessScope: LoadingProps = {
  ...loading,
  /**
   * @ts-expect-error Business scopes belong to caller adapters. */
  scope: "workspace",
};
const businessRows: Root.StageLoadingProps = {
  ...retained,
  /**
   * @ts-expect-error Rows are caller data rather than presentation props. */
  rows: [],
};
const businessLayout: LoadingProps = {
  ...loading,
  /**
   * @ts-expect-error Shell layout belongs to the caller adapter. */
  layout: "page",
};
const businessContext: ErrorProps = {
  ...error,
  /**
   * @ts-expect-error Runtime Context is not a presentation prop. */
  context: { identifier: "neutral" },
};
const loadingBusy: Root.StageLoadingProps = {
  ...retained,
  /**
   * @ts-expect-error The component owns its top-level aria-busy attribute. */
  "aria-busy": true,
};
const stateBusy: LoadingProps = {
  ...loading,
  /**
   * @ts-expect-error Presentation branches own their top-level aria-busy attribute. */
  "aria-busy": false,
};
const readyLabel: ReadyProps = {
  ...ready,
  /**
   * @ts-expect-error Ready has no feedback-label field. */
  label: "Loading",
};
const readyPlaceholder: ReadyProps = {
  ...ready,
  /**
   * @ts-expect-error Ready renders children without a placeholder contract. */
  placeholder: null,
};
const readySlots: ReadyProps = {
  ...ready,
  /**
   * @ts-expect-error Ready has no presentation node or slot props. */
  slotProps: {},
};
const readyId: ReadyProps = {
  ...ready,
  /**
   * @ts-expect-error Ready introduces no native presentation node. */
  id: "neutral",
};
const readyClassName: ReadyProps = {
  ...ready,
  /**
   * @ts-expect-error Ready has no wrapper className contract. */
  className: "neutral",
};
const unknownLoadingSlot: Root.StageLoadingSlotProps = {
  /**
   * @ts-expect-error Only root, content, and surface are loading slots. */
  indicator: {},
};
const unknownStateSlot: Root.StageSlotProps = {
  /**
   * @ts-expect-error A retry button is not a public asynchronous-state slot. */
  retry: {},
};
const rendererFramework: Root.StageLoadingProps = {
  ...retained,
  /**
   * @ts-expect-error Native slot props do not expose a replacement-renderer framework. */
  slots: {},
};
const readonlyLoadingSlot: Root.StageLoadingSlotProps = {
  root: (ownerState) => {
    /**
     * @ts-expect-error Slot callbacks cannot mutate readonly owner state. */
    ownerState.active = true;
    /**
     * @ts-expect-error Pending belongs to asynchronous state rather than loading owner state. */
    const pending = ownerState.pending;
    void pending;
    return {};
  },
};
const readonlyStateSlot: Root.StageSlotProps = {
  root: (ownerState) => {
    /**
     * @ts-expect-error Slot callbacks cannot mutate readonly owner state. */
    ownerState.pending = true;
    /**
     * @ts-expect-error Business scopes are absent from asynchronous owner state. */
    const scope = ownerState.scope;
    void scope;
    return {};
  },
};
/**
 * Rejects business-state strings without invoking a hook outside React.
 * @ts-expect-error The hook input is an explicit boolean. */
const invalidSettledInput: Parameters<typeof Root.useStageSettled> = ["ready"];

const errorLoadingStatic: ErrorProps = { ...error, loadingSlotProps: loadingStaticSlots };
const errorLoadingCallbacks: ErrorProps = { ...error, loadingSlotProps: loadingCallbackSlots };
const errorLoadingTheme: Root.ThemeComponents = {
  Stage: { defaultProps: { loadingSlotProps: loadingCallbackSlots } },
};
const rootErrorLoading = <Root.Stage {...errorLoadingStatic} />;
const scopedErrorLoading = <Scoped.Stage {...errorLoadingCallbacks} />;
const loadingRetrySlots: LoadingProps = {
  ...loading,
  /**
   * @ts-expect-error Retry loading slots belong only to the error branch. */
  loadingSlotProps: {},
};
const emptyRetrySlots: EmptyProps = {
  ...empty,
  /**
   * @ts-expect-error Empty has no retry loading overlay. */
  loadingSlotProps: {},
};
const readyRetrySlots: ReadyProps = {
  ...ready,
  /**
   * @ts-expect-error Ready adds no retry overlay or loading nodes. */
  loadingSlotProps: {},
};
const unknownRetryLoadingSlot: ErrorProps = {
  ...error,
  loadingSlotProps: {
    /**
     * @ts-expect-error Retry loading exposes only root, content, and surface. */
    indicator: {},
  },
};
const readonlyRetryLoadingSlot: ErrorProps = {
  ...error,
  loadingSlotProps: {
    root: (ownerState) => {
      /**
       * @ts-expect-error Loading slot callbacks cannot mutate readonly active state. */
      ownerState.active = false;
      /**
       * @ts-expect-error The loading owner exposes active and hasContent rather than pending. */
      const pending = ownerState.pending;
      void pending;
      return { "data-retained": ownerState.hasContent };
    },
  },
};

void errorLoadingStatic;
void errorLoadingCallbacks;
void errorLoadingTheme;
void rootErrorLoading;
void scopedErrorLoading;
void loadingRetrySlots;
void emptyRetrySlots;
void readyRetrySlots;
void unknownRetryLoadingSlot;
void readonlyRetryLoadingSlot;
void loading;
void empty;
void error;
void ready;
void retained;
void retryLabelOnly;
void retryCallbackOnly;
void retryTogether;
void nativePresentation;
void nativeLoading;
void loadingStaticSlots;
void asyncStaticSlots;
void loadingCallbackSlots;
void asyncCallbackSlots;
void rootComponents;
void scopedComponents;
void missingLoadingLabel;
void undefinedLoadingLabel;
void missingEmptyTitle;
void missingErrorTitle;
void missingErrorDescription;
void missingErrorLoadingLabel;
void undefinedErrorLoadingLabel;
void missingReadyChildren;
void missingActive;
void missingContentLabel;
void invalidActive;
void invalidContentLabel;
void invalidRetry;
void invalidStatus;
void pageError;
void panelError;
void drawerError;
void businessScope;
void businessRows;
void businessLayout;
void businessContext;
void loadingBusy;
void stateBusy;
void readyLabel;
void readyPlaceholder;
void readySlots;
void readyId;
void readyClassName;
void unknownLoadingSlot;
void unknownStateSlot;
void rendererFramework;
void readonlyLoadingSlot;
void readonlyStateSlot;
void invalidSettledInput;

/**
 * Exposes the assertion bundle to the package's existing TypeScript check.
 */
export type StageTypeAssertions = [
  PublicEntriesAgree,
  BranchContractsAreExact,
  OwnerContractsAreExact,
  SlotOwnersAreExact,
  SlotTargetsAreExact,
];
