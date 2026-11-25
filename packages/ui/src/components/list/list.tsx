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
 * Implements the list UI component.
 */

import { forwardRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { ListProvider } from "./list-context.js";
import { ListItem } from "./list-item.js";
import type { ListCounterProps, ListMarkerProps, ListOwnerState, ListProps } from "./list.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Renders a semantic list from one required declarative item source. @public
 */
export const List = withMiaixzThemeComponent(
  "List",
  forwardRef<HTMLUListElement, ListProps>(function List(
    {
      items,
      variant = "default",
      layout = "list",
      density = "standard",
      rowPadding,
      surface = "plain",
      dividers = true,
      bordered = false,
      fillRow = false,
      slotProps,
      ...props
    },
    ref,
  ) {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) {
        throw new MiaixzUiError({
          code: "UI_COLLECTION_DUPLICATE_ID",
          details: { id: item.id },
        });
      }
      ids.add(item.id);
    }
    const ownerState: ListOwnerState = {
      variant,
      layout,
      density,
      surface,
      dividers,
      bordered,
      fillRow: layout === "grid" && fillRow,
    };
    return (
      <ListProvider value={{ density, surface }}>
        <ul
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-list" },
            componentProps: props,
            slotProps: slotProps?.root,
            forwardedRef: ref,
            internalProps: {
              "data-ui": "list",
              "data-layout": layout,
              "data-variant": variant,
              "data-density": density,
              ...(rowPadding === undefined ? {} : { "data-row-padding": rowPadding }),
              "data-surface": surface,
              ...(dividers ? { "data-dividers": true } : {}),
              ...(bordered ? { "data-bordered": true } : {}),
              ...(ownerState.fillRow ? { "data-fill-row": true } : {}),
            },
            ownedProps: [
              "data-layout",
              "data-variant",
              "data-density",
              "data-row-padding",
              "data-surface",
              "data-dividers",
              "data-bordered",
              "data-fill-row",
            ],
          })}
        >
          {items.map((item) => (
            <ListItem {...item} key={item.id} />
          ))}
        </ul>
      </ListProvider>
    );
  }),
);

/**
 * Renders a compact visual count inside a list row. @public
 */
export const ListCounter = withMiaixzThemeComponent(
  "ListCounter",
  forwardRef<HTMLSpanElement, ListCounterProps>(function ListCounter(
    { className, variant = "default", ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={classNames(
          variant === "alert" ? "miaixz-list-counter-alert" : "miaixz-list-counter",
          className,
        )}
      />
    );
  }),
);

/**
 * Renders a visual marker without assigning business meaning. @public
 */
export const ListMarker = withMiaixzThemeComponent(
  "ListMarker",
  forwardRef<HTMLSpanElement, ListMarkerProps>(function ListMarker(
    { className, variant = "default", children, ...props },
    ref,
  ) {
    return (
      <span {...props} ref={ref} className={classNames(`miaixz-list-marker-${variant}`, className)}>
        {variant === "step" ? <i>{children}</i> : children}
      </span>
    );
  }),
);

export { ListItem } from "./list-item.js";
