import type { Metadata } from "next";
import { MarkdownToHtmlTool } from "./markdown-to-html-tool";

export const metadata: Metadata = {
  title: "Markdown 转 HTML | 个人工具",
  description: "Markdown 实时转 HTML，支持预览、代码高亮、主题和导出。",
};

export default function MarkdownToHtmlPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-teal-700">MARKDOWN TOOL</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Markdown 转 HTML</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">实时把 Markdown 转成 HTML，支持代码高亮、主题样式和 HTML/Word/PDF 导出。</p>
      </section>
      <MarkdownToHtmlTool />
    </div>
  );
}
