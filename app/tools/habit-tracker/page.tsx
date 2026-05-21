import type { Metadata } from "next";
import { HabitTrackerTool } from "./habit-tracker-tool";

export const metadata: Metadata = {
  title: "习惯追踪器 | 工作效率",
  description: "多习惯打卡、趋势曲线、提醒与伙伴打卡，帮助建立长期习惯。",
};

export default function HabitTrackerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700">HABIT TRACKER</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">习惯追踪器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">追踪多个习惯完成情况，生成养成曲线，支持提醒与伙伴打卡监督。</p>
      </section>
      <HabitTrackerTool />
    </div>
  );
}
