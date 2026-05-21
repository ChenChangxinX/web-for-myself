import type { Metadata } from "next";
import { ShortcutCheatsheetTool } from "./shortcut-cheatsheet-tool";

export const metadata: Metadata = {
  title: "快捷键查询工具 | 个人工具",
  description: "按软件与分类查询快捷键，支持自定义快捷键和练习模式。",
};

export default function ShortcutCheatsheetPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700">
          SHORTCUT CHEATSHEET
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">快捷键查询工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          按应用和关键词快速检索快捷键，支持保存个人常用组合，并提供小练习模式帮助记忆。
        </p>
      </section>

      <ShortcutCheatsheetTool />
    </div>
  );
}
