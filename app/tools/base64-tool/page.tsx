import type { Metadata } from "next";
import { Base64Tool } from "./base64-tool";

export const metadata: Metadata = {
  title: "Base64 编解码工具 | 个人工具",
  description: "支持文本和图片 Base64 编解码、图片在线预览、批量文件编码，以及 URL/Unicode 编解码。",
};

export default function Base64ToolPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-rose-700">
          ENCODE TOOL
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Base64 编解码工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          文本与图片的 Base64 编码解码，支持在线预览和批量处理，同时提供 URL/Unicode 编解码扩展，方便 API 与数据调试。
        </p>
      </section>

      <Base64Tool />
    </div>
  );
}
