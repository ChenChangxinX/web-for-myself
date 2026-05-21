import type { Metadata } from "next";
import { ScheduleAssistantTool } from "./schedule-assistant-tool";

export const metadata: Metadata = {
  title: "日程安排助手 | 工作效率",
  description: "日历视图、提醒与重复事件，结合天气交通信息给出出行建议。",
};

export default function ScheduleAssistantPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-700">SCHEDULE ASSISTANT</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">日程安排助手</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">管理每日事件，支持日历视图、重复提醒与智能建议，并结合天气交通信息优化出行安排。</p>
      </section>
      <ScheduleAssistantTool />
    </div>
  );
}
