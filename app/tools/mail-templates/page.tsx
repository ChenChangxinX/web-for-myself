import type { Metadata } from "next";
import { MailTemplatesTool } from "./mail-templates-tool";

export const metadata: Metadata = {
  title: "邮件模板管理 | 工作效率",
  description: "保存常用邮件模板，支持变量替换、智能变量和团队模板共享。",
};

export default function MailTemplatesPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-orange-700">MAIL TEMPLATES</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">邮件模板管理</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">沉淀常用邮件模板，一键变量替换生成正文，支持智能默认变量与团队模板导入导出。</p>
      </section>
      <MailTemplatesTool />
    </div>
  );
}
