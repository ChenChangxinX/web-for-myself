import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-shell py-6">
      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/85 px-5 py-4 backdrop-blur-sm">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          站点大全
        </Link>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          MVP 进行中
        </span>
      </div>
    </header>
  );
}
