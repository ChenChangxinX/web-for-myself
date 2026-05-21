import type { Metadata } from "next";
import { ProjectBoardTool } from "./project-board-tool";

export const metadata: Metadata = {
  title: "项目进度看板 | 工作效率",
  description: "Trello 风格任务看板，支持拖拽、标签、截止日期与依赖管理。",
};

export default function ProjectBoardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-700">PROJECT BOARD</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">项目进度看板</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">拖拽管理任务状态，支持标签、截止日期、优先级和任务依赖关系。</p>
      </section>
      <ProjectBoardTool />
    </div>
  );
}
