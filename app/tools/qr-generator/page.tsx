import type { Metadata } from "next";
import { QrGeneratorTool } from "./qr-generator-tool";

export const metadata: Metadata = {
  title: "二维码生成器 | 个人工具",
  description: "生成与扫描二维码，支持自定义样式、Logo 和批量生成。",
};

export default function QrGeneratorPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-fuchsia-700">QR TOOL</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">二维码生成器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">输入文本或链接生成二维码，支持大小、颜色、Logo，自带摄像头扫码和批量生成。</p>
      </section>
      <QrGeneratorTool />
    </div>
  );
}
