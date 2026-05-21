import type { Metadata } from "next";
import { UrlShortenerTool } from "./url-shortener-tool";

export const metadata: Metadata = {
  title: "网址缩短工具 | 个人工具",
  description: "生成短码、统计点击次数，并支持二维码生成。",
};

export default function UrlShortenerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-teal-700">
          URL SHORTENER
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">网址缩短工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          生成可自定义短码，支持本地点击统计和二维码分享。短码记录保存在本地浏览器中。
        </p>
      </section>

      <UrlShortenerTool />
    </div>
  );
}
