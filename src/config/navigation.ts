import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileDown,
  FileText,
  FolderHeart,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  MonitorCheck,
  NotebookPen,
  Package,
  Palette,
  Settings,
  Shapes,
  School,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/database";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** False until the feature's phase ships; rendered as "Segera" and not clickable. */
  ready: boolean;
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

const dashboard: NavItem = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ready: true };

const teacherNav: NavGroup[] = [
  { label: null, items: [dashboard] },
  {
    label: "Pembelajaran",
    items: [
      { label: "Kalender", href: "/pembelajaran/kalender", icon: CalendarDays, ready: false },
      { label: "Tema", href: "/pembelajaran/tema", icon: Palette, ready: false },
      { label: "Buku", href: "/pembelajaran/buku", icon: BookOpen, ready: false },
      { label: "Aktivitas", href: "/pembelajaran/aktivitas", icon: Shapes, ready: false },
      { label: "RPPH", href: "/pembelajaran/rpph", icon: FileText, ready: false },
      { label: "LKPD", href: "/pembelajaran/lkpd", icon: ListChecks, ready: false },
    ],
  },
  {
    label: "Anak",
    items: [
      { label: "Daftar Siswa", href: "/anak/siswa", icon: Users, ready: false },
      { label: "Asesmen", href: "/anak/asesmen", icon: ClipboardCheck, ready: false },
      { label: "Anekdot", href: "/anak/anekdot", icon: NotebookPen, ready: false },
      { label: "Portofolio", href: "/anak/portofolio", icon: FolderHeart, ready: false },
    ],
  },
  {
    label: "Laporan",
    items: [
      { label: "Perkembangan", href: "/laporan/perkembangan", icon: BarChart3, ready: false },
      { label: "Rapor", href: "/laporan/rapor", icon: GraduationCap, ready: false },
      { label: "Export", href: "/laporan/export", icon: FileDown, ready: false },
    ],
  },
  { label: null, items: [{ label: "Profil", href: "/profil", icon: UserRound, ready: false }] },
];

const schoolAdminNav: NavGroup[] = [
  { label: null, items: [dashboard] },
  {
    label: "Sekolah",
    items: [
      { label: "Profil Sekolah", href: "/sekolah", icon: School, ready: false },
      { label: "Guru", href: "/sekolah/guru", icon: UserRound, ready: false },
      { label: "Siswa", href: "/sekolah/siswa", icon: Users, ready: false },
      { label: "Kelas", href: "/sekolah/kelas", icon: Layers, ready: false },
      { label: "Kurikulum", href: "/sekolah/kurikulum", icon: Palette, ready: false },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Pembelajaran", href: "/monitoring/pembelajaran", icon: MonitorCheck, ready: false },
      { label: "Asesmen", href: "/monitoring/asesmen", icon: ClipboardCheck, ready: false },
      { label: "Laporan", href: "/monitoring/laporan", icon: BarChart3, ready: false },
    ],
  },
  { label: null, items: [{ label: "Pengaturan", href: "/pengaturan", icon: Settings, ready: false }] },
];

const superAdminNav: NavGroup[] = [
  { label: null, items: [dashboard] },
  {
    label: "Platform",
    items: [
      { label: "Sekolah", href: "/admin/sekolah", icon: Building2, ready: false },
      { label: "Pengguna", href: "/admin/pengguna", icon: Users, ready: false },
    ],
  },
  {
    label: "Konten",
    items: [
      { label: "Tema", href: "/admin/tema", icon: Palette, ready: false },
      { label: "Buku", href: "/admin/buku", icon: BookOpen, ready: false },
      { label: "Aktivitas", href: "/admin/aktivitas", icon: Shapes, ready: false },
      { label: "LKPD", href: "/admin/lkpd", icon: ListChecks, ready: false },
      { label: "Bank Asesmen", href: "/admin/bank-asesmen", icon: ClipboardCheck, ready: false },
      { label: "Content Pack", href: "/admin/content-pack", icon: Package, ready: false },
      { label: "Pustaka Media", href: "/admin/media", icon: Library, ready: false },
    ],
  },
  { label: null, items: [{ label: "Pengaturan Sistem", href: "/admin/pengaturan", icon: Settings, ready: false }] },
];

export const NAVIGATION: Record<UserRole, NavGroup[]> = {
  teacher: teacherNav,
  school_admin: schoolAdminNav,
  super_admin: superAdminNav,
};

/**
 * Mobile bottom bar: the actions a role needs most often (max 4 + "Menu").
 * For teachers this follows the mobile-first priority list in the spec.
 */
export const MOBILE_PRIMARY: Record<UserRole, string[]> = {
  teacher: ["/dashboard", "/pembelajaran/rpph", "/pembelajaran/aktivitas", "/anak/asesmen"],
  school_admin: ["/dashboard", "/sekolah/guru", "/sekolah/siswa", "/monitoring/pembelajaran"],
  super_admin: ["/dashboard", "/admin/sekolah", "/admin/tema", "/admin/aktivitas"],
};

export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}

function matches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The most specific nav href matching the current path (so "/sekolah/guru" doesn't also light up "/sekolah"). */
export function findActiveHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null;
  for (const { href } of items) {
    if (matches(pathname, href) && (!best || href.length > best.length)) best = href;
  }
  return best;
}
