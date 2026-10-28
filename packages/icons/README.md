# @miaixz/icons

[English](./README.md) | [简体中文](./README_CN.md)

Miaixz's standalone icon system for the web. It provides an original variable icon font, a React `Icon` component, semantic sizes, continuous FILL/opsz animation, and accessible behavior. The repository root `VERSION` file is the single source of truth for released versions.

## Installation

```bash
npm install @miaixz/icons react react-dom
```

Import the stylesheet once at the application entry point:

```tsx
import "@miaixz/icons/styles.css";
import { Icon } from "@miaixz/icons";

export function Example() {
  return <Icon label="Search" name="search" size="navigation" />;
}
```

An icon without a `label` is decorative and receives `aria-hidden`. Provide a non-empty `label` whenever an icon conveys meaning by itself.

## Font loading

`miaixz-icons.woff2` is the only font file and contains every canonical icon name in the current source. Its CSS unicode ranges are derived from the real code-point set; the font is not split by category and does not create extra requests.

Preload the complete font when icons are needed during the first render:

```html
<link rel="preload" href="/assets/miaixz-icons.woff2" as="font" type="font/woff2" crossorigin />
```

Bundlers can resolve the stable asset entry `@miaixz/icons/font.woff2`. Cross-origin deployments must return `Access-Control-Allow-Origin`; the recommended cache header is `Cache-Control: public, max-age=31536000, immutable`.

To warm the font at runtime, call `preloadIconFont`. Concurrent calls share one Promise:

```ts
import { preloadIconFont } from "@miaixz/icons";

await preloadIconFont();
```

## API

```tsx
import { Icon, type IconName } from "@miaixz/icons";

const name: IconName = "rocket";

<Icon fill={0.5} motion="auto" name={name} size={24} />;
```

- `variant="outline" | "filled"` maps to FILL 0 and 1 respectively.
- `fill` accepts a continuous value from 0 to 1 and transitions over 180 ms.
- `size` accepts `indicator`, `inline`, `control`, `navigation`, `feature`, `display`, or a positive number. Numeric sizes also drive opsz from 12 to 40.
- `motion="none"` and `prefers-reduced-motion: reduce` both disable transitions.
- Names marked with `rtl="mirror"` in the source catalog mirror only their inner glyph in a real RTL context. LTR and non-mirroring names remain unchanged, as does the root layout.
- `name` accepts canonical names only. `parseIconName` throws a `TypeError` for an unknown name.

The root entry exports only `Icon`, `isIconName`, `parseIconName`, `preloadIconFont`, and the `IconProps`, `IconMotion`, `IconName`, and `IconSize` types. Normal consumers use strings constrained by `IconName`.

Load the complete catalog from its separate entry; it is not included in the lightweight root entry:

```ts
import { ICON_CATALOG, type IconCatalogEntry, type IconCategory } from "@miaixz/icons/catalog";
```

Each catalog entry contains only `name` and `category`. The array and its entries are frozen. Do not import private `src` or `dist` paths or write PUA characters directly.

## Third-party icons

`@miaixz/icons` does not wrap or re-export third-party icon libraries. Applications that need third-party icons should install and use those libraries through their official APIs. Their licenses, upgrade cadence, and bundle size remain the application's responsibility and do not affect this package or its font assets.

```bash
npm install lucide-react
```

## Failure behavior and browser support

When the font cannot load, the component renders a fixed-size safe placeholder instead of exposing a PUA/tofu glyph. One global loading Promise ensures that a page requests the complete font at most once.

The package supports React 18.3–19 and the Chromium, Firefox, and WebKit versions covered by the locked Playwright release. Server rendering does not access the Font Loading API. Hydration keeps the same `span` root and fixed-size placeholder.

## Public entries

| Entry          | Kind       |
| -------------- | ---------- |
| `.`            | JavaScript |
| `./catalog`    | JavaScript |
| `./styles.css` | CSS        |
| `./font.woff2` | Asset      |

## Source maintenance

The authoritative product sources are `src/assets/icons.json`, `icons/*.json`, `design.json`, and the shared schema. The authoritative font sources are the six UFO masters declared by the Designspace. Generated icon, metadata, and design modules under `src/values/` are outputs, never inputs; no legacy autogen directory or forwarding layer is retained.

Before the first npm release, a name-set change recomputes code points from U+F0000 in ASCII name order and synchronizes Unicode/order across all six masters; unpublished mappings are not compatibility commitments. After the first release, existing names and code points never move. New names receive the next valid code point, and additions are rejected after U+FFFFD.

Refinement of existing icons does not recompute names or code points, import external artwork, or add per-icon CSS compensation. Final unified validation happens only after the functional work is complete.

Refinement edits the six masters directly and verifies every icon. Scans do not replace semantic, stylistic, or provenance review.

Every GLIF, plist, and Designspace source contains exactly one complete Miaixz/Apache 2.0 copyright comment after the XML declaration. The font reader owns the shared template. WOFF2 files do not contain text comments; their name table retains copyright, the full license text, and the license URL (name IDs 0/13/14). Source and artifact checks reject missing or conflicting declarations. A declaration does not replace real artwork provenance.

Outline compact/standard/display masters use primary strokes of 82±6, 70±4, and 62±4 font units. Standard frame corners use radius 40; other optical masters scale with stroke width. Sizing follows safe bounds, longest-edge measurements, and optical review rather than forcing equal width and height. Filled icons preserve semantic features and negative space instead of applying outline stroke thresholds.

Render comparisons set CSS size and opsz to 12/16/20/24/32/40 and FILL to 0/0.25/0.5/0.75/1. Independent source SVGs are compared with the single current WOFF2 across Chromium, Firefox, and WebKit at DPR 1 and 2, covering every LTR name plus mirrored RTL names. Screenshots are not compared across browsers. Validation reconstructs alpha coverage from opaque grayscale samples in memory and does not save screenshots or lower established thresholds.

`refinement:scan` is read-only and writes results to the terminal. `icons:visual:check` validates current source/font geometry and performs the complete in-memory render comparison; it reads no baseline and saves no report, screenshot, or diff image. Unit coverage is text-only, browser checks disable persistent artifacts, and every failure preserves its real exit code.

Versions are read only from the root `VERSION`; source JSON contains no independent version field. Required package metadata and the embedded font version are derived from `VERSION` and checked for consistency. Local test installation happens only after package checks pass, and delivery completes only after real application validation succeeds.
