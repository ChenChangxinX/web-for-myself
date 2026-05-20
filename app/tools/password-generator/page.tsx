import type { Metadata } from "next";
import { PasswordGeneratorTool } from "./password-generator-tool";

export const metadata: Metadata = {
  title: "密码生成器 | 个人工具",
  description: "生成强密码，支持长度、字符类型、强度检测和历史记录。",
};

export default function PasswordGeneratorPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700">
          SECURITY TOOL
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          密码生成器
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          生成符合你要求的强密码，支持长度、大小写字母、数字和符号组合，并自动保存生成历史。
        </p>
      </section>

      <PasswordGeneratorTool />
    </div>
  );
}
