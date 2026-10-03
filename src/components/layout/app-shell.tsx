import type { ReactNode } from "react";
import type { CurrentProfile } from "@/lib/auth/session";
import { Brand } from "@/components/layout/brand";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NavList } from "@/components/layout/nav-list";
import { UserPanel } from "@/components/layout/user-panel";

const PLATFORM_LABEL = "Platform Admin";

/** Authenticated application frame: sidebar on desktop, top bar + bottom nav on mobile. */
export function AppShell({ profile, children }: { profile: CurrentProfile; children: ReactNode }) {
  const context = profile.schoolName ?? PLATFORM_LABEL;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-5">
          <Brand subtitle={context} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavList role={profile.role} />
        </div>
        <div className="border-t border-line p-3">
          <UserPanel profile={profile} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <Brand subtitle={context} />
        </header>
        <main id="konten" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>

      <MobileNavigation role={profile.role} footer={<UserPanel profile={profile} />} />
    </div>
  );
}
