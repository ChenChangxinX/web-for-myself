import type { Metadata } from "next";
import { PomodoroProTool } from "./pomodoro-pro-tool";

export const metadata: Metadata = {
  title: "番茄工作法计时器（进阶） | 工作效率",
  description: "支持任务记录、25/5循环、每日统计与日历视图的进阶番茄钟工具。",
};

export default function PomodoroProPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-red-700">POMODORO PRO</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">番茄工作法计时器（进阶）</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">25 分钟专注 + 5 分钟休息循环，支持任务记录、每日报告和按日期查看专注数据。</p>
      </section>
      <PomodoroProTool />
    </div>
  );
}
