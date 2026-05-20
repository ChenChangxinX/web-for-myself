import type { Metadata } from "next";
import { RandomDecisionTool } from "./random-decision-tool";

export const metadata: Metadata = {
  title: "随机决策器 | 个人工具",
  description: "输入选项并随机决策，支持权重配置和历史记录。",
};

export default function RandomDecisionPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700">DECISION TOOL</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">随机决策器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">输入多个选项随机抽取，支持权重概率与历史结果记录，帮你快速做决定。</p>
      </section>
      <RandomDecisionTool />
    </div>
  );
}
