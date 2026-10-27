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
 * Implements the view UI component.
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useMiaixzLayoutEffect } from "../../shared/use-client-layout-effect.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Header } from "../header/header.js";
import { Navigation } from "../navigation/navigation.js";
import { Tabs } from "../tabs/tabs.js";
import type { NavigationEntry } from "../navigation/navigation.types.js";
import type { TabsEntry } from "../tabs/tabs.types.js";
import type { ViewOwnerState, ViewProps } from "./view.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Renders one explicit content, route-navigation, or tabs view composition. @public
 */
const ViewBase = withMiaixzThemeComponent(
  "View",
  forwardRef<HTMLElement, ViewProps>(function View(
    {
      "aria-label": ariaLabel,
      title,
      description,
      actions,
      surface = "plain",
      density = "standard",
      headingLevel = 1,
      mode = "content",
      slotProps,
      ...props
    },
    ref,
  ) {
    const ownerState: ViewOwnerState = { mode, surface, density };
    const {
      children: content,
      navigationLabel,
      items,
      value,
      defaultValue,
      onValueChange,
      ...attributes
    } = props as typeof props & {
      readonly children?: ReactNode;
      readonly navigationLabel?: string;
      readonly items?: readonly NavigationEntry[] | readonly TabsEntry[];
      readonly value?: string;
      readonly defaultValue?: string;
      readonly onValueChange?: (value: string) => void;
    };
    const headerSlot = resolveSlot(slotProps?.header, ownerState);
    const actionsSlot = resolveSlot(slotProps?.actions, ownerState);
    const contentSlot = resolveSlot(slotProps?.content, ownerState);
    return (
      <section
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-view" },
          componentProps: attributes,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "aria-label": ariaLabel,
            "data-mode": mode,
            "data-surface": surface,
            "data-density": density,
          },
          ownedProps: ["aria-label", "data-mode", "data-surface", "data-density"],
        })}
      >
        <Header
          actions={actions}
          density={density}
          description={description}
          headingLevel={headingLevel}
          slotProps={{
            ...(headerSlot === undefined ? {} : { root: headerSlot }),
            ...(actionsSlot === undefined ? {} : { actions: actionsSlot }),
          }}
          spacing="none"
          title={title}
        />
        {mode === "navigation" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-view-navigation" },
              slotProps: slotProps?.navigation,
            })}
          >
            <Navigation
              density={density}
              items={items as readonly NavigationEntry[]}
              label={navigationLabel as string}
              orientation="horizontal"
            />
          </div>
        )}
        {mode === "tabs" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-view-navigation" },
              slotProps: slotProps?.navigation,
            })}
          >
            <Tabs
              activationMode="manual"
              items={items as readonly TabsEntry[]}
              label={navigationLabel as string}
              {...(value === undefined
                ? {
                    ...(defaultValue === undefined ? {} : { defaultValue }),
                    ...(onValueChange === undefined ? {} : { onValueChange }),
                  }
                : {
                    value,
                    ...(onValueChange === undefined ? {} : { onValueChange }),
                  })}
              {...(contentSlot === undefined ? {} : { slotProps: { panel: contentSlot } })}
            />
          </div>
        )}
        {mode !== "tabs" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-view-content" },
              slotProps: slotProps?.content,
            })}
          >
            {content}
          </div>
        )}
      </section>
    );
  }),
);

/**
 * Resolves static or owner-state-driven view slot properties.
 *
 * @typeParam Props - Native properties accepted by the slot.
 * @param slot - Static slot properties or resolver callback.
 * @param ownerState - Effective view owner state.
 * @returns Resolved slot properties when configured.
 */
function resolveSlot<Props extends object>(
  slot: ((state: Readonly<ViewOwnerState>) => Partial<Props>) | Partial<Props> | undefined,
  ownerState: ViewOwnerState,
): Partial<Props> | undefined {
  return typeof slot === "function" ? slot(ownerState) : slot;
}

interface ViewFrameRegistration {
  readonly update: (owner: object, props: ViewProps) => void;
  readonly release: (owner: object) => void;
}

const ViewFrameContext = createContext<ViewFrameRegistration | null>(null);

/**
 * Retains the frame DOM while authorized route content replaces its own view.
 */
const PersistentView = forwardRef<HTMLElement, ViewProps>(function PersistentView(
  { currentHref, ...props },
  ref,
) {
  const [frame, setFrame] = useState(props);
  const owner = useRef<object | null>(null);
  const [registration] = useState<ViewFrameRegistration>(() => ({
    update: (nextOwner, nextFrame) => {
      owner.current = nextOwner;
      setFrame(nextFrame);
    },
    release: (previousOwner) => {
      /**
       * An outgoing route must never remove a newer route's actions.
       */
      if (owner.current !== previousOwner) return;
      owner.current = null;
      setFrame((current) =>
        current.actions === undefined ? current : { ...current, actions: undefined },
      );
    },
  }));
  const contentFrame = (
    frame.mode === "navigation" &&
    currentHref &&
    frame.items.some((item) => item.href === currentHref)
      ? {
          ...frame,
          items: frame.items.map((item) => ({
            ...item,
            current: item.href === currentHref ? "page" : undefined,
          })),
        }
      : frame
  ) as ViewProps & { readonly mode?: "content" | "navigation" };
  return (
    <ViewFrameContext.Provider value={registration}>
      <ViewBase {...contentFrame} ref={ref}>
        {props.children}
      </ViewBase>
    </ViewFrameContext.Provider>
  );
});

/**
 * Publishes a route's frame without remounting the persistent header or navigation.
 */
const InheritedView = forwardRef<HTMLElement, ViewProps>(function InheritedView(props, ref) {
  const register = useContext(ViewFrameContext);
  const owner = useRef({});
  const release = useCallback(() => register?.release(owner.current), [register]);
  useMiaixzLayoutEffect(() => {
    register?.update(owner.current, props);
  });
  useMiaixzLayoutEffect(() => release, [release]);
  if (!register) return <ViewBase {...props} ref={ref} />;
  return <ViewFrameContext.Provider value={null}>{props.children}</ViewFrameContext.Provider>;
});

/**
 * Composes a standalone view, a persistent frame, or its destination content. @public
 */
export const View = forwardRef<HTMLElement, ViewProps>(function View(
  { preserveFrame = false, inheritFrame = false, currentHref, ...props },
  ref,
) {
  if (preserveFrame && props.mode !== "tabs")
    return (
      <PersistentView
        {...props}
        {...(currentHref === undefined ? {} : { currentHref })}
        ref={ref}
      />
    );
  if (inheritFrame && props.mode !== "tabs") return <InheritedView {...props} ref={ref} />;
  return <ViewBase {...props} ref={ref} />;
});
