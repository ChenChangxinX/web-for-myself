import type { Metadata } from "next";
import { TeamWhiteboardTool } from "./team-whiteboard-tool";

export const metadata: Metadata = {
  title: "团队协作和白板 | 工作效率",
  description: "白板绘制、便签协作、模板库与讨论过程回放。",
};

export default function TeamWhiteboardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">团队协作和白板</h1>
        <p className="mt-4 max-w-3xl text-slate-600">在线绘制、贴便签和快速套用模板，支持操作回放复盘讨论过程。</p>
      </section>
      <TeamWhiteboardTool />
    </div>
  );
}
