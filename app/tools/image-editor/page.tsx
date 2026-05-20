import type { Metadata } from "next";
import { ImageEditorTool } from "./image-editor-tool";

export const metadata: Metadata = {
  title: "图片编辑器 | 个人工具",
  description: "上传图片读取时间和地理位置信息，手动编辑后写入图片并下载。",
};

export default function ImageEditorPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-700">
          IMAGE EDITOR
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">图片编辑器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          上传图片后自动读取拍摄时间与地理坐标，支持你手动编辑这些信息，并按字体、颜色、大小写入到图片中。
        </p>
      </section>

      <ImageEditorTool />
    </div>
  );
}
