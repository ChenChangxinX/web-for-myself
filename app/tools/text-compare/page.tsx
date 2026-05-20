import type { Metadata } from "next";
import { TextCompareTool } from "./text-compare-tool";

export const metadata: Metadata = {
  title: "文本对比 | 个人工具",
  description: "比较两段文本的差异，支持行对比、字符对比、忽略空格、忽略大小写和文件上传。",
};

export default function TextComparePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-violet-700">
          DIFF TOOL
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          文本对比
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          比较两段文本差异，支持行对比与字符对比，可忽略空格或大小写，并支持通过文件上传直接对比。
        </p>
      </section>

      <TextCompareTool />
    </div>
  );
}
