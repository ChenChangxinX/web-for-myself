import type { Metadata } from "next";
import { WordCounterTool } from "./word-counter-tool";

export const metadata: Metadata = {
  title: "字数统计工具 | 个人工具",
  description: "统计字数、词数、段落、句子、阅读时间，并分析高频关键词。",
};

export default function WordCounterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-orange-700">
          WORD COUNTER
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">字数统计工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          支持中英文统计，包含字数、词数、段落数、句子数、阅读时长估算和关键词频率分析。
        </p>
      </section>

      <WordCounterTool />
    </div>
  );
}
