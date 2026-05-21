import type { Metadata } from "next";
import { ContractSystemTool } from "./contract-system-tool";

export const metadata: Metadata = {
  title: "合同管理系统 | 工作效率",
  description: "管理合同签约和到期提醒，支持模板和电子签名记录。",
};

export default function ContractSystemPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">合同管理系统</h1>
        <p className="mt-4 max-w-3xl text-slate-600">跟踪合同状态和到期提醒，支持快速套用模板并保留签名记录。</p>
      </section>
      <ContractSystemTool />
    </div>
  );
}
