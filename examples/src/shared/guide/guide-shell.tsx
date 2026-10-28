"use client";

import { Icon, type IconName } from "@miaixz/icons";
import { Appearance } from "@miaixz/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./guide-shell.module.css";

/**
 * Content and configuration supplied to the Guide Shell example renderer.
 */
interface GuideShellProps {
  readonly children: ReactNode;
}

const guides: readonly { href: string; label: string; icon: IconName }[] = [
  { href: "/ui", label: "UI", icon: "layout-dashboard" },
  { href: "/icons", label: "Icons", icon: "component" },
  { href: "/sdk", label: "SDK", icon: "code" },
  { href: "/view", label: "View", icon: "file" },
];

/**
 * Owns the single application navigation shared by all guide modules.
 */
export function GuideShell({ children }: GuideShellProps) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <header className={styles.navigation}>
        <div className={styles.navigationInner}>
          <Link className={styles.brand} href="/" aria-label="Miaixz 示例首页">
            <span className={styles.brandMark} aria-hidden="true">
              M
            </span>
            <span>Miaixz Guides</span>
          </Link>
          <nav aria-label="指南模块" className={styles.links}>
            {guides.map((guide) => {
              const selected = pathname === guide.href;
              return (
                <Link
                  aria-current={selected ? "page" : undefined}
                  className={styles.link}
                  data-selected={selected || undefined}
                  href={guide.href}
                  key={guide.href}
                >
                  <Icon name={guide.icon} size="inline" />
                  {guide.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <span>一个应用，四个模块指南。</span>
        <a href="https://github.com/miaixzo/miaixz.js">GitHub</a>
      </footer>
      <Appearance scope="entry" draggable={false} />
    </div>
  );
}
