import type { Metadata } from "next";
import { MeetingNotesTool } from "./meeting-notes-tool";

export const metadata: Metadata = {
  title: "会议记录工具 | 工作效率",
  description: "会议记录、录音文本、待办提取与纪要生成的轻量会议助手。",
};

export default function MeetingNotesPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-700">MEETING NOTES</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">会议记录工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">记录会议内容，提取待办事项，自动生成简要纪要，并支持浏览器语音转写。</p>
      </section>
      <MeetingNotesTool />
    </div>
  );
}
