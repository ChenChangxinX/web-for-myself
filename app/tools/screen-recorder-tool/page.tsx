import type { Metadata } from "next";
import { ScreenRecorderTool } from "./screen-recorder-tool";

export const metadata: Metadata = {
  title: "屏幕录制工具 | 个人工具",
  description: "录制屏幕并导出 WebM 视频，支持麦克风采集和摄像头预览。",
};

export default function ScreenRecorderPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-rose-700">
          SCREEN RECORDER
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">屏幕录制工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          支持屏幕录制、麦克风音频采集和摄像头预览，录制完成后可直接下载为 WebM。后续可扩展标注和剪辑能力。
        </p>
      </section>

      <ScreenRecorderTool />
    </div>
  );
}
