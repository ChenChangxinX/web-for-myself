import type { Metadata } from "next";
import { RegexTesterTool } from "./regex-tester-tool";

export const metadata: Metadata = {
  title: "正则表达式测试器 | 个人工具",
  description: "实时测试正则、查看匹配结果，含模板、解释与生成器。",
};

export default function RegexTesterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-violet-700">REGEX TOOL</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">正则表达式测试器</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">实时显示匹配结果，内置常用模板，并提供正则自然语言解释与规则生成器。</p>
      </section>
      <RegexTesterTool />
    </div>
  );
}
