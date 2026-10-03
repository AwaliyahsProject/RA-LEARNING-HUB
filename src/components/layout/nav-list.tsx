"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActiveHref, flattenNav, NAVIGATION } from "@/config/navigation";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

/**
 * Grouped navigation shared by the desktop sidebar and the mobile menu drawer.
 * Receives only the role (serialisable); icon components are resolved here on
 * the client because functions cannot cross the server → client boundary.
 */
export function NavList({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const groups = NAVIGATION[role];
  const pathname = usePathname();
  const activeHref = findActiveHref(pathname, flattenNav(groups));

  return (
    <nav aria-label="Navigasi utama" className="space-y-5">
      {groups.map((group, index) => (
        <div key={group.label ?? `group-${index}`}>
          {group.label ? (
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{group.label}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, ready }) => {
              const active = href === activeHref;
              const itemClass = cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                active ? "bg-brand-50 text-brand-700" : "text-ink",
              );
              return (
                <li key={href}>
                  {ready ? (
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(itemClass, !active && "hover:bg-canvas")}
                    >
                      <Icon aria-hidden className="size-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  ) : (
                    <span aria-disabled="true" className={cn(itemClass, "cursor-default text-ink-muted")}>
                      <Icon aria-hidden className="size-5 shrink-0 opacity-70" />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold">Segera</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
