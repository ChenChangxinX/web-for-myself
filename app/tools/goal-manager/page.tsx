import type { Metadata } from "next";
import { GoalManagerTool } from "./goal-manager-tool";

export const metadata: Metadata = {
  title: "目标管理工具 | 工作效率",
  description: "拆解长期/短期目标，支持任务分解、OKR 关键结果和达成报告。",
};

export default function GoalManagerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-violet-700">GOAL MANAGER</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">目标管理工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">将长期目标拆解成可执行事项，跟踪关键结果与完成进度，并生成达成报告复盘成长。</p>
      </section>
      <GoalManagerTool />
    </div>
  );
}
