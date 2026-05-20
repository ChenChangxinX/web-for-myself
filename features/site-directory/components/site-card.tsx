import Link from "next/link";
import type { SiteItem } from "@/types/site";

interface SiteCardProps {
  site: SiteItem;
}

export function SiteCard({ site }: SiteCardProps) {
  const isInternalHref = site.url.startsWith("/");

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">{site.name}</h3>
        {site.featured ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            推荐
          </span>
        ) : null}
      </div>

      <p className="mb-4 text-sm leading-6 text-slate-600">{site.description}</p>

      <ul className="mb-4 flex flex-wrap gap-2">
        {site.tags.map((tag) => (
          <li
            key={`${site.id}-${tag}`}
            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
          >
            {tag}
          </li>
        ))}
      </ul>

      {isInternalHref ? (
        <Link href={site.url} className="inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-800">
          打开工具
        </Link>
      ) : (
        <a
          href={site.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-800"
        >
          访问网站
        </a>
      )}
    </article>
  );
}

