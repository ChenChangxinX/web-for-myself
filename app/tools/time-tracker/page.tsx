import type { Metadata } from "next";
import { TimeTrackerTool } from "./time-tracker-tool";

export const metadata: Metadata = {
  title: "时间追踪工具 | 工作效率",
  description: "记录任务时长，生成日报、周报和月报趋势，支持浏览器自动追踪。",
};

export default function TimeTrackerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-700">TIME TRACKER</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">时间追踪工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">记录每天在不同任务上的投入时间，自动汇总日报、周报和月报趋势，帮助优化时间分配。</p>
      </section>
      <TimeTrackerTool />
    </div>
  );
}
