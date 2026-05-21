import type { Metadata } from "next";
import { ClipboardHistoryTool } from "./clipboard-history-tool";

export const metadata: Metadata = {
  title: "剪贴板历史管理 | 工作效率",
  description: "记录剪贴板历史，支持快速查找、收藏和格式化粘贴。",
};

export default function ClipboardHistoryPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">剪贴板历史管理</h1>
        <p className="mt-4 max-w-3xl text-slate-600">保留常用复制内容，支持搜索、收藏和格式化后再复制。</p>
      </section>
      <ClipboardHistoryTool />
    </div>
  );
}
