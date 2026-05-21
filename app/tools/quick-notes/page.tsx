import type { Metadata } from "next";
import { QuickNotesTool } from "./quick-notes-tool";

export const metadata: Metadata = {
  title: "快速笔记工具 | 工作效率",
  description: "快速记录 Markdown 笔记，支持标签搜索、导出和双链知识关联。",
};

export default function QuickNotesPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-lime-700">QUICK NOTES</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">快速笔记工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">支持 Markdown、标签和搜索，内置导出与双链关联，打开即写，适合快速捕捉想法。</p>
      </section>
      <QuickNotesTool />
    </div>
  );
}
