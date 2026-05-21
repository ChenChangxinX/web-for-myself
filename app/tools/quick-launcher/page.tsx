import type { Metadata } from "next";
import { QuickLauncherTool } from "./quick-launcher-tool";

export const metadata: Metadata = {
  title: "快捷启动器 | 工作效率",
  description: "快速搜索和启动常用网站，支持快捷键别名和工作空间。",
};

export default function QuickLauncherPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">快捷启动器</h1>
        <p className="mt-4 max-w-3xl text-slate-600">集中管理常用应用和网站，支持搜索、自定义快捷键和工作空间一键启动。</p>
      </section>
      <QuickLauncherTool />
    </div>
  );
}
