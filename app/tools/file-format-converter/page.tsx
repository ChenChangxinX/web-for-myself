import type { Metadata } from "next";
import { FileFormatConverterTool } from "./file-format-converter-tool";

export const metadata: Metadata = {
  title: "文件格式转换 | 个人工具",
  description: "支持 JSON/YAML/CSV 文本互转，包含批量文本转换模式。",
};

export default function FileFormatConverterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-700">
          FORMAT CONVERTER
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">文件格式转换</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          先提供常用文本格式转换：JSON、YAML、CSV。支持单条转换与批量行转换，后续可继续扩展文件级转换能力。
        </p>
      </section>

      <FileFormatConverterTool />
    </div>
  );
}
