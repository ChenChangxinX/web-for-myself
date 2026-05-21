import type { Metadata } from "next";
import { FocusModeTool } from "./focus-mode-tool";

export const metadata: Metadata = {
  title: "专注模式工具 | 工作效率",
  description: "屏蔽干扰网站，支持黑白名单与番茄钟联动，并统计被拦截次数。",
};

export default function FocusModePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-700">FOCUS MODE</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">专注模式工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">管理黑白名单网站规则，结合番茄钟自动进入专注状态，减少分心并量化拦截效果。</p>
      </section>
      <FocusModeTool />
    </div>
  );
}
