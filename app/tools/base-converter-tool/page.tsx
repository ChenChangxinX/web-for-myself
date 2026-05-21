import type { Metadata } from "next";
import { BaseConverterTool } from "./base-converter-tool";

export const metadata: Metadata = {
  title: "进制转换器 | 个人工具",
  description: "支持二八十六进制互转、位运算和浮点二进制表示。",
};

export default function BaseConverterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-violet-700">
          BASE CONVERTER
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">进制转换器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          支持二进制、八进制、十进制、十六进制互相转换，附带位运算和浮点数二进制展示。
        </p>
      </section>

      <BaseConverterTool />
    </div>
  );
}
