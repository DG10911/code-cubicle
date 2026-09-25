"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Database, FlaskConical, ArrowLeftRight } from "lucide-react";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

/**
 * Shared application shell used by both products. Left rail carries the product
 * identity + navigation; the top bar carries context and a persistent
 * fixture-data indicator (we never hide that the demo runs on seeded data).
 */
export function AppShell({
  product,
  nav,
  title,
  right,
  children,
}: {
  product: "orchestra" | "impactos";
  nav: NavItem[];
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const other = product === "orchestra" ? "impactos" : "orchestra";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-base-50/80 backdrop-blur">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg text-base-0",
              product === "orchestra" ? "bg-signal" : "bg-impact",
            )}
          >
            {product === "orchestra" ? <Database size={16} /> : <FlaskConical size={16} />}
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{product === "orchestra" ? "ORCHESTRA" : "IMPACTOS"}</div>
            <div className="text-2xs text-ink-faint">{product === "orchestra" ? "Data Intelligence OS" : "Visual Evidence Intelligence"}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? cn("bg-base-200 text-ink", product === "orchestra" ? "text-signal" : "text-impact")
                    : "text-ink-muted hover:bg-base-100 hover:text-ink",
                )}
              >
                <span className={active ? (product === "orchestra" ? "text-signal" : "text-impact") : "text-ink-faint"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href={`/${other}`}
            className="flex items-center justify-between rounded-lg border border-line bg-base-100 px-3 py-2 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            <span>Switch to {other === "orchestra" ? "ORCHESTRA" : "IMPACTOS"}</span>
            <ArrowLeftRight size={13} />
          </Link>
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse-soft", product === "orchestra" ? "bg-signal" : "bg-impact")} />
            <span className="text-2xs text-ink-faint">Fixture dataset · deterministic</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-base-0/70 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xs text-ink-faint hover:text-ink-muted">
              Console
            </Link>
            <span className="text-ink-ghost">/</span>
            <h1 className="text-sm font-medium text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-3">{right}</div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
