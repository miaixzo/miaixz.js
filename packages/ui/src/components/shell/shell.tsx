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
 * Implements the shell UI component.
 */

import { forwardRef } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { ShellOwnerState, ShellProps } from "./shell.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Provides the sole page-level main and navigation layout owner. @public
 */
export const Shell = withMiaixzThemeComponent(
  "Shell",
  forwardRef<HTMLDivElement, ShellProps>(function Shell(
    {
      header,
      brand,
      primaryNavigation,
      secondaryNavigation,
      contextNavigation,
      sidebarOverflow = "auto",
      headerBehavior = "fixed",
      desktopNavigation = { mode: "sidebar" },
      mobileNavigation = { mode: "none" },
      presentation = "default",
      layout = "vertical",
      mainComponent: MainComponent = "main",
      slotProps,
      mainRef,
      children,
      ...props
    },
    ref,
  ) {
    const ownerState: ShellOwnerState = {
      desktopNavigation,
      mobileNavigation,
      headerBehavior,
      sidebarOverflow,
      presentation,
      layout,
    };
    const expanded = desktopNavigation.mode === "rail" && desktopNavigation.expanded;
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-shell" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-desktop-navigation": desktopNavigation.mode,
            ...(expanded ? { "data-navigation-expanded": true } : {}),
            "data-header-behavior": headerBehavior,
            "data-presentation": presentation,
            "data-layout": layout,
          },
          ownedProps: [
            "data-desktop-navigation",
            "data-navigation-expanded",
            "data-header-behavior",
            "data-presentation",
            "data-layout",
          ],
        })}
      >
        {brand === undefined ? null : (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-brand" },
              slotProps: slotProps?.brand,
            })}
          >
            {brand}
          </div>
        )}
        <header
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-shell-header" },
            slotProps: slotProps?.header,
          })}
        >
          {header}
        </header>
        {primaryNavigation === undefined ? null : (
          <aside
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: {
                className: "miaixz-shell-sidebar miaixz-shell-primary-navigation",
              },
              slotProps: slotProps?.primaryNavigation ?? slotProps?.sidebar,
              internalProps: { "data-overflow": sidebarOverflow },
              ownedProps: ["data-overflow"],
            })}
          >
            {primaryNavigation}
          </aside>
        )}
        {secondaryNavigation === undefined ? null : (
          <aside
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-secondary-navigation" },
              slotProps: slotProps?.secondaryNavigation,
            })}
          >
            {secondaryNavigation}
          </aside>
        )}
        {contextNavigation === undefined ? null : (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-context-navigation" },
              slotProps: slotProps?.contextNavigation,
            })}
          >
            {contextNavigation}
          </div>
        )}
        <MainComponent
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-shell-main" },
            slotProps: slotProps?.main,
            internalRef: mainRef,
          })}
        >
          {children}
        </MainComponent>
        {mobileNavigation.mode === "bottom" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-mobile-navigation" },
              slotProps: slotProps?.mobileNavigation,
            })}
          >
            {mobileNavigation.content}
          </div>
        )}
      </div>
    );
  }),
);
