import type { Metadata } from "next";
import { UnitConverterTool } from "./unit-converter-tool";

export const metadata: Metadata = {
  title: "单位转换器 | 个人工具",
  description: "长度、重量、温度、货币转换，支持汇率更新与自定义单位。",
};

export default function UnitConverterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">CONVERTER</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">单位转换器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">支持常见单位转换与货币汇率转换，可实时更新汇率并添加自定义单位。</p>
      </section>
      <UnitConverterTool />
    </div>
  );
}
