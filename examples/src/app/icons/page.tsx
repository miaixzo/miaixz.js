/**
 * Exposes the icon catalog guide as a Next.js application route.
 */
import type { Metadata } from "next";

import { IconsGuide } from "../../module/icons/icons-guide";

/**
 * Sets the document title for the icon catalog guide.
 */
export const metadata: Metadata = { title: "Icons 指南" };

/**
 * Renders the icon catalog and axis-controls guide route.
 *
 * @returns Icon guide page element.
 */
export default function IconsPage() {
  return <IconsGuide />;
}
