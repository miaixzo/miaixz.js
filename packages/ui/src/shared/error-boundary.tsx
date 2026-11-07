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
 * Implements the error boundary module.
 */

"use client";

import { Component, type ReactNode } from "react";

/**
 * Supplies child content and a caller-owned recovery presentation.
 *
 * @public
 */
export interface MiaixzErrorBoundaryProps {
  /**
   * Child content isolated by this boundary.
   */
  readonly children: ReactNode;
  /**
   * Renders recovery content using the local retry callback.
   */
  readonly fallback: (retry: () => void) => ReactNode;
}

/**
 * Tracks failure without retaining error details or child data.
 */
interface ErrorBoundaryState {
  readonly failed: boolean;
}

/**
 * Contains rendering failures and delegates presentation to its caller.
 * The boundary adds no DOM, diagnostics, or application initialization policy.
 *
 * @public
 */
export class MiaixzErrorBoundary extends Component<MiaixzErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  /**
   * Marks the failed subtree without retaining the thrown value.
   *
   * @returns The local failure marker.
   */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  /**
   * Returns child content or the caller's recovery presentation.
   * Retrying resets only this boundary; an external key can replace its whole scope.
   *
   * @returns Child content or the caller-provided fallback.
   */
  override render(): ReactNode {
    return this.state.failed
      ? this.props.fallback(() => this.setState({ failed: false }))
      : this.props.children;
  }
}
