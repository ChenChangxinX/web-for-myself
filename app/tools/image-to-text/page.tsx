import type { Metadata } from "next";
import { OcrTool } from "./ocr-tool";

export const metadata: Metadata = {
  title: "图片转文字 | 个人工具",
  description: "在浏览器中上传或粘贴图片，识别其中的文字并复制到剪贴板。",
};

export default function ImageToTextPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-700">
          OCR TOOL
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          图片转文字
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          直接上传本地图片，或把截图粘贴到页面里，识别完成后可一键复制文本结果。
        </p>
      </section>

      <OcrTool />
    </div>
  );
}
