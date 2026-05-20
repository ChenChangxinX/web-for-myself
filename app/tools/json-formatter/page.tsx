import type { Metadata } from "next";
import { JsonFormatterTool } from "./json-formatter-tool";

export const metadata: Metadata = {
  title: "JSON 格式化工具 | 个人工具",
  description: "格式化和验证 JSON，支持树形折叠、语法高亮、错误提示、JSONPath 查询以及 JSON 转 YAML/XML。",
};

export default function JsonFormatterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-700">
          JSON TOOL
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">JSON 格式化工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          快速格式化与校验 JSON，支持树形折叠查看、语法高亮、错误定位、JSONPath 查询，并可转换为 YAML 或 XML。
        </p>
      </section>

      <JsonFormatterTool />
    </div>
  );
}
