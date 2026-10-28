# miaixz.js

[English](./README.md) | [简体中文](./README_CN.md)

> Build with intelligence. Create without limits.

`miaixz.js` is the public JavaScript and TypeScript monorepo maintained by Miaixz. It contains the browser SDK, independent icon system, React design system, and file preview components used by independently deployed Miaixz frontend services.

The repository is organized as an npm workspace. All public packages use one synchronized version and are released together from the same Git tag.

## Packages

| Package                             | npm                                                | Description                                                                                                                         |
| ----------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`@miaixz/sdk`](./packages/sdk)     | [npm](https://www.npmjs.com/package/@miaixz/sdk)   | Browser API client, runtime context, configuration, permissions, events, files, appearance, i18n, types, formatters, and utilities. |
| [`@miaixz/icons`](./packages/icons) | [npm](https://www.npmjs.com/package/@miaixz/icons) | Miaixz variable font, React Icon, semantic sizes, continuous animation, and accessibility.                                          |
| [`@miaixz/ui`](./packages/ui)       | [npm](https://www.npmjs.com/package/@miaixz/ui)    | React design system with components, design tokens, themes, density modes, styles, and interaction primitives.                      |
| [`@miaixz/view`](./packages/view)   | [npm](https://www.npmjs.com/package/@miaixz/view)  | Independent React components for image, PDF, Office, and other local file previews.                                                 |

### Package relationship

`@miaixz/sdk` and `@miaixz/icons` are independent foundations. `@miaixz/ui` consumes both directly. `@miaixz/view` consumes only `@miaixz/icons` and carries local CSS token fallbacks, so it does not require UI or SDK.

The only internal core-package dependency edges are `ui → sdk`, `ui → icons`, and `view → icons`. This graph is checked from manifests, source imports, built declarations, CSS, and packed artifacts.

## Requirements

- Node.js 20.19 or later at the workspace root. SDK and UI consumers support Node.js 20 or later; `@miaixz/view` requires Node.js 20.19 or later.
- npm 10 or later.
- An ESM-compatible application and build tool.
- React and ReactDOM when using `@miaixz/icons`, `@miaixz/ui`, or `@miaixz/view`.

## Installation

Install the SDK by itself:

```bash
npm install @miaixz/sdk
```

Install the independent icon system:

```bash
npm install @miaixz/icons react react-dom
```

Install the design system and its peers:

```bash
npm install @miaixz/ui @miaixz/icons @miaixz/sdk react react-dom
```

Install file previews independently:

```bash
npm install @miaixz/view @miaixz/icons react react-dom
```

All packages are ESM-only and do not expose CommonJS `require` entry points.

## Quick start

Create a browser SDK instance:

```ts
import { createMiaixzSdk } from "@miaixz/sdk";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.org",
    environment: "production",
  },
  locale: "en-US",
});

await sdk.ready;

const response = await sdk.api.get<readonly { id: string; name: string }[]>("/spaces");
console.log(response.data);
```

Use the shared React components and styles:

```tsx
import "@miaixz/ui/styles.css";
import { Button, Field, Input, Theme } from "@miaixz/ui";

import { sdk } from "./sdk.js";

export function CreateSpaceForm() {
  return (
    <Theme appearance={sdk.appearance}>
      <form>
        <Field label="Space name" required>
          <Input placeholder="Enter a space name" />
        </Field>
        <Button type="submit">Create space</Button>
      </form>
    </Theme>
  );
}
```

Choose one public CSS entry at the application root:

- `@miaixz/ui/styles.css` for the SDK-selected default theme with all foundation and component styles.
- `@miaixz/ui/theme.css` for all built-in themes.
- `@miaixz/ui/foundation.css`, `@miaixz/ui/components.css`, `@miaixz/ui/core.css`, and `@miaixz/ui/reset.css` for explicitly layered integrations.

For selective delivery, load the chosen theme/foundation entry and then each DOM module's sole
`@miaixz/ui/<subpath>/styles.css` entry. For example, Button uses
`@miaixz/ui/button/styles.css` and Graph uses `@miaixz/ui/diagram/graph/styles.css`.

The SDK persists `theme`, `colorMode`, `density`, and mode-specific color overrides. The UI
`Theme` component validates and applies them atomically. Applications own their page root background
through the public Page Surface variables; the library intentionally does not set a background on
`html` or `body`.

`@miaixz/ui/view` exports the design-system `View` used for page layout. `@miaixz/view` is a
separate file-preview package and exports `FileView`, `ImageView`, `PdfView`, and `OfficeView`—it
does not export a component named `View`. Preview styles include local theme fallbacks, so import
the icon and preview styles without a UI or SDK provider:

```tsx compile
import "@miaixz/icons/styles.css";
import "@miaixz/view/styles.css";
import { FileView } from "@miaixz/view";

export function PreviewExample() {
  return <FileView source="/diagram.png" />;
}
```

See the package documentation for authentication modes, API envelopes, service clients, permissions, cross-tab events, appearance synchronization, internationalization, component contracts, and microfrontend integration:

- [SDK documentation](./packages/sdk/README.md)
- [Icons documentation](./packages/icons/README.md)
- [UI documentation](./packages/ui/README.md)
- [View documentation](./packages/view/README.md)

## Repository layout

```text
.
├── .github/
│   ├── actions/        Reusable GitHub Actions
│   ├── workflows/      GitHub workflow configuration
│   └── scripts/
│       ├── modules/    UI, View, and Icons automation grouped by module
│       ├── package/    Cross-module package validation
│       ├── quality/    Cross-module repository quality checks
│       └── release/    Cross-module release automation
├── packages/
│   ├── sdk/            @miaixz/sdk source and package configuration
│   ├── icons/          @miaixz/icons font source, runtime, React API, and tests
│   ├── ui/             @miaixz/ui source and package configuration
│   └── view/           @miaixz/view source and package configuration
├── examples/           One Next.js guide application
│   ├── src/module/     UI, icons, SDK, and view guide modules
│   └── miaixz.org/     Standalone public website example
├── VERSION             Authoritative shared release version
└── package.json        Private npm workspace root
```

The workspace root is private and is never published. Every package listed above is an independent public npm package at the synchronized version.

The root `package.json` `workspaces` array is the repository's only package registry. Build,
source-policy, version, package validation, artifact, and publication tooling reads that array and
each workspace manifest dynamically. Add a package there once; only package-specific architecture
rules and contract tests require separate configuration.

## Development

Install every automatically discovered npm dependency graph without running package lifecycle
scripts:

```bash
npm run install:all
```

When dependency metadata changes, regenerate and review the adjacent `package-lock.json` for every
automatically discovered npm graph with the repository-pinned npm version.

Run the standard repository checks:

```bash
npm run check
```

Build every workspace:

```bash
npm run build
```

Run an individual package validation phase only while diagnosing a failure:

```bash
npm run check:package
```

Additional root commands:

| Command                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `npm run build`         | Build every workspace in internal dependency order.    |
| `npm run typecheck`     | Type-check all workspaces without building.            |
| `npm run lint`          | Run workspace linters.                                 |
| `npm run lint:fix`      | Apply supported lint fixes.                            |
| `npm run format`        | Format workspace source files.                         |
| `npm run format:check`  | Verify formatting without modifying files.             |
| `npm run check`         | Run static, browser, package, and clean-tree checks.   |
| `npm run check:package` | Diagnose packed package and consumer fixture failures. |

## Version management

`VERSION` is the authoritative repository version. The version script updates all related values together:

```bash
npm run version:set -- 1.2.3
```

The script synchronizes:

- `VERSION`
- the root workspace version
- every workspace manifest version
- exact internal development, runtime, and optional dependency versions
- compatible internal peer dependency ranges and their development dependencies
- browser-safe SDK, UI, and View `VERSION` exports generated from the root file
- protocol, Schema, theme, locale, and persistence versions through those exports

Project-owned runtime versions must reference `VERSION`, not a separate numeric or semantic
version constant. Static configuration JSON does not carry an independent version; generated
runtime descriptors inject `VERSION`. `npm run version:check` rejects stale generated constants.
Legacy persisted version identifiers exist only at compatibility-reading boundaries.
Dependency versions and standardized file-format identifiers remain their actual external values.

All public packages must always have the same exact release version.

## Release process

Releases are driven by an unprefixed semantic-version Git tag. For example, version `1.2.3` uses tag `1.2.3`, never `v1.2.3`.

The expected release sequence is:

1. Complete and validate changes on `dev`.
2. Merge `dev` into `main` with an explicit merge commit.
3. Create the exact version tag on that merge commit.
4. Push `main` and the tag.
5. GitHub Actions builds and validates all workspaces.
6. The workflow publishes every public workspace with the same version.
7. The workflow waits for all package versions to become visible in the npm registry.
8. After npm publication succeeds, the workflow creates the matching GitHub Release and generates
   its notes from the commits and merged pull requests since the previous tag.

Stable versions use the npm `latest` dist-tag. Prerelease versions use `next`. The publication action is resumable: if one package version already exists, it publishes only the missing package and restores version parity.

The release workflow requires the `NPM_TOKEN` GitHub Actions secret when token-based npm authentication is used. The token must have read/write package access and permission to bypass 2FA for automated publishing. npm Trusted Publishing can replace the long-lived token after all packages have been configured as trusted publishers.

## Security

Report vulnerabilities according to [SECURITY.md](./SECURITY.md). Do not include tokens, cookies, authorization headers, CSRF values, personal information, request bodies, or private file contents in public issues.

## License

Licensed under the [Apache License 2.0](./LICENSE).
