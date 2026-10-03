"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { findActiveHref, flattenNav, MOBILE_PRIMARY, NAVIGATION } from "@/config/navigation";
import type { UserRole } from "@/types/database";
import { NavList } from "@/components/layout/nav-list";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom bar (most-used actions) + "Menu" drawer with the full
 * navigation. Uses the native <dialog> element for focus trapping & Esc.
 */
export function MobileNavigation({ role, footer }: { role: UserRole; footer: ReactNode }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const all = flattenNav(NAVIGATION[role]);
  const primary = MOBILE_PRIMARY[role].flatMap((href) => all.filter((item) => item.href === href));
  const activeHref = findActiveHref(pathname, all);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <nav
        aria-label="Navigasi cepat"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {primary.map(({ href, label, icon: Icon, ready }) => {
            const active = href === activeHref;
            const classes = cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
              active ? "text-brand-700" : "text-ink-muted",
              !ready && "opacity-50",
            );
            const content = (
              <>
                <span className={cn("grid h-7 w-12 place-items-center rounded-full", active && "bg-brand-50")}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="max-w-full truncate px-1">{label}</span>
              </>
            );
            return (
              <li key={href}>
                {ready ? (
                  <Link href={href} aria-current={active ? "page" : undefined} className={classes}>
                    {content}
                  </Link>
                ) : (
                  <span aria-disabled="true" title={`${label} — segera hadir`} className={classes}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              className="flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink-muted"
            >
              <span className="grid h-7 w-12 place-items-center rounded-full">
                <Menu aria-hidden className="size-5" />
              </span>
              Menu
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none bg-surface p-0 text-ink backdrop:bg-ink/30 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-bold">Menu</p>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup menu"
              className="grid size-11 place-items-center rounded-xl hover:bg-canvas"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavList role={role} onNavigate={close} />
          </div>
          <div className="border-t border-line p-3">{footer}</div>
        </div>
      </dialog>
    </>
  );
}
