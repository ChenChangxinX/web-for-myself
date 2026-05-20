import Link from "next/link";
import { moduleList } from "@/lib/modules";

export default function Home() {
  const activeModules = moduleList.filter((item) => item.status === "active").length;

  return (
    <div className="space-y-10">
      <section className="hero-panel rounded-3xl border border-black/10 p-8 shadow-sm md:p-10">
        <p className="mb-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-700">
          CURATED HUB
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          你的可扩展网站大全
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          先从个人工具做一个小而强的版本，再逐步扩展到工作效率、娱乐创意、学习教育和社交互动模块。
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/category/personal-tools"
            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            进入个人工具
          </Link>
          <span className="inline-flex items-center rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm text-slate-700">
            已上线模块 {activeModules} / {moduleList.length}
          </span>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">模块导航</h2>
          <p className="text-sm text-slate-500">点击卡片可进入模块页面</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {moduleList.map((module, index) => (
            <article
              key={module.slug}
              className="module-card card-appear rounded-2xl border border-black/10 bg-white/92 p-5 shadow-sm"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{module.name}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    module.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {module.status === "active" ? "已上线" : "即将上线"}
                </span>
              </div>

              <p className="mb-4 text-sm leading-6 text-slate-600">{module.summary}</p>

              <Link
                href={`/category/${module.slug}`}
                className="inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800"
              >
                查看模块
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
