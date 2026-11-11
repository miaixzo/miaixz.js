/**
 * Exposes the interactive UI workbench as a Next.js application route.
 */
import type { Metadata } from "next";

import { UiWorkbench } from "../../module/ui/ui-workbench";

/**
 * Sets the document title for the interactive UI workbench.
 */
export const metadata: Metadata = { title: "UI 指南" };

/**
 * Renders the interactive UI workbench route.
 *
 * @returns UI workbench page element.
 */
export default function UiPage() {
  return <UiWorkbench />;
}
