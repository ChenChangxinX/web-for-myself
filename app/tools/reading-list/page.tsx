import type { Metadata } from "next";
import { ReadingListTool } from "./reading-list-tool";

export const metadata: Metadata = {
  title: "阅读列表管理 | 工作效率",
  description: "保存待读文章与书籍，支持阅读状态、标签、笔记、阅读时间估算和网页剪藏。",
};

export default function ReadingListPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">READING LIST</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">阅读列表管理</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">管理书籍与文章阅读进度，记录标签和笔记，自动估算阅读时长，并支持网页剪藏。</p>
      </section>
      <ReadingListTool />
    </div>
  );
}
