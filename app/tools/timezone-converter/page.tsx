import type { Metadata } from "next";
import { TimezoneConverterTool } from "./timezone-converter-tool";

export const metadata: Metadata = {
  title: "时区转换器 | 个人工具",
  description: "支持多时区时间换算与会议时段建议。",
};

export default function TimezoneConverterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-700">
          TIMEZONE CONVERTER
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">时区转换器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          统一输入一个时间，快速查看多个城市对应时间，并给出适合跨时区协作的会议时段建议。
        </p>
      </section>

      <TimezoneConverterTool />
    </div>
  );
}
