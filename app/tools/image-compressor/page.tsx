import type { Metadata } from "next";
import { ImageCompressorTool } from "./image-compressor-tool";

export const metadata: Metadata = {
  title: "图片压缩工具 | 个人工具",
  description: "批量压缩图片并支持格式转换、裁剪和旋转。",
};

export default function ImageCompressorPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-orange-700">IMAGE COMPRESS</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">图片压缩工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">支持批量压缩、质量调节、格式转换，并提供基础裁剪和旋转功能。</p>
      </section>
      <ImageCompressorTool />
    </div>
  );
}
