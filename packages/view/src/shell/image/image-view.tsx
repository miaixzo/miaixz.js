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
 * Implements the specialized browser image preview component.
 */

import { forwardRef, useEffect, useState } from "react";
import { Icon } from "@miaixz/icons";

import { MiaixzViewError } from "../../shared/errors/view-error.js";
import { classNames } from "../styles/class-names.js";
import { clampScale } from "../zoom/scale.js";
import type { ImageViewLabels, ImageViewProps } from "./image-view.types.js";

const defaultLabels: ImageViewLabels = {
  toolbar: "Image preview controls",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  rotateLeft: "Rotate left",
  rotateRight: "Rotate right",
};

/**
 * Rejects invalid image scale configuration before state is initialized or updated.
 *
 * @param initialScale - Initial image scale.
 * @param minScale - Smallest selectable scale.
 * @param maxScale - Largest selectable scale.
 * @param scaleStep - Scale delta applied by toolbar commands.
 */
function validateScaleConfiguration(
  initialScale: number,
  minScale: number,
  maxScale: number,
  scaleStep: number,
): void {
  if (
    !Number.isFinite(minScale) ||
    minScale <= 0 ||
    !Number.isFinite(maxScale) ||
    maxScale < minScale ||
    !Number.isFinite(scaleStep) ||
    scaleStep <= 0 ||
    !Number.isFinite(initialScale) ||
    initialScale <= 0
  ) {
    throw new MiaixzViewError("VIEW_IMAGE_SCALE_INVALID");
  }
}

/**
 * Renders an image with optional client-side zoom and rotation controls.
 *
 * @public
 */
export const ImageView = forwardRef<HTMLDivElement, ImageViewProps>(function ImageView(
  {
    src,
    alt,
    controls = true,
    initialScale = 1,
    minScale = 0.25,
    maxScale = 4,
    scaleStep = 0.25,
    labels: labelOverrides,
    actions,
    slotProps,
    className,
    ...rootProps
  },
  ref,
) {
  validateScaleConfiguration(initialScale, minScale, maxScale, scaleStep);
  const [scale, setScale] = useState(() => clampScale(initialScale, minScale, maxScale));
  const [rotation, setRotation] = useState(0);
  const labels = { ...defaultLabels, ...labelOverrides };
  const transform = `scale(${scale}) rotate(${rotation}deg)`;

  useEffect(() => {
    setScale((value) => clampScale(value, minScale, maxScale));
  }, [maxScale, minScale]);

  return (
    <div
      {...rootProps}
      className={classNames("miaixz-preview", "miaixz-preview-image", className)}
      ref={ref}
    >
      {(controls || actions !== undefined) && (
        <div
          {...slotProps?.toolbar}
          aria-label={labels.toolbar}
          className={classNames("miaixz-preview-toolbar", slotProps?.toolbar?.className)}
          role="toolbar"
        >
          {controls && (
            <>
              <button
                aria-label={labels.zoomOut}
                className="miaixz-preview-command"
                disabled={scale <= minScale}
                onClick={() =>
                  setScale((value) => clampScale(value - scaleStep, minScale, maxScale))
                }
                title={labels.zoomOut}
                type="button"
              >
                <Icon name="circle-minus" size="control" />
              </button>
              <output aria-live="polite" className="miaixz-preview-value">
                {Math.round(scale * 100)}%
              </output>
              <button
                aria-label={labels.zoomIn}
                className="miaixz-preview-command"
                disabled={scale >= maxScale}
                onClick={() =>
                  setScale((value) => clampScale(value + scaleStep, minScale, maxScale))
                }
                title={labels.zoomIn}
                type="button"
              >
                <Icon name="circle-plus" size="control" />
              </button>
              <button
                aria-label={labels.rotateLeft}
                className="miaixz-preview-command"
                onClick={() => setRotation((value) => value - 90)}
                title={labels.rotateLeft}
                type="button"
              >
                <Icon name="rotate-ccw" size="control" />
              </button>
              <button
                aria-label={labels.rotateRight}
                className="miaixz-preview-command"
                onClick={() => setRotation((value) => value + 90)}
                title={labels.rotateRight}
                type="button"
              >
                <Icon className="miaixz-preview-icon-reverse" name="rotate-ccw" size="control" />
              </button>
            </>
          )}
          {actions}
        </div>
      )}
      <div
        {...slotProps?.stage}
        className={classNames("miaixz-preview-stage", slotProps?.stage?.className)}
      >
        <img
          {...slotProps?.image}
          alt={alt}
          className={classNames("miaixz-preview-image-content", slotProps?.image?.className)}
          src={src}
          style={{ ...slotProps?.image?.style, transform }}
        />
      </div>
    </div>
  );
});
