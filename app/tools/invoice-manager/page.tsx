import type { Metadata } from "next";
import { InvoiceManagerTool } from "./invoice-manager-tool";

export const metadata: Metadata = {
  title: "发票管理工具 | 工作效率",
  description: "录入发票并统计报销，支持 OCR 文本辅助识别。",
};

export default function InvoiceManagerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">发票管理工具</h1>
        <p className="mt-4 max-w-3xl text-slate-600">管理发票金额和分类，生成报销统计并导出报销单。</p>
      </section>
      <InvoiceManagerTool />
    </div>
  );
}
