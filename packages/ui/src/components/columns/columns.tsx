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
 * Implements the columns UI component.
 */

import { forwardRef, type CSSProperties } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { ColumnsOwnerState, ColumnsProps } from "./columns.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * CSS custom properties used to position or size the Columns Bar visual.
 */
interface ColumnsBarStyle extends CSSProperties {
  readonly "--miaixz-columns-value": string;
  readonly "--miaixz-columns-offset": string;
}

/**
 * Renders a normalized, accessible categorical column chart.
 *
 * @public
 */
export const Columns = withMiaixzThemeComponent(
  "Columns",
  forwardRef<HTMLDivElement, ColumnsProps>(function Columns(
    {
      labels,
      series,
      maximum: suppliedMaximum,
      showLegend = false,
      tone,
      orientation = "vertical",
      layout = "grouped",
      density = "standard",
      size = "standard",
      presentation = "default",
      categoryFormatter = (label) => label,
      seriesFormatter = (item) => item.label,
      valueFormatter,
      accessibleTable = true,
      slotProps,
      className,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const { locale, t } = useMiaixzLocale();
    const formatValue =
      valueFormatter ??
      ((value: number) =>
        new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value));
    const empty = labels.length === 0 && series.length === 0;
    if (!empty && (labels.length === 0 || series.length < 1 || series.length > 2)) {
      throw new MiaixzUiError({
        code: "UI_COLUMNS_SERIES_COUNT_INVALID",
      });
    }
    const ids = new Set<string>();
    for (const item of series) {
      if (ids.has(item.id)) {
        throw new MiaixzUiError({
          code: "UI_COLUMNS_DUPLICATE_SERIES_ID",
          details: { id: item.id },
        });
      }
      if (item.values.length !== labels.length) {
        throw new MiaixzUiError({
          code: "UI_COLUMNS_VALUE_LENGTH_INVALID",
          details: { id: item.id },
        });
      }
      if (item.values.some((value) => !Number.isFinite(value) || value < 0)) {
        throw new MiaixzUiError({
          code: "UI_COLUMNS_VALUE_INVALID",
          details: { id: item.id },
        });
      }
      ids.add(item.id);
    }
    const domainMaximum = empty
      ? 0
      : layout === "stacked"
        ? Math.max(
            ...labels.map((_, index) => series.reduce((sum, item) => sum + item.values[index]!, 0)),
          )
        : Math.max(...series.flatMap((item) => item.values));
    if (
      suppliedMaximum !== undefined &&
      (!Number.isFinite(suppliedMaximum) || suppliedMaximum <= 0 || suppliedMaximum < domainMaximum)
    ) {
      throw new MiaixzUiError({
        code: "UI_COLUMNS_MAXIMUM_INVALID",
      });
    }
    const maximum = suppliedMaximum ?? domainMaximum;
    const ownerState: ColumnsOwnerState = {
      orientation,
      layout,
      density,
      size,
      presentation,
      tone,
      state: empty ? "empty" : "ready",
    };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-columns" },
          componentProps: { ...props, className },
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-ui": "columns",
            role: "group",
            "aria-label": ariaLabel,
            ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
            "data-orientation": orientation,
            "data-layout": layout,
            "data-density": density,
            "data-size": size,
            "data-presentation": presentation,
            "data-tone": tone,
            "data-state": empty ? "empty" : "ready",
          },
          ownedProps: ["role", "aria-label", "aria-describedby"],
        })}
      >
        {showLegend && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-columns-legend" },
              slotProps: slotProps?.legend,
            })}
          >
            {series.map((item, index) => (
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-columns-legend-item" },
                  slotProps: slotProps?.legendItem,
                })}
                key={item.id}
              >
                <i data-series={index} aria-hidden="true" />
                {seriesFormatter(item)}
              </span>
            ))}
          </div>
        )}
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-columns-plot" },
            slotProps: slotProps?.plot,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        >
          {!empty &&
            labels.map((label, categoryIndex) => {
              let stackedOffset = 0;
              return (
                <div
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-columns-category" },
                    slotProps: slotProps?.category,
                  })}
                  key={`${categoryIndex}-${label}`}
                >
                  <div
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-columns-bars" },
                      slotProps: slotProps?.bars,
                    })}
                  >
                    {series.map((item, seriesIndex) => {
                      const value = item.values[categoryIndex]!;
                      const valuePercent = maximum === 0 ? 0 : (value / maximum) * 100;
                      const offset = stackedOffset;
                      if (layout === "stacked") stackedOffset += valuePercent;
                      return (
                        <span
                          {...mergeMiaixzSlotProps({
                            ownerState,
                            defaultProps: { className: "miaixz-columns-bar" },
                            slotProps: slotProps?.bar,
                            internalProps: {
                              "data-ui": "columns-bar",
                              "data-series": seriesIndex,
                              style: {
                                "--miaixz-columns-value": `${valuePercent}%`,
                                "--miaixz-columns-offset": `${offset}%`,
                              } as ColumnsBarStyle,
                              title: `${seriesFormatter(item)}, ${categoryFormatter(label, categoryIndex)}: ${formatValue(value, item, categoryIndex)}`,
                            },
                            ownedProps: ["title"],
                          })}
                          key={item.id}
                        />
                      );
                    })}
                  </div>
                  <span
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-columns-label" },
                      slotProps: slotProps?.categoryLabel,
                      internalProps: { "data-ui": "columns-label" },
                    })}
                  >
                    {categoryFormatter(label, categoryIndex)}
                  </span>
                </div>
              );
            })}
        </div>
        {accessibleTable && (
          <table
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-hidden miaixz-columns-table" },
              slotProps: slotProps?.table,
            })}
          >
            <caption {...mergeMiaixzSlotProps({ ownerState, slotProps: slotProps?.caption })}>
              {ariaLabel}
            </caption>
            <thead>
              <tr>
                <th
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    slotProps: slotProps?.tableHeader,
                    internalProps: { scope: "col" },
                    ownedProps: ["scope"],
                  })}
                >
                  {t("ui.columns.category")}
                </th>
                {series.map((item) => (
                  <th
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      slotProps: slotProps?.tableHeader,
                      internalProps: { scope: "col" },
                      ownedProps: ["scope"],
                    })}
                    key={item.id}
                  >
                    {seriesFormatter(item)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, categoryIndex) => (
                <tr key={`${categoryIndex}-${label}`}>
                  <th
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      slotProps: slotProps?.tableHeader,
                      internalProps: { scope: "row" },
                      ownedProps: ["scope"],
                    })}
                  >
                    {categoryFormatter(label, categoryIndex)}
                  </th>
                  {series.map((item) => (
                    <td
                      {...mergeMiaixzSlotProps({ ownerState, slotProps: slotProps?.tableCell })}
                      key={item.id}
                    >
                      {formatValue(item.values[categoryIndex]!, item, categoryIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }),
);
