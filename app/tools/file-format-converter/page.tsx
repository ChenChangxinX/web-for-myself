import type { Metadata } from "next";
import { FileFormatConverterTool } from "./file-format-converter-tool";

export const metadata: Metadata = {
  title: "文件格式转换 | 个人工具",
  description: "支持 PDF 转图片、图片格式转换、视频转 WebM 以及批量处理与云端任务上传。",
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
          支持常见文件格式转换：PDF 转图片、图片格式互转、视频格式转换。提供批量处理能力，并支持将任务上传到云端转换服务处理大文件。
        </p>
      </section>

      <FileFormatConverterTool />
    </div>
  );
}
