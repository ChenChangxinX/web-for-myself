import type { Metadata } from "next";
import { CrmMiniTool } from "./crm-mini-tool";

export const metadata: Metadata = {
  title: "CRM Mini 版 | 工作效率",
  description: "客户信息、沟通记录、跟进提醒和销售漏斗管理。",
};

export default function CrmMiniPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">客户关系管理（CRM Mini 版）</h1>
        <p className="mt-4 max-w-3xl text-slate-600">管理客户、跟进和成交进展，自动汇总漏斗和客户价值数据。</p>
      </section>
      <CrmMiniTool />
    </div>
  );
}
