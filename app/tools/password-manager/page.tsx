import type { Metadata } from "next";
import { PasswordManagerTool } from "./password-manager-tool";

export const metadata: Metadata = {
  title: "密码管理器 | 工作效率",
  description: "本地加密保存密码，支持分类搜索、强度检测、生成器和安全分享。",
};

export default function PasswordManagerPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">密码管理器</h1>
        <p className="mt-4 max-w-3xl text-slate-600">安全存储账号密码，支持分类搜索、强度检测、随机密码生成和安全分享。</p>
      </section>
      <PasswordManagerTool />
    </div>
  );
}
