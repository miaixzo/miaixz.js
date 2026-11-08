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
 * Measures and renders navigation-rail content with responsive overflow handling.
 */

import { isIconName } from "@miaixz/icons";
import { forwardRef, useId, useMemo, useRef, useState } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzLayoutEffect } from "../../shared/use-client-layout-effect.js";
import type { NavigationRailOwnerState, NavigationRailProps } from "./navigation-rail.types.js";
import {
  createOverflowEntries,
  emptyMeasurements,
  getBlockSize,
  resolveRailLayout,
  validateRail,
} from "./navigation-rail-layout.js";
import { RailOverflow, StructuredRailGroup } from "./navigation-rail-overflow.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Composes a single deterministic adaptive navigation rail.
 *
 * @public
 */
export const NavigationRail = withMiaixzThemeComponent(
  "NavigationRail",
  forwardRef<HTMLDivElement, NavigationRailProps>(function NavigationRail(
    {
      brand,
      toggle,
      groups: suppliedGroups,
      defaultIcon,
      utility,
      expanded = false,
      variant = "default",
      density = "standard",
      overflowLabel,
      overflowBehavior = "menu",
      slotProps,
      ...props
    },
    ref,
  ) {
    const groups = useMemo(() => {
      const fallback =
        typeof defaultIcon === "string" && isIconName(defaultIcon) ? defaultIcon : undefined;
      return suppliedGroups.map((group) => ({
        ...group,
        items: group.items.map(({ icon, ...item }) => {
          const resolvedIcon = typeof icon === "string" && isIconName(icon) ? icon : fallback;
          return resolvedIcon === undefined ? item : { ...item, icon: resolvedIcon };
        }),
      }));
    }, [defaultIcon, suppliedGroups]);
    validateRail(groups);
    const { t } = useMiaixzLocale();
    const instanceId = useId();
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const utilityRef = useRef<HTMLDivElement | null>(null);
    const overflowRef = useRef<HTMLButtonElement | null>(null);
    const groupRefs = useRef(new Map<string, HTMLElement>());
    const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
    const [measurements, setMeasurements] = useState(emptyMeasurements);
    const [measured, setMeasured] = useState(false);
    const ownerState: NavigationRailOwnerState = { expanded, variant, density, measured };
    const layout = useMemo(() => {
      if (overflowBehavior === "scroll") {
        return {
          visibleIds: new Set(groups.flatMap((group) => group.items.map((item) => item.id))),
          overflowItems: [],
          protectedOverflow: false,
        };
      }
      return resolveRailLayout(groups, measurements);
    }, [groups, measurements, overflowBehavior]);

    useMiaixzLayoutEffect(() => {
      const body = bodyRef.current;
      if (body === null) return;
      let frame = 0;
      const requestFrame =
        window.requestAnimationFrame?.bind(window) ??
        ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
      const cancelFrame =
        window.cancelAnimationFrame?.bind(window) ?? window.clearTimeout.bind(window);
      /**
       * Coalesces rail measurements into a frame and records available space, overflow, group, and item sizes.
       *
       * @returns No return value.
       */
      const update = () => {
        cancelFrame(frame);
        frame = requestFrame(() => {
          const groupHeights = new Map<string, number>();
          const itemHeights = new Map<string, number>();
          for (const [id, element] of groupRefs.current) {
            groupHeights.set(id, getBlockSize(element));
          }
          for (const [id, element] of itemRefs.current) {
            itemHeights.set(id, getBlockSize(element));
          }
          setMeasurements({
            available: getBlockSize(body),
            overflow: getBlockSize(overflowRef.current),
            groups: groupHeights,
            items: itemHeights,
          });
          setMeasured(true);
        });
      };
      update();
      if (typeof ResizeObserver !== "function") {
        window.addEventListener("resize", update);
        return () => {
          cancelFrame(frame);
          window.removeEventListener("resize", update);
        };
      }
      const observer = new ResizeObserver(update);
      observer.observe(body);
      if (utilityRef.current !== null) observer.observe(utilityRef.current);
      if (overflowRef.current !== null) observer.observe(overflowRef.current);
      for (const element of groupRefs.current.values()) observer.observe(element);
      for (const element of itemRefs.current.values()) observer.observe(element);
      return () => {
        cancelFrame(frame);
        observer.disconnect();
      };
    }, [groups, utility]);

    const startGroups = groups.filter((group) => group.placement !== "end");
    const endGroups = groups.filter((group) => group.placement === "end");
    const visibleStartGroups = startGroups.filter((group) =>
      group.items.some((item) => layout.visibleIds.has(item.id)),
    );
    const visibleEndGroups = endGroups.filter((group) =>
      group.items.some((item) => layout.visibleIds.has(item.id)),
    );
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-navigation-rail-frame" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            ...(expanded ? { "data-expanded": true } : {}),
            "data-variant": variant,
            "data-density": density,
            ...(measured ? { "data-measured": true } : {}),
          },
          ownedProps: ["data-expanded", "data-variant", "data-density", "data-measured"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-navigation-rail-header" },
            slotProps: slotProps?.header,
          })}
        >
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-navigation-rail-toggle" },
              slotProps: slotProps?.toggle,
            })}
          >
            {toggle}
          </div>
          {expanded && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-navigation-rail-brand" },
                slotProps: slotProps?.brand,
              })}
            >
              {brand}
            </div>
          )}
        </div>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-navigation-rail-body" },
            slotProps: slotProps?.body,
            internalRef: bodyRef,
            internalProps: {
              style: {
                overflowY:
                  overflowBehavior === "scroll" || layout.protectedOverflow ? "auto" : "hidden",
              },
            },
          })}
        >
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-navigation-rail-groups" },
              slotProps: slotProps?.groups,
            })}
          >
            {visibleStartGroups.map((group, index) => (
              <StructuredRailGroup
                density={density}
                expanded={expanded}
                group={group}
                groupRefs={groupRefs}
                itemRefs={itemRefs}
                key={group.id}
                separated={index > 0}
                visibleIds={layout.visibleIds}
              />
            ))}
            <RailOverflow
              entries={createOverflowEntries(groups, layout.overflowItems, instanceId)}
              label={overflowLabel ?? t("ui.navigation.more")}
              measuring={layout.overflowItems.length === 0}
              ownerState={ownerState}
              ref={overflowRef}
              slotProps={slotProps}
            />
            {visibleEndGroups.map((group, index) => (
              <StructuredRailGroup
                density={density}
                expanded={expanded}
                group={group}
                groupRefs={groupRefs}
                itemRefs={itemRefs}
                key={group.id}
                separated={
                  visibleStartGroups.length > 0 || layout.overflowItems.length > 0 || index > 0
                }
                visibleIds={layout.visibleIds}
              />
            ))}
          </div>
        </div>
        {utility !== undefined && utility !== null && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-navigation-rail-utility" },
              slotProps: slotProps?.utility,
              internalRef: utilityRef,
            })}
          >
            {utility}
          </div>
        )}
      </div>
    );
  }),
);
