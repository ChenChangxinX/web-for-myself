import type { Metadata } from "next";
import { RandomNameGeneratorTool } from "./random-name-generator-tool";

export const metadata: Metadata = {
  title: "随机名字生成器 | 个人工具",
  description: "生成人名、公司名、产品名，支持关键词增强与域名可用性模拟。",
};

export default function RandomNameGeneratorPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-fuchsia-700">
          NAME GENERATOR
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">随机名字生成器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          支持人名、公司名、产品名多风格生成，并可附带域名可用性模拟结果，便于快速命名。
        </p>
      </section>

      <RandomNameGeneratorTool />
    </div>
  );
}
