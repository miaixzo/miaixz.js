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
 * Verifies finite consumer branches and failures using disposable source-only fixtures.
 */
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const tools = await import(
  pathToFileURL(
    resolve(process.cwd(), "../../.github/scripts/modules/icons/quality/read-icon-consumers.mjs"),
  ).href
);
const names = ["loader", "loading", "star", "star-half", "check-line", "rotate-ccw", "close"];

/**
 * Captures exact fixture contents in memory, not in a saved coverage record.
 * @param directory - Isolated source root.
 * @returns Exact filename and bytes map.
 */
async function snapshot(directory: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const name of await readdir(directory))
    result[name] = (await readFile(resolve(directory, name))).toString("base64");
  return result;
}

/**
 * Cleans fixtures after success and failure and verifies the scanner itself performs no writes.
 * @param files - Literal isolated test source files.
 * @param inspect - In-memory assertion callback.
 * @returns Completion after cleanup.
 */
async function fixture(
  files: Record<string, string>,
  inspect: (root: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(resolve(tmpdir(), "miaixz-icon-consumers-"));
  try {
    for (const [name, source] of Object.entries(files))
      await writeFile(resolve(root, name), source);
    const before = await snapshot(root);
    try {
      await inspect(root);
    } finally {
      expect(await snapshot(root)).toEqual(before);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("read-only icon consumers", () => {
  it("follows aliases, imports, JSON, maps, arrays, spreads and every finite branch", async () => {
    await fixture(
      {
        "constants.ts":
          'export const fallback = "rotate-ccw"; export const pair = ["star", "star-half"] as const;',
        "config.json": '{"icon":"close"}',
        "consumer.tsx": `
        import { Icon as Glyph, type IconName } from "@miaixz/icons";
        import { IconButton as Action } from "@miaixz/ui";
        import { createElement as create } from "react";
        import { fallback, pair } from "./constants.js";
        import config from "./config.json";
        const mapping: Record<string, IconName> = { idle: fallback, loading: "loader", complete: "check-line" };
        const attrs = { ...{ name: "loading" } };
        function name(): IconName { return condition ? "loader" : "check-line"; }
        export const view = <>
          <Glyph name={state === "expand" ? mapping.loading : state === "complete" ? mapping.complete : mapping.idle}/>
          <Glyph name={half ? pair[1] : pair[0]} title="expand"/>
          <Glyph {...attrs}/><Action icon={config.icon}/>
          <Glyph name={name()}/><ListMarker variant="dot"/>
          <span>★ ☀</span><img src="/image.png"/><link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon"/>
          {create(Glyph, { ...attrs })}
        </>;
      `,
      },
      async (root) => {
        const result = await tools.readIconConsumers({ roots: [root], names });
        expect(result.unresolved).toEqual([]);
        expect(result.names).toEqual([...names].sort());
        expect(
          result.references.every(
            (site: { path: string; line: number }) => site.path.startsWith(root) && site.line > 0,
          ),
        ).toBe(true);
        expect(result).not.toHaveProperty("version");
        expect(result).not.toHaveProperty("outputPath");
      },
    );
  });

  it("recognizes declared public parameters, inherited props and item renderers", async () => {
    await fixture(
      {
        "consumer.tsx": `
      import { Icon, type IconName, type IconName as Name, type IconProps } from "@miaixz/icons";
      import { createElement, forwardRef } from "react";
      interface Base { icon: IconName }
      interface Props extends Base { items: readonly Base[] }
      interface PickedProps extends Pick<Base, "icon"> {}
      function direct(name: IconName) { return <Icon name={name}/>; }
      function aliased(name: Name) { return <Icon name={name}/>; }
      function list(items: ReadonlyArray<Base>) { return items.flatMap(item => <Icon name={item.icon}/>); }
      function inherited({ icon, items }: Props) { return <><Icon name={icon}/>{items.map(item => <Icon name={item.icon}/>)}</>; }
      function picked(props: PickedProps) { return createElement(Icon, { name: props.icon }); }
      const forwarded = forwardRef<HTMLElement, IconProps>(function component(props, ref) { return <Icon name={props.name}/>; });
    `,
      },
      async (root) => {
        const result = await tools.readIconConsumers({ roots: [root], names });
        expect(result.unresolved).toEqual([]);
        expect(result.genericConsumers).toHaveLength(7);
        expect(result.names).toEqual([]);
      },
    );
  });

  it.each([
    'const name = "missing-icon"; const view = <Icon name={name}/>;',
    "function view(name: string) { return <Icon name={name}/>; }",
    "function view(name: any) { return <Icon name={name as IconName}/>; }",
    'function view(props: Omit<IconProps, "name">) { return <Icon name={props.name}/>; }',
    'interface Props extends Pick<IconProps, "size"> {} function view(props: Props) { return <Icon name={props.name}/>; }',
    "const name = name; const view = <Icon name={name}/>;",
    'const view = <Icon name="loader" {...runtimeProps}/>;',
    'const name = (() => { const nested = () => "loader"; return runtimeName; })(); const view = <Icon name={name}/>;',
  ])("fails unknown or non-finite names: %s", async (source) => {
    await fixture(
      {
        "consumer.tsx":
          'import { Icon, type IconName, type IconProps } from "@miaixz/icons"; ' + source,
      },
      async (root) => {
        const result = await tools.readIconConsumers({ roots: [root], names });
        expect(result.unresolved.length).toBeGreaterThan(0);
        expect(result.genericConsumers).toEqual([]);
      },
    );
  });

  it("detects cross-module cycles without reading sibling repositories", async () => {
    await fixture(
      {
        "a.ts": 'import { b } from "./b.js"; export const a = b;',
        "b.ts": 'import { a } from "./a.js"; export const b = a;',
        "consumer.tsx":
          'import { Icon } from "@miaixz/icons"; import { a } from "./a.js"; const view = <Icon name={a}/>;',
      },
      async (root) =>
        expect(
          (await tools.readIconConsumers({ roots: [root], names })).unresolved.length,
        ).toBeGreaterThan(0),
    );
  });

  it("rejects parse errors, missing roots, empty roots and every record-producing mode", async () => {
    await fixture({ "broken.tsx": "export const = ;" }, async (root) => {
      await expect(tools.readIconConsumers({ roots: [root], names })).rejects.toThrow(
        /Cannot parse/,
      );
      await expect(
        tools.readIconConsumers({ roots: [resolve(root, "missing")], names }),
      ).rejects.toThrow();
    });
    await fixture({}, async (root) => {
      await expect(tools.readIconConsumers({ roots: [root], names })).rejects.toThrow(/no source/);
    });
    await expect(tools.readIconConsumers({ roots: [], names })).rejects.toThrow(/At least one/);
    expect(tools.parseArguments(["--mode", "check"])).toEqual({ mode: "check" });
    for (const mode of ["write", "report", "snapshot", "update"])
      expect(() => tools.parseArguments(["--mode", mode])).toThrow();
  });
});
