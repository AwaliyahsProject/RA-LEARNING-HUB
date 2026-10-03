import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RA Learning Hub",
    template: "%s · RA Learning Hub",
  },
  description: "Administrasi • Pembelajaran • Buku Tema • Asesmen untuk Raudhatul Athfal",
};

export const viewport: Viewport = {
  themeColor: "#2f7566",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
