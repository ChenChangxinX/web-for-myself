import type { Metadata } from "next";
import { CountdownTool } from "./countdown-tool";

export const metadata: Metadata = {
  title: "倒计时工具 | 个人工具",
  description: "支持多个倒计时/正计时，带提醒功能的重要日期管理工具。",
};

export default function CountdownPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-blue-700">COUNTDOWN</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">倒计时工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">设置考试、生日、纪念日等目标日期，支持多个倒计时和正计时，并提供到期前提醒。</p>
      </section>
      <CountdownTool />
    </div>
  );
}
