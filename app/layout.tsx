import type { Metadata } from "next";
import { Manrope, Noto_Sans_SC } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Web for myself | 网站大全",
  description: "一个可扩展的网站导航，首版聚焦个人工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${manrope.variable} ${notoSansSc.variable}`}>
      <body className="min-h-screen bg-cream text-slate-900">
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="aurora-bg" />
          <div className="relative z-10 flex min-h-screen flex-col">
            <SiteHeader />
            <main className="site-shell flex-1 py-2 pb-12">{children}</main>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
