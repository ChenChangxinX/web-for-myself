import type { Metadata } from "next";
import { ColorPickerTool } from "./color-picker-tool";

export const metadata: Metadata = {
  title: "颜色选择器 | 个人工具",
  description: "选择颜色并获取 HEX、RGB、HSL 代码，支持调色板保存、配色推荐和图片取色。",
};

export default function ColorPickerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
          COLOR TOOL
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">颜色选择器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          选取颜色后自动生成 HEX、RGB、HSL 代码，支持保存常用调色板、智能配色推荐，并可从图片中提取主色。
        </p>
      </section>

      <ColorPickerTool />
    </div>
  );
}
