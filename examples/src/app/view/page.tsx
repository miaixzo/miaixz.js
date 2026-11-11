/**
 * Exposes the document-preview guide as a Next.js application route.
 */
import type { Metadata } from "next";

import { ViewGuide } from "../../module/view/view-guide";

/**
 * Sets the document title for the document-preview guide.
 */
export const metadata: Metadata = { title: "View 指南" };

/**
 * Renders the document-preview guide route.
 *
 * @returns File-preview guide page element.
 */
export default function ViewPage() {
  return <ViewGuide />;
}
