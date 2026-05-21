import type { Metadata } from "next";
import { FileOrganizerTool } from "./file-organizer-tool";

export const metadata: Metadata = {
  title: "文件整理工具 | 工作效率",
  description: "按类型和日期整理文件，支持自定义规则、智能分类和重复检测。",
};

export default function FileOrganizerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">文件整理工具</h1>
        <p className="mt-4 max-w-3xl text-slate-600">上传文件后自动按类型、日期和规则分组，并提供重复文件检测结果。</p>
      </section>
      <FileOrganizerTool />
    </div>
  );
}
