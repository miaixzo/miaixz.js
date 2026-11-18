/**
 * Exposes the isolated SDK guide as a Next.js application route.
 */
import type { Metadata } from "next";

import { SdkGuide } from "../../module/sdk/sdk-guide";

/**
 * Sets the document title for the SDK integration guide.
 */
export const metadata: Metadata = { title: "SDK 指南" };

/**
 * Renders the isolated SDK integration guide route.
 *
 * @returns SDK guide page element.
 */
export default function SdkPage() {
  return <SdkGuide />;
}
