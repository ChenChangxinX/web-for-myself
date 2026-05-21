import type { Metadata } from "next";
import { IdeaBoxTool } from "./idea-box-tool";

export const metadata: Metadata = {
  title: "灵感收集箱 | 工作效率",
  description: "记录文字、图片和链接灵感，支持分类整理、AI 标签建议和灵感关联。",
};

export default function IdeaBoxPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-pink-700">IDEA BOX</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">灵感收集箱</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">随时记录好点子，支持图片和链接，结合 AI 整理标签并自动发现关联灵感。</p>
      </section>
      <IdeaBoxTool />
    </div>
  );
}
