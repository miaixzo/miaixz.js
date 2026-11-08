# Miaixz examples

This directory contains one Next.js application for all package guides. Each package keeps its
own implementation under `src/module`, while routes and shared runtime providers stay in
`src/app` and `src/shared`.

```text
src/
├── app/                Routes for /ui, /icons, /sdk, and /view
├── module/
│   ├── icons/          Variable-font catalog and axis controls
│   ├── sdk/            HTTP, config, session, grants, appearance, i18n, and event demo
│   ├── ui/             Component workbench and complete public catalog
│   └── view/           Image, Office, and local-file previews
└── shared/             Application shell, guide primitives, and providers
```

Install and run from this directory:

```bash
npm ci --package-lock=true --ignore-scripts --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000`. The application uses the four local packages through `file:`
dependencies, so build the workspace packages first when their output is stale.
