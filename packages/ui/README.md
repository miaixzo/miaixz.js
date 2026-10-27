# @miaixz/ui

## Theme ownership and local delivery

Theme definitions, types, generated CSS and runtime logic live together in `src/theme/`.
There is no runtime subdirectory. Internal modules import concrete files, never the public barrel.
Maintain TypeScript definitions, not generated CSS.
Design token types, field lists and shared defaults live in `src/design/`.
Directory names do not change public symbols or CSS custom property names.
Cross-component implementation helpers live in `src/shared/` (formerly `src/internal/`).
This directory is package-private; consumers use existing public exports, not shared deep imports.
`npm run build` compiles TypeScript, automatically runs
`.github/scripts/modules/ui/codegen/generate-theme-css.mjs` from the repository root, then copies both
CSS trees to `dist`. The CSS package test detects generated-file drift; the generator also accepts
`--runtime-dir` and `--output-dir` for isolated reproduction.

The sole public JavaScript theme entry is `@miaixz/ui/theme`. Public CSS theme entries are
`@miaixz/ui/styles.css` and `@miaixz/ui/theme.css`; preset-specific CSS paths are private so preset
directories can be added or removed without changing package exports.
`styles.css` is the complete default theme. Foundation, component, core, and reset
entries retain their responsibilities. CSS auditing uses
`.github/scripts/modules/ui/quality/audit-ui-contracts.mjs` from the repository root.
Every public module that renders DOM also exposes one selective stylesheet at
`@miaixz/ui/<subpath>/styles.css`; `Graph` uses
`@miaixz/ui/diagram/graph/styles.css`. Selective consumers load a theme/foundation
entry first, then only the component module styles they use.

For this remediation, build and pack locally, unpack under the application's controlled
`node_modules/.miaixz-local` directory and link the installed package to that output.
Do not publish to npm or link application dependencies directly to source.

`@miaixz/ui` is the shared Miaixz React design system. It provides independently deployed frontend services, such as Home, Spaces, and Settings, with a consistent set of design tokens, themes, density modes, and reusable components. Icons are owned exclusively by the `@miaixz/icons` peer package.

The package is ESM-only and does not provide a CommonJS `require` entry point. JavaScript entry points do not load global CSS automatically; consumers must import the required stylesheet explicitly.

## Navigation ownership

`Link` is the inline text-link component, `ButtonLink` is navigation with Button presentation,
and `Button` remains command-only. Composite components such as `Breadcrumb`, `Dropdown`,
`List`, `Metric`, and `Navigation` use the same private, styleless anchor primitive; they do not
inherit `Link` presentation styles.

Applications can install one router adapter with `MiaixzLinkProvider`. The adapter must forward
all supplied properties and the ref to a final native anchor. A component-level `renderAnchor`
overrides the provider; without either adapter, the package renders a native `<a>`.

```tsx
import { MiaixzLinkProvider, type LinkRenderer } from "@miaixz/ui";

const renderAnchor: LinkRenderer = (props, ref) => <RouterLink {...props} ref={ref} />;

<MiaixzLinkProvider renderAnchor={renderAnchor}>{application}</MiaixzLinkProvider>;
```

## Platform identity

Use the public `Brand` component for the configured platform name beside a logo.
It aligns the text baseline with the logo bottom edge and shares spacing, theme typography
and single-line ellipsis globally. Logo images and SVGs use a fixed 32px height;
their width follows the intrinsic aspect ratio.
The complete theme stylesheet or `@miaixz/ui/components.css` includes these styles.
The application owns the name configuration and navigation; `Brand` also works inside
framework links and accepts framework image components in its `logo` slot.

```tsx
import { Brand } from "@miaixz/ui";

<a href="/workbench" aria-label={platformName}>
  <Brand name={platformName} logo={<img src="/logo.png" alt="" />} />
</a>;
```

## Drawer widths

`DRAWER_WIDTHS` exports the frozen preset list: **350, 360, 380, 400, 450, 480,
500, 550, 580, 600, 800, 1000** CSS pixels. `DrawerWidthPreset` is the corresponding
numeric union for configuration fields and width pickers. Both are exported from
`@miaixz/ui` and `@miaixz/ui/drawer`.

```tsx
import { Drawer, DRAWER_WIDTHS, type DrawerWidthPreset } from "@miaixz/ui";

const width: DrawerWidthPreset = 480;
const widthOptions = DRAWER_WIDTHS.map((value) => ({ label: `${value}px`, value }));

<Drawer open={open} onOpenChange={setOpen} title="Settings" width={width}>
  {children}
</Drawer>;
```

`width` accepts the named presets `small`, `medium`, `large`, `xlarge`, `wide`, and `content`,
or a custom positive finite number such as `435`; its default is `medium` for side
drawers. Bottom drawers do not accept `width`. Width does not change density, fonts,
spacing or editor structure; use `density` separately.

Left and right drawers clamp the requested width to the available viewport or
explicit `boundary`, accounting for `inset`. Bottom drawers remain full width.
For viewport drawers, width is applied through the shared CSS variable without
requiring a JavaScript positioning observer. Responsive content should use the
actual container width; sidebar editors need sufficient space for both columns.

The Appearance panel uses **360px**, while the two-column user editor uses
**1000px**. Other drawers retain their existing sizes until explicitly configured.

## Drawer dismissal and footer actions

Drawers stay open on backdrop clicks, Escape, blur and pointer leave by default.
`closeOnBackdrop` and `closeOnEscape` are explicit opt-ins. Data-viewing drawers
should enable `closeOnBackdrop`; mixed view/edit surfaces enable it only in their
view mode. Appearance opts into backdrop dismissal because its settings apply
immediately. Pointer leave alone does not dismiss either surface. `closeDisabled` keeps
both built-in close controls visible but disabled during a pending operation;
programmatic `open` changes remain controlled by the application. Nested dialogs
and native file-picker cancellation do not dismiss their parent drawer.

Without a supplied `footer`, Drawer renders a localized close action on the left.
A supplied footer replaces that default; `footer={null}` omits the footer entirely.
Appearance uses this exception and keeps its header close control.
Use the existing `FormActions` for custom
footers: `cancel` stays left, optional `actions` renders auxiliary commands on the
right, and optional `submit` remains the final native form submission control.
A submit-only footer stays right; close-only footers need no fake submit action.
Keep validation and request failures in the open drawer with the current draft.

```tsx
<Drawer
  open={open}
  title="Edit record"
  closeDisabled={saving}
  onOpenChange={setOpen}
  footer={
    <FormActions
      cancel={{ id: "cancel", label: "Cancel", disabled: saving, onAction: close }}
      actions={
        <Button type="button" onClick={preview}>
          Preview
        </Button>
      }
      submit={{ id: "save", label: "Save", loading: saving, buttonProps: { form: formId } }}
    />
  }
>
  <form id={formId} onSubmit={save}>
    {children}
  </form>
</Drawer>
```

## Installation

```bash
npm install @miaixz/ui @miaixz/icons @miaixz/sdk react react-dom
```

`@miaixz/icons`, `@miaixz/sdk`, `react`, and `react-dom` are peer dependencies. The exact supported ranges are declared by the installed package metadata.

## Public entries

This table is checked directly against the package export map.

| Entry                        | Kind       |
| ---------------------------- | ---------- |
| `.`                          | JavaScript |
| `./styles.css`               | CSS        |
| `./foundation.css`           | CSS        |
| `./components.css`           | CSS        |
| `./appearance`               | JavaScript |
| `./i18n`                     | JavaScript |
| `./errors`                   | JavaScript |
| `./bar`                      | JavaScript |
| `./brand`                    | JavaScript |
| `./cluster`                  | JavaScript |
| `./columns`                  | JavaScript |
| `./editor`                   | JavaScript |
| `./grid`                     | JavaScript |
| `./sections`                 | JavaScript |
| `./header`                   | JavaScript |
| `./heatmap`                  | JavaScript |
| `./locale`                   | JavaScript |
| `./metrics`                  | JavaScript |
| `./view`                     | JavaScript |
| `./pressable`                | JavaScript |
| `./slider`                   | JavaScript |
| `./diagram/graph`            | JavaScript |
| `./scroll`                   | JavaScript |
| `./shell`                    | JavaScript |
| `./sidebar`                  | JavaScript |
| `./sparkline`                | JavaScript |
| `./split`                    | JavaScript |
| `./stack`                    | JavaScript |
| `./timeline`                 | JavaScript |
| `./toaster`                  | JavaScript |
| `./visualization-motion`     | JavaScript |
| `./alert`                    | JavaScript |
| `./action`                   | JavaScript |
| `./intents`                  | JavaScript |
| `./avatar`                   | JavaScript |
| `./button`                   | JavaScript |
| `./combobox`                 | JavaScript |
| `./breadcrumb`               | JavaScript |
| `./input`                    | JavaScript |
| `./date`                     | JavaScript |
| `./segmented`                | JavaScript |
| `./tag`                      | JavaScript |
| `./responsive`               | JavaScript |
| `./link`                     | JavaScript |
| `./masonry`                  | JavaScript |
| `./rating`                   | JavaScript |
| `./textarea`                 | JavaScript |
| `./select`                   | JavaScript |
| `./checkbox`                 | JavaScript |
| `./radio`                    | JavaScript |
| `./switch`                   | JavaScript |
| `./navigation`               | JavaScript |
| `./panel`                    | JavaScript |
| `./badge`                    | JavaScript |
| `./list`                     | JavaScript |
| `./table`                    | JavaScript |
| `./tabs`                     | JavaScript |
| `./pagination`               | JavaScript |
| `./popover`                  | JavaScript |
| `./progress`                 | JavaScript |
| `./dialog`                   | JavaScript |
| `./disclosure`               | JavaScript |
| `./divider`                  | JavaScript |
| `./drawer`                   | JavaScript |
| `./descriptions`             | JavaScript |
| `./dropdown`                 | JavaScript |
| `./donut`                    | JavaScript |
| `./dropzone`                 | JavaScript |
| `./toast`                    | JavaScript |
| `./toolbar`                  | JavaScript |
| `./transfer`                 | JavaScript |
| `./tooltip`                  | JavaScript |
| `./skeleton`                 | JavaScript |
| `./spinner`                  | JavaScript |
| `./confirm`                  | JavaScript |
| `./notice`                   | JavaScript |
| `./field`                    | JavaScript |
| `./search`                   | JavaScript |
| `./overlay`                  | JavaScript |
| `./picker`                   | JavaScript |
| `./datagrid`                 | JavaScript |
| `./page`                     | JavaScript |
| `./upload`                   | JavaScript |
| `./tree`                     | JavaScript |
| `./status`                   | JavaScript |
| `./steps`                    | JavaScript |
| `./empty`                    | JavaScript |
| `./entry`                    | JavaScript |
| `./hidden`                   | JavaScript |
| `./theme`                    | JavaScript |
| `./appearance/styles.css`    | CSS        |
| `./bar/styles.css`           | CSS        |
| `./brand/styles.css`         | CSS        |
| `./cluster/styles.css`       | CSS        |
| `./columns/styles.css`       | CSS        |
| `./editor/styles.css`        | CSS        |
| `./grid/styles.css`          | CSS        |
| `./sections/styles.css`      | CSS        |
| `./header/styles.css`        | CSS        |
| `./heatmap/styles.css`       | CSS        |
| `./locale/styles.css`        | CSS        |
| `./metrics/styles.css`       | CSS        |
| `./view/styles.css`          | CSS        |
| `./pressable/styles.css`     | CSS        |
| `./slider/styles.css`        | CSS        |
| `./diagram/graph/styles.css` | CSS        |
| `./scroll/styles.css`        | CSS        |
| `./shell/styles.css`         | CSS        |
| `./sidebar/styles.css`       | CSS        |
| `./sparkline/styles.css`     | CSS        |
| `./split/styles.css`         | CSS        |
| `./stack/styles.css`         | CSS        |
| `./timeline/styles.css`      | CSS        |
| `./toaster/styles.css`       | CSS        |
| `./alert/styles.css`         | CSS        |
| `./action/styles.css`        | CSS        |
| `./avatar/styles.css`        | CSS        |
| `./button/styles.css`        | CSS        |
| `./combobox/styles.css`      | CSS        |
| `./breadcrumb/styles.css`    | CSS        |
| `./input/styles.css`         | CSS        |
| `./date/styles.css`          | CSS        |
| `./segmented/styles.css`     | CSS        |
| `./tag/styles.css`           | CSS        |
| `./link/styles.css`          | CSS        |
| `./masonry/styles.css`       | CSS        |
| `./rating/styles.css`        | CSS        |
| `./textarea/styles.css`      | CSS        |
| `./select/styles.css`        | CSS        |
| `./checkbox/styles.css`      | CSS        |
| `./radio/styles.css`         | CSS        |
| `./switch/styles.css`        | CSS        |
| `./navigation/styles.css`    | CSS        |
| `./panel/styles.css`         | CSS        |
| `./badge/styles.css`         | CSS        |
| `./list/styles.css`          | CSS        |
| `./table/styles.css`         | CSS        |
| `./tabs/styles.css`          | CSS        |
| `./pagination/styles.css`    | CSS        |
| `./popover/styles.css`       | CSS        |
| `./progress/styles.css`      | CSS        |
| `./dialog/styles.css`        | CSS        |
| `./disclosure/styles.css`    | CSS        |
| `./divider/styles.css`       | CSS        |
| `./drawer/styles.css`        | CSS        |
| `./descriptions/styles.css`  | CSS        |
| `./dropdown/styles.css`      | CSS        |
| `./donut/styles.css`         | CSS        |
| `./dropzone/styles.css`      | CSS        |
| `./toast/styles.css`         | CSS        |
| `./toolbar/styles.css`       | CSS        |
| `./transfer/styles.css`      | CSS        |
| `./tooltip/styles.css`       | CSS        |
| `./skeleton/styles.css`      | CSS        |
| `./spinner/styles.css`       | CSS        |
| `./confirm/styles.css`       | CSS        |
| `./notice/styles.css`        | CSS        |
| `./field/styles.css`         | CSS        |
| `./search/styles.css`        | CSS        |
| `./overlay/styles.css`       | CSS        |
| `./picker/styles.css`        | CSS        |
| `./datagrid/styles.css`      | CSS        |
| `./page/styles.css`          | CSS        |
| `./upload/styles.css`        | CSS        |
| `./tree/styles.css`          | CSS        |
| `./status/styles.css`        | CSS        |
| `./steps/styles.css`         | CSS        |
| `./empty/styles.css`         | CSS        |
| `./entry/styles.css`         | CSS        |
| `./hidden/styles.css`        | CSS        |
| `./theme.css`                | CSS        |
| `./core.css`                 | CSS        |
| `./reset.css`                | CSS        |
| `./file`                     | JavaScript |
| `./file/styles.css`          | CSS        |
| `./exception`                | JavaScript |
| `./exception/styles.css`     | CSS        |

The package manifest publishes its machine-readable UI contract under `miaixz`, covering public components, audited
properties and values, stable selectors, and runtime attributes. Removed APIs are not published as package metadata.

## Basic usage

Load the complete stylesheet once at the application entry point and provide the SDK internationalization runtime above the component tree:

```tsx
import "@miaixz/ui/styles.css";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Button, Field, Input, MiaixzLocaleProvider } from "@miaixz/ui";

const i18n = createMiaixzI18n({ locale: "en-US", fallbackLocale: "en-US" });

export function Example() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Field label="Space name" required>
        <Input placeholder="Enter a space name" />
      </Field>
      <Button type="button">Save</Button>
    </MiaixzLocaleProvider>
  );
}
```

Components can be imported from the package root or from stable subpaths:

```tsx
import { Button } from "@miaixz/ui/button";
import { Graph } from "@miaixz/ui/diagram/graph";
import { Icon, type IconName } from "@miaixz/icons";
import "@miaixz/icons/styles.css";
import "@miaixz/ui/button/styles.css";
import "@miaixz/ui/diagram/graph/styles.css";

const tenantIcon: IconName = "blocks";

<Icon name={tenantIcon} size="navigation" />;
```

`Icon`, `IconName`, the registry, fonts, provider protocol, and all icon CSS belong exclusively to
`@miaixz/icons`. UI components consume that public package directly; `@miaixz/ui` intentionally has
no `Icon` export, `./icons` subpath, icon registry, or icon stylesheet. Do not import `dist` or
internal source paths directly.

Product intent definitions are available only from their dedicated subpath:

```ts
import {
  getIntentDefinition,
  intentDefinitions,
  type Intent,
  type IntentDefinition,
} from "@miaixz/ui/intents";

const intent: Intent = "delete";
const definition: IntentDefinition = getIntentDefinition(intent);

definition === intentDefinitions[intent];
```

Each definition supplies the stable message key, icon name, and semantic tone for one product
intent. The intents API is intentionally absent from the package root and does not execute actions.

## Height-aware application navigation

Use structured `groups` when a shell rail must remain scrollbar-free at every viewport height.
The rail first reduces row density, then collects lower-priority destinations under the localized
overflow disclosure. Active destinations and items marked `overflow: "never"` remain visible while
a usable row is available. The overflow menu preserves destinations as links.

```tsx
import { NavigationRail, Shell, type NavigationRailGroupModel } from "@miaixz/ui";

const groups: NavigationRailGroupModel[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "workbench",
        href: "/workbench",
        label: "Workbench",
        textValue: "Workbench",
        current: "page",
      },
      { id: "spaces", href: "/spaces", label: "Spaces", textValue: "Spaces" },
    ],
  },
  {
    id: "context",
    label: "Context",
    placement: "end",
    items: [
      {
        id: "infra",
        href: "/infra/overview",
        label: "Multi-tenant",
        textValue: "Multi-tenant",
        overflow: "never",
      },
    ],
  },
];

<Shell
  header={header}
  sidebar={
    <NavigationRail
      brand={brand}
      toggle={toggle}
      groups={groups}
      overflowLabel="More"
      utility={accountMenu}
    />
  }
  sidebarOverflow="contained"
>
  {content}
</Shell>;
```

## Style layers

- `@miaixz/ui/foundation.css`: design tokens and foundational theme, typography, spacing, radius, shadow, motion, and density capabilities.
- `@miaixz/ui/components.css`: component styles. When both layers define the same selector, the component layer is authoritative.
- `@miaixz/ui/styles.css`: the recommended complete entry point, combining the foundation and component layers in a stable order.
- `@miaixz/ui/<subpath>/styles.css`: the sole selective CSS entry for each public DOM module; nested Graph uses `@miaixz/ui/diagram/graph/styles.css`.

Business applications should not override internal component selectors. Apply brand customization through public CSS variables and runtime appearance settings.

## Themes, colors, and density

The SDK stores and synchronizes appearance state. `Theme` is the only runtime owner that validates
and applies those settings to the DOM:

```tsx
import { createMiaixzSdk } from "@miaixz/sdk";
import { Theme } from "@miaixz/ui";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.example",
    environment: "production",
  },
});

sdk.appearance.patch({
  colorMode: "system",
  density: "comfortable",
  overrides: { light: { brand: "#55b52d" } },
});

export function Root() {
  return (
    <Theme appearance={sdk.appearance}>
      <App />
    </Theme>
  );
}
```

Supported color preferences are `light`, `dark`, and `system`. Supported density levels are `compact`, `standard`, and `comfortable`. The SDK persists appearance per application and tenant. Independently deployed services should synchronize the same settings through the Host Bridge or shared configuration.

## Project locale catalogs

The UI package registers only generic component messages. Business copy belongs in project-owned locale catalogs and is loaded through the single SDK internationalization instance:

```tsx
import { createMiaixzI18n, createMiaixzMessageLoader } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider } from "@miaixz/ui/i18n";

const loadMessages = createMiaixzMessageLoader({
  portal: {
    "en-US": () => import("./locales/en-US.js"),
    "fr-FR": () => import("./locales/fr-FR.js"),
  },
});

const i18n = createMiaixzI18n({
  locale: "en-US",
  fallbackLocale: "en-US",
  loadMessages,
});

await i18n.initialize(["portal"]);

export function Root() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <App />
    </MiaixzLocaleProvider>
  );
}
```

Locale modules export flat key-value objects by default. Project messages take precedence over built-in messages. Missing messages fall back to `fallbackLocale`; if no fallback is available, the message key is returned. `useMiaixzLocale()` exposes the current snapshot and translation function.

## Error handling

Component contract violations throw `MiaixzUiError`. Each error includes a stable `code`, a translatable `messageKey`, and optional sanitized `details`:

```ts
import { MiaixzUiError } from "@miaixz/ui/errors";

try {
  renderFeature();
} catch (error) {
  if (error instanceof MiaixzUiError) {
    reportUiFailure({ code: error.code, messageKey: error.messageKey });
  } else {
    throw error;
  }
}
```

Do not display `details` directly to users, and never include tokens, cookies, authorization headers, personal information, or file contents in error messages. Asynchronous request failures use the structured error model from `@miaixz/sdk`.

## Microfrontend integration

Every independently deployed service installs compatible UI and SDK versions instead of copying styles or compiled component assets. The host is responsible for:

1. Validating SDK module manifests and the Host Bridge protocol version.
2. Synchronizing non-sensitive context, locale, permissions, and appearance snapshots with modules.
3. Ensuring that React, ReactDOM, and the SDK have only compatible instances within one runtime.

Modules in the same runtime use `createMiaixzDirectHostBridge()`. Cross-origin iframes use `createMiaixzPostMessageHost()` and `createMiaixzPostMessageChildBridge()` with exact origins. A bridge writes each received snapshot to the module's `MiaixzAppearanceManager`; the mounted `Theme` applies it. A module must not create theme style nodes or read and modify the host DOM directly.

## Components

The public component collection includes:

- Foundations and forms: Button, ButtonGroup, Input, NumberInput, Search, Textarea, Select, Combobox, Picker, Field, Checkbox, Radio, Rating, Slider, Switch, Calendar, DatePicker, TimePicker, Dropzone, and Upload.
- Navigation and layout: Navigation, Breadcrumb, Tabs, Segmented, Toolbar, Shell, Page, View, Header, Grid, Masonry, Cluster, Split, Stack, Sidebar, Scroll, and Entry.
- Data display: Panel, List, Table, Datagrid, Tree, Badge, Tag, Pagination, Avatar, AvatarGroup, Divider, and Status.
- Feedback and overlays: Alert, Notice, Progress, Spinner, Overlay, Tooltip, Popover, Dropdown, Dialog, Confirm, Drawer, Disclosure, Toast, Skeleton, Empty, Exception, and Hidden.

Interactive components preserve native semantics, keyboard behavior, and visible focus. Icon-only buttons must provide an accessible name.

### Date and time values

`Calendar` and `DatePicker` exchange local Gregorian calendar strings in strict `YYYY-MM-DD`
format. `TimePicker` exchanges local wall-time strings in `HH:mm` format, or `HH:mm:ss` when
`includeSeconds` is enabled. Their public APIs intentionally do not use JavaScript `Date`; the
application converts a selected local value to an instant only when its business time zone is
known. Each calendar receives a required, stable `referenceDate`, so server and client rendering
do not depend on the machine clock.

```tsx
import { DatePicker, TimePicker } from "@miaixz/ui/date";
import "@miaixz/ui/date/styles.css";

<DatePicker aria-label="Birthday" name="birthday" referenceDate="2026-09-18" value="2000-01-01" />;

<TimePicker aria-label="Start time" name="startTime" value="09:30" />;
```

### Avatar capability

`Avatar` uses Miaixz tokens and slots while supporting image and responsive image sources, explicit text or icon content, semantic or custom CSS sizes, circular/rounded/square shapes, status or count indicators, and deterministic image fallbacks. Its fallback order is explicit `children`, the existing `name` graphemes, the first `alt` grapheme, then the package `UserRound` icon.

`AvatarGroup` stacks avatars with Miaixz spacing and surface tokens. It supports a visible maximum, a server-provided total, custom surplus content, preset or numeric overlap spacing, inherited shape, root/surplus slots, refs, and Theme defaults/variants.

Avatar interaction remains compositional. Use `Pressable` around an Avatar for commands or menu triggers, and use `Dropzone accept="image/*"` around an Avatar for local image selection. The Avatar itself never changes into a button or performs an upload. This preserves native interaction semantics without duplicating an avatar-specific button or uploader.

## Local development

```bash
npm ci --package-lock=true --ignore-scripts --legacy-peer-deps
npm run check
```

Run `npm run check:package` from the repository root to validate both packed packages.

The package builds independently with npm and does not rely on implicit tools outside the repository.

Publishing is coordinated by the repository release workflow. `@miaixz/ui` and `@miaixz/sdk` must share the exact version and are published together from an unprefixed semantic-version tag. Stable releases use the `latest` dist-tag, while prereleases use `next`.

## Security and notices

- See the repository [security policy](../SECURITY.md) for vulnerability reporting instructions and supported release information.
- See [NOTICE](./NOTICE) for package attribution notices.

## License

Apache-2.0

### Theme catalog

Concrete theme definitions and their owned assets live under
`src/theme/presets/**/<theme>/` and are exposed through the sole JavaScript entry
`@miaixz/ui/theme`. Every leaf theme directory contains `index.ts` and `preset.json`; built-ins may
also own a generated `styles.css`. The preset generator recursively discovers these metadata files,
validates the compiled definitions, and regenerates the ordered descriptor and dynamic-import
manifest. `Theme` advertises every descriptor and lazily imports non-built-in presets when selected.
Use `themePresets` for selector metadata, `loadThemePreset(name, context)` for one definition, or
`loadThemePresets()` with `createThemeStyles` when a server needs first-paint CSS for every optional
preset. `createThemeScript` automatically accepts every generated preset unless an explicit
`themes` allowlist is supplied. Adding a theme requires no catalog, loader, or audit-rule edit.

### Persistent route views

Use `View preserveFrame` in a shared router layout and `View inheritFrame` in its route pages. Supply `currentHref` on the persistent frame to update the active route even while catalogs or content are loading. The header, navigation and action region keep their DOM identity while the authorized route replaces its content. Destination actions and local state continue to update the retained frame. An inherited view also works standalone.

`MiaixzLinkProvider refreshMode="content"` keeps the configured router adapter. Set `refreshMode="page"` to use native anchors and reload the browser document. `Navigation refreshMode` overrides the provider for one navigation region. The default is `content`. Modified clicks, download links and explicit targets retain native anchor behavior. Custom router click handlers must respect `data-miaixz-refresh-mode="page"` and leave those clicks to the browser.

```tsx
<MiaixzLinkProvider renderAnchor={renderRouterLink} refreshMode="content">
  <View aria-label="Module" preserveFrame title={null}>
    <AuthorizedRoute />
  </View>
</MiaixzLinkProvider>
```

The authorized route renders its ordinary `View` with `inheritFrame`. The application owns routing, catalog loading, authorization and the lifetime of the shared layout; the UI package does not bypass route guards.

For in-page module tabs, `Tabs refreshMode="page"` reloads the current address after an accepted selection and restores that selection once from session storage. Controlled tabs restore through `onValueChange`; read-only tabs remain unchanged. Use a unique `persistenceKey` when a page contains multiple collections with identical values. Tabs inherit the link provider policy and accept a component-specific override. The default `content` mode keeps existing in-page behavior.

Tabs headers reserve the natural width of their labels before wrapping actions onto another row.
Toolbar actions can wrap within the available content width; overflowing tab labels remain
horizontally scrollable. `List` leading graphics reserve their actual size, including avatars and
larger entity badges, while retaining the shared row gap and vertical alignment.

Use `Cluster wrap={false}` to keep related inline content, such as an avatar and member identity,
on the same row. `DatagridColumn.overflow="ellipsis"` opts a column into single-line truncation;
wrapping remains the default. Supply a native `title` on cell content when the full value should
be available on hover, and use explicit column widths when narrow viewports require table scrolling.
`TableContainer` and `Datagrid` use `gutter="inset"` by default for readable list spacing. Use
`gutter="flush"` for dense trees, matrices, and other tables that must reach their container edges.

Embedded views can call `useMiaixzLocale().loadNamespace(namespace, locale)` before opening to load
their own messages through the existing SDK runtime. This does not create a second translator or
require mutually dependent route catalogs. `EditorPicker` bounds long selection lists and allows
wheel scrolling to continue into the parent form at the list boundary.

`Search` clear actions use the shared field-action styling with a centered 12px indicator and a
24px desktop click target (expanded for coarse pointers). They remain independent of general
`IconButton` dimensions and retain their tooltip, accessible label, clear callbacks, input-focus
restoration and native `slotProps.clear` contract, matching the lightweight actions in selectors
and date/time inputs.

All field surfaces resolve their text and icon insets through
`--miaixz-control-padding-inline`, including explicit small/medium/large sizes. Search clear,
Combobox/Picker disclosure and DatePicker/TimePicker actions align their visible trailing icon
edge to that inset, matching Select. Their centered click targets do not add extra visual padding;
coarse-pointer targets expand without moving the icon edge. Logical spacing preserves the same
contract in RTL layouts. Plain text inputs and textarea content/counts use the same inset.

Single-line Input, Search, Select and Combobox frames share the resolved
`--miaixz-control-block-size` (40px at the standard medium size). Their inner native controls cannot
expand the frame. Picker uses that same minimum with 24px embedded chips and expands only when
selected values wrap; standalone tags retain density-based sizing. Trailing IconButton commands
and text actions in Input adornments follow the same visible inset as field indicators. These
rules belong to the public components and apply equally inside Drawer and EditorLayout.

Use the exported `CONTROL_FRAMES.medium` class through Theme slot classes when an application
requires every single-line field to use 40px height and 16px inline padding even if a caller
supplies another `size`. Configure Input/Select `root` and Combobox/Picker `control` once at the
application Theme boundary. `small` and `large` recipes are also available; touch minimums and
Picker wrapping remain owned by the library. This replaces application CSS height overrides.

NumberInput uses compact 24px-wide step buttons and reserves four characters for the numeric
editor. Text suffixes shrink with ellipsis and expose the complete unit on hover, preventing
narrow table or drawer cells from hiding the editable value. Step buttons stretch with the field
frame; their value-change and validation behavior is unchanged.

At very narrow widths, NumberInput hides its auxiliary suffix/step strip so the numeric editor
remains usable; ArrowUp/ArrowDown keep their ordinary step behavior, and text units remain in the
native input tooltip. Select reduces only the gap between value and indicator when necessary,
keeping the indicator at the standard trailing inset without horizontal overflow.

Header Search retains its caption typography and shortcut treatment while sharing the ordinary
field frame, inline padding and 16px leading-icon reservation. Prefix text such as currency units
belongs inside the same content inset; it does not count as additional outer padding.

### Exception

`Exception` presents 404, 403, 500 and temporary service unavailability. It is a pure presentation component: no tenant identity, Logo, request, routing, automatic retry or error boundary is created. Wrap it in the existing `Entry` for a full-page layout.

```tsx
import { Button, Entry, Exception } from "@miaixz/ui";

<Entry layout="centered" contentComponent="main">
  <Exception
    status="500"
    title="This page could not be loaded"
    description="Reload the page to try again."
    background="none"
    actions={<Button onClick={retry}>Reload</Button>}
  />
</Entry>;
```

The component and styles are also available from `@miaixz/ui/exception` and `@miaixz/ui/exception/styles.css`. The aggregate UI stylesheet already includes the component style.

| Property               | Contract                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `status`               | Required: `"404"`, `"403"`, `"500"` or `"unavailable"`                                                                                                 |
| `title`, `description` | Optional React content; defaults come from the existing UI locale catalog. A provider-free failure uses English. Pass `false` to hide the description. |
| `illustration`         | Optional decorative content; omit for a bundled local SVG, pass `false` or `null` to hide it.                                                          |
| `actions`              | Caller-owned buttons or links; no destination or recovery behavior is inferred.                                                                        |
| `background`           | `"none"` (default), `"surface"` or `"subtle"`; follows the active theme.                                                                               |
| `headingLevel`         | `1` (default) through `6`, allowing embedded failure content without adding a second page heading.                                                     |
| `showCode`             | Defaults to `true`; the unavailable preset never invents an HTTP status code.                                                                          |
| `slotProps`            | `root`, `background`, `content`, `illustration`, `code`, `title`, `description`, `actions`                                                             |

Use `slotProps.background` to supply a custom decorative background through `children`, `className` or native styles. This slot is hidden from assistive technology and ignores pointer events. Full-viewport background remains the responsibility of the outer `Entry`; the exception surface can also be embedded in a smaller region. `Theme.components.Exception` supports the same public defaults, owner-state variants and slot classes as other UI components.

The four original inline SVG office stories reuse neutral figures and ordinary work actions. Clothing reads `--miaixz-color-brand`, accent fills read `--miaixz-color-brand-soft`, and outlines/paper follow neutral theme colors. No raster recoloring, fixed green clothing, remote images or Logo resolution is needed. The illustrations have no visible text, flags, badges, political slogans or geographical boundaries. Custom illustrations and background content are supplied explicitly by the caller and should follow the same neutral-content review.

### Configured Picker surfaces

Existing `Picker` calls without `selectionMode` retain their searchable multiple-selection
contract, option-array values, asynchronous option loading and chip rendering.
Explicit `selectionMode="single"` uses `MiaixzOption | null`; explicit `"multiple"` uses
`readonly MiaixzOption[]`. Both accept static `options` or `renderContent` for custom content.
`renderContent` receives the staged value, `onValueChange`, `disabled` and `readOnly`.
Custom content owns its search, paging, asynchronous requests and keyboard semantics;
`loading`, `errorMessage` and `onRetry` provide shared status feedback.

`presentation` accepts `popover` (default), `drawer`, `dialog`, or `inline`. These reuse
existing public containers; they do not change Select, Combobox or date/time contracts.
`commitMode="immediate"` is the default. With `"confirm"`, only confirmation updates the
public value and native form value; cancellation or dismissal discards the staged selection.
`clearable` exposes clearing only for optional fields. Controlled values without a change
callback remain read-only. Custom content unmounts when closed and mounts after the open
surface has an opportunity to paint. Keep expensive work inside that content, not in the
caller before opening the Picker. The default option renderer uses native radios or checkboxes.

```tsx
<Picker
  selectionMode="single"
  presentation="drawer"
  commitMode="confirm"
  drawerWidth={800}
  label="Choose resource"
  value={selected}
  onValueChange={setSelected}
  renderValue={(option) => option?.label ?? "Choose resource"}
  renderContent={(state) => (
    <ResourceCatalog selected={state.value} onSelect={state.onValueChange} />
  )}
/>
```
