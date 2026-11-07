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
 * Implements the async content state module.
 */

"use client";

import { Icon } from "@miaixz/icons";
import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import { getMiaixzThemeSlotClassNames, type MiaixzThemeComponent } from "../../theme/registry.js";
import { Alert } from "../alert/alert.js";
import { Empty } from "../empty/empty.js";
import { Exception } from "../exception/exception.js";
import { IconButton } from "../action/icon-button.js";
import type {
  StageOwnerState,
  StageProps,
  StageSlotProps,
  StageLoadingOwnerState,
  StageLoadingSlotProps,
} from "./stage.types.js";
import { StageLoading } from "./stage-loading.js";

/**
 * Error-only properties owned by the mounted recovery scope.
 */
type StageErrorBranchProps = Extract<StageProps, { readonly status: "error" }>;
/**
 * Effective Theme passed from the single public component binding.
 */
interface StageErrorProps extends StageErrorBranchProps {
  readonly theme: MiaixzThemeComponent<"Stage">;
}
/**
 * Resolved static attributes for one asynchronous presentation slot.
 */
type ResolvedSlot<Key extends keyof StageSlotProps> = Exclude<
  NonNullable<StageSlotProps[Key]>,
  Function
>;

/**
 * Removes presentation fields before native root properties are forwarded.
 * @param props - Public or Theme default presentation properties.
 * @returns Native properties for the actual branch root.
 */
function getNativeProps(props: Partial<StageProps>): HTMLAttributes<HTMLElement> {
  const nativeProps = { ...props } as Record<string, unknown>;
  for (const key of [
    "status",
    "label",
    "placeholder",
    "title",
    "description",
    "actions",
    "children",
    "loadingLabel",
    "loadingSlotProps",
    "presentation",
    "retryLabel",
    "onRetry",
    "retrying",
    "retryDisabled",
    "slotProps",
  ])
    delete nativeProps[key];
  return nativeProps;
}

/**
 * Resolves every layer against this component's state before composition.
 * @param theme - Active component Theme.
 * @param ownerState - Actual branch and local retry state.
 * @param key - Slot being composed.
 * @param slotProps - Caller slots.
 * @param nativeProps - Attributes for the actual presentation root.
 * @param className - Neutral package slot class.
 * @returns Static attributes for the existing underlying component node.
 */
function resolveSlot<Key extends keyof StageSlotProps>(
  theme: MiaixzThemeComponent<"Stage">,
  ownerState: StageOwnerState,
  key: Key,
  slotProps: StageSlotProps | undefined,
  nativeProps: HTMLAttributes<HTMLElement> = {},
  className?: string,
): ResolvedSlot<Key> {
  const defaults = theme.defaultProps;
  const themeSlots =
    defaults !== undefined && "slotProps" in defaults ? defaults.slotProps : undefined;
  const themeSlot = themeSlots?.[key];
  const themeProps = mergeMiaixzSlotProps<
    StageOwnerState,
    HTMLAttributes<HTMLElement>,
    HTMLElement
  >({
    ownerState,
    componentProps: key === "root" ? getNativeProps(defaults ?? {}) : {},
    slotProps: typeof themeSlot === "function" ? themeSlot(ownerState) : themeSlot,
  });
  return mergeMiaixzSlotProps<StageOwnerState, HTMLAttributes<HTMLElement>, HTMLElement>({
    ownerState,
    defaultProps: className === undefined ? {} : { className },
    themeDefaultProps: themeProps,
    componentProps: nativeProps,
    themeClassNames: getMiaixzThemeSlotClassNames(theme, ownerState, key),
    slotProps: slotProps?.[key],
  }) as ResolvedSlot<Key>;
}

/**
 * Composes Theme and caller loading slots using the existing loading owner's state.
 * @param defaultSlot - Async presentation Theme defaults for one loading node.
 * @param slot - Caller properties for the same loading node.
 * @returns One callback resolved by the existing StageLoading component.
 */
function resolveLoadingSlot(
  defaultSlot: StageLoadingSlotProps["root"],
  slot: StageLoadingSlotProps["root"],
): NonNullable<StageLoadingSlotProps["root"]> {
  return (ownerState: Readonly<StageLoadingOwnerState>) =>
    mergeMiaixzSlotProps<
      StageLoadingOwnerState,
      Exclude<NonNullable<StageLoadingSlotProps["root"]>, Function>,
      HTMLDivElement
    >({
      ownerState,
      themeDefaultProps: typeof defaultSlot === "function" ? defaultSlot(ownerState) : defaultSlot,
      slotProps: slot,
    });
}

/**
 * Presents asynchronous content without owning requests, copy, or application layout.
 * @param props - Caller-selected branch and its explicit content.
 * @returns Existing presentation primitives, or the ready children without a wrapper.
 * @public
 */
export function Stage(props: StageProps) {
  const theme = useMiaixzThemeComponent("Stage");
  if (props.status === "ready") return <>{props.children}</>;
  if (props.status === "error") return <StageError {...props} theme={theme} />;
  const ownerState: StageOwnerState = {
    status: props.status,
    presentation: "region",
    pending: false,
  };
  const rootProps = resolveSlot(
    theme,
    ownerState,
    "root",
    props.slotProps,
    getNativeProps(props),
    "miaixz-stage",
  );
  if (props.status === "loading") {
    const defaults = theme.defaultProps as
      Partial<Extract<StageProps, { readonly status: "loading" }>> | undefined;
    const { placeholder } = { ...defaults, ...props };
    return (
      <StageLoading
        active
        label={props.label}
        placeholder={placeholder}
        slotProps={{ root: rootProps }}
      />
    );
  }
  const defaults = theme.defaultProps as
    Partial<Extract<StageProps, { readonly status: "empty" }>> | undefined;
  const { description, actions } = { ...defaults, ...props };
  return (
    <Empty
      title={props.title}
      description={description}
      actions={actions}
      slotProps={{ root: rootProps }}
    />
  );
}

/**
 * Keeps retry state within the mounted error branch and delegates recovery to its owner.
 * @param props - Explicit error copy, callbacks, slots, and the resolved Theme.
 * @returns Inline feedback or a region with an immediately blocking retry overlay.
 */
function StageError(props: StageErrorProps) {
  const { theme, ...errorProps } = props;
  const { title, description, loadingLabel, slotProps } = errorProps;
  const defaults = theme.defaultProps as Partial<StageErrorBranchProps> | undefined;
  const onRetry = props.onRetry ?? defaults?.onRetry;
  const retryLabel = props.retryLabel ?? defaults?.retryLabel;
  const { actions } = { ...defaults, ...errorProps };
  const presentation = props.presentation ?? defaults?.presentation ?? "region";
  const retrying = props.retrying ?? defaults?.retrying ?? false;
  const retryDisabled = props.retryDisabled ?? defaults?.retryDisabled ?? false;
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  /**
   * Prevents duplicate activation and paints feedback before delegating recovery.
   * @returns Completion of the caller's existing recovery operation.
   */
  const retry = async () => {
    if (!onRetry || lock.current || retrying || retryDisabled) return;
    lock.current = true;
    setPending(true);
    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      });
      if (mounted.current) await onRetry();
    } catch {
      /**
       * The owner retains error details and supplies the next presentation state.
       */
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const ownerState: StageOwnerState = { status: "error", presentation, pending };
  const recovery =
    onRetry && retryLabel ? (
      <IconButton
        icon="refresh-cw"
        label={retryLabel}
        tooltip={false}
        onClick={() => void retry()}
        disabled={retryDisabled || retrying || pending}
        size="small"
        appearance="glyph"
        tone="brand"
        slotProps={{ root: { className: "miaixz-stage-retry" } }}
      />
    ) : undefined;
  const message = (
    <span className="miaixz-stage-recovery-message">
      <span className="miaixz-stage-recovery-text">{description}</span>
      {recovery}
    </span>
  );
  const rootProps = resolveSlot(
    theme,
    ownerState,
    "root",
    slotProps,
    getNativeProps(errorProps),
    "miaixz-stage miaixz-stage-error",
  );
  const content =
    presentation === "inline" ? (
      <Alert title={title} tone="danger" slotProps={{ root: rootProps }}>
        {message}
      </Alert>
    ) : (
      <div {...resolveSlot(theme, ownerState, "region", slotProps, {}, "miaixz-stage-region")}>
        <Exception
          status="unavailable"
          title={title}
          description={message}
          actions={actions}
          headingLevel={2}
          showCode={false}
          illustration={<Icon name="circle-alert" size="feature" />}
          role="alert"
          aria-live="assertive"
          slotProps={{
            root: rootProps,
            illustration: resolveSlot(
              theme,
              ownerState,
              "illustration",
              slotProps,
              {},
              "miaixz-stage-illustration",
            ),
            title: resolveSlot(theme, ownerState, "title", slotProps, {}, "miaixz-stage-title"),
            content: resolveSlot(
              theme,
              ownerState,
              "content",
              slotProps,
              {},
              "miaixz-stage-content",
            ),
          }}
        />
      </div>
    );
  return (
    <StageLoading
      active={pending || retrying}
      label={loadingLabel}
      slotProps={{
        root: resolveLoadingSlot(defaults?.loadingSlotProps?.root, props.loadingSlotProps?.root),
        content: resolveLoadingSlot(
          defaults?.loadingSlotProps?.content,
          props.loadingSlotProps?.content,
        ),
        surface: resolveLoadingSlot(
          defaults?.loadingSlotProps?.surface,
          props.loadingSlotProps?.surface,
        ),
      }}
    >
      {content}
    </StageLoading>
  );
}
