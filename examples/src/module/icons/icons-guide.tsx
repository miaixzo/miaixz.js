"use client";

import { Icon, type IconName, type IconSize } from "@miaixz/icons";
import { ICON_CATALOG } from "@miaixz/icons/catalog";
import { useMemo, useState } from "react";

import { CodeBlock, GuideHeader, GuideSection, Stat } from "../../shared/guide/guide-parts";
import styles from "./icons-guide.module.css";

const semanticSizes: readonly IconSize[] = [
  "indicator",
  "inline",
  "control",
  "navigation",
  "feature",
  "display",
];
const pageSize = 96;
const orderedCatalog = [...ICON_CATALOG].sort((left, right) =>
  left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
);
const refinementFills = [0, 0.25, 0.5, 0.75, 1] as const;

/**
 * Selects the pilot icons used to preview source refinement at different font sizes.
 */
const refinementPilots: readonly IconName[] = [
  "layout-dashboard",
  "folder",
  "building",
  "shield-check",
  "workflow",
  "scroll-text",
  "server-cog",
  "settings",
];
const refinementSizes = [12, 16, 20, 24, 32, 40] as const;

/**
 * Presents the complete variable-font icon catalog with live React controls.
 */
export function IconsGuide() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [family, setFamily] = useState("all");
  const [fill, setFill] = useState(0);
  const [opsz, setOpsz] = useState(24);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [page, setPage] = useState(0);
  const [matrixExpanded, setMatrixExpanded] = useState(false);
  const [selected, setSelected] = useState<IconName>(ICON_CATALOG[0]!.name);

  const categories = useMemo(
    () => [...new Set(ICON_CATALOG.map((record) => record.category))].sort(),
    [],
  );
  const families = useMemo(
    () => [...new Set(orderedCatalog.map((record) => record.name.split("-")[0]!))].sort(),
    [],
  );
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orderedCatalog.filter((record) => {
      const categoryMatches = category === "all" || record.category === category;
      const familyMatches = family === "all" || record.name.split("-")[0] === family;
      const queryMatches =
        normalizedQuery === "" ||
        record.name.includes(normalizedQuery) ||
        record.category.includes(normalizedQuery);
      return categoryMatches && familyMatches && queryMatches;
    });
  }, [category, family, query]);
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const visible = matches.slice(page * pageSize, (page + 1) * pageSize);
  const selectedRecord = ICON_CATALOG.find((record) => record.name === selected)!;
  const accessibility = selectedRecord.name.replaceAll("-", " ");

  return (
    <div>
      <GuideHeader
        packageName="@miaixz/icons"
        title="从目录到字形，一眼验证。"
        description="直接使用 ICON_CATALOG 与 Icon 组件。搜索名称，调整可变字体轴，并检查 RTL 与可访问标签。"
      />

      <GuideSection title="目录概览" description="数据来自包内生成目录，不维护第二份演示清单。">
        <div className={styles.stats}>
          <Stat label="图标记录" value={ICON_CATALOG.length} detail="独立图标目录" />
          <Stat label="分类" value={categories.length} detail="按使用语境分组" />
          <Stat label="渲染方式" value="WOFF2" detail="单一可变字体" />
        </div>
      </GuideSection>

      <GuideSection
        title="字形检查器"
        description="FILL 在 0 到 1 之间连续变化，opsz 由数值尺寸驱动。方向切换可核对需要镜像的图标。"
      >
        <div className={styles.inspector} dir={direction}>
          <div className={styles.preview}>
            <Icon fill={fill} label={`${accessibility} 图标预览`} name={selected} size={opsz} />
            <div>
              <strong>{selected}</strong>
              <span>{selectedRecord.category}</span>
            </div>
          </div>
          <div className={styles.controls} dir="ltr">
            <label>
              <span>FILL {fill.toFixed(2)}</span>
              <input
                max="1"
                min="0"
                onChange={(event) => setFill(Number(event.currentTarget.value))}
                step="0.05"
                type="range"
                value={fill}
              />
            </label>
            <label>
              <span>opsz {opsz}px</span>
              <input
                max="40"
                min="12"
                onChange={(event) => setOpsz(Number(event.currentTarget.value))}
                step="1"
                type="range"
                value={opsz}
              />
            </label>
            <fieldset>
              <legend>direction</legend>
              <button
                aria-pressed={direction === "ltr"}
                onClick={() => setDirection("ltr")}
                type="button"
              >
                LTR
              </button>
              <button
                aria-pressed={direction === "rtl"}
                onClick={() => setDirection("rtl")}
                type="button"
              >
                RTL
              </button>
            </fieldset>
          </div>
        </div>
        <div className={styles.semanticSizes}>
          {semanticSizes.map((size) => (
            <div key={size}>
              <Icon name={selected} size={size} />
              <code>{size}</code>
            </div>
          ))}
        </div>
        <CodeBlock>{`import { Icon } from "@miaixz/icons";

<Icon
  name="${selected}"
  size="navigation"
  fill={${fill.toFixed(2)}}
  label="${accessibility}"
/>`}</CodeBlock>
      </GuideSection>

      <GuideSection
        title="首批精修实尺寸对照"
        description="八个首批图标使用生产字体与真实字号，同时显示 outline 和 filled；本区域不缩放图形。"
      >
        <div className={styles.refinementGrid} dir={direction}>
          {refinementPilots.map((name) => (
            <div className={styles.refinementRow} key={name}>
              <code>{name}</code>
              {refinementSizes.map((size) => (
                <div className={styles.refinementCell} key={size}>
                  <span>{size}px</span>
                  <div>
                    <Icon
                      label={`${name} outline ${size}px`}
                      name={name}
                      size={size}
                      variant="outline"
                    />
                    <Icon
                      label={`${name} filled ${size}px`}
                      name={name}
                      size={size}
                      variant="filled"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection
        title="完整图标目录"
        description="搜索匹配规范名称与分类。选择任意字形后，上方检查器会立即更新。"
      >
        <div className={styles.filters}>
          <label>
            <span>搜索名称</span>
            <input
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setPage(0);
              }}
              placeholder="例如 arrow、file、user"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span>分类</span>
            <select
              onChange={(event) => {
                setCategory(event.currentTarget.value);
                setPage(0);
              }}
              value={category}
            >
              <option value="all">全部分类</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>完整族名</span>
            <select
              value={family}
              onChange={(event) => {
                setFamily(event.currentTarget.value);
                setPage(0);
              }}
            >
              <option value="all">全部族</option>
              {families.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <span aria-live="polite">{matches.length} 个结果</span>
        </div>

        {visible.length > 0 ? (
          <div className={styles.catalog} dir={direction}>
            {visible.map((record) => (
              <button
                aria-pressed={selected === record.name}
                className={styles.iconItem}
                key={record.name}
                onClick={() => setSelected(record.name)}
                type="button"
              >
                <span className={styles.catalogPreviews}>
                  <Icon name={record.name} size={16} variant="outline" />
                  <Icon name={record.name} size={24} variant="outline" />
                  <Icon name={record.name} size={24} variant="filled" />
                </span>
                <span>{record.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            没有匹配的图标。请调整名称或分类。
          </div>
        )}

        <nav className={styles.pagination} aria-label="图标目录分页">
          <button
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
            type="button"
          >
            上一页
          </button>
          <span aria-live="polite">
            第 {page + 1} / {pageCount} 页
          </span>
          <button
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            下一页
          </button>
        </nav>
        <details onToggle={(event) => setMatrixExpanded(event.currentTarget.open)}>
          <summary>本页完整六尺寸 × 五填充对照</summary>
          {matrixExpanded && (
            <div className={styles.refinementGrid} dir={direction}>
              {visible.map((record) => (
                <div className={styles.refinementRow} key={record.name}>
                  <code>{record.name}</code>
                  {refinementSizes.map((size) => (
                    <div className={styles.refinementCell} key={size}>
                      <span>{size}px</span>
                      <div>
                        {refinementFills.map((value) => (
                          <Icon
                            key={value}
                            label={`${record.name} ${size}px FILL ${value}`}
                            name={record.name}
                            size={size}
                            fill={value}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </details>
      </GuideSection>
    </div>
  );
}
