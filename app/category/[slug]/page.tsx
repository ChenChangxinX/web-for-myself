import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteGrid } from "@/features/site-directory/components/site-grid";
import { moduleList, modulesBySlug } from "@/lib/modules";
import { getSiteModuleData } from "@/lib/site-data";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return moduleList.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const moduleMeta = modulesBySlug[slug];

  if (!moduleMeta) {
    return {
      title: "模块未找到",
    };
  }

  return {
    title: `${moduleMeta.name} | 网站大全`,
    description: moduleMeta.summary,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const moduleMeta = modulesBySlug[slug];

  if (!moduleMeta) {
    notFound();
  }

  if (moduleMeta.status === "planned") {
    return (
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{moduleMeta.name}</h1>
        <p className="mt-3 text-slate-600">{moduleMeta.summary}</p>
        <p className="mt-6 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          即将上线
        </p>
      </section>
    );
  }

  const moduleData = getSiteModuleData(slug);
  if (!moduleData) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
        该模块数据暂不可用，请检查数据格式后重试。
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{moduleData.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{moduleData.description}</p>
      </section>

      {slug === "personal-tools" ? (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">目录</p>
              <ul className="mt-3 space-y-2">
                {moduleData.groups.map((group) => (
                  <li key={group.id}>
                    <a
                      href={`#group-${group.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <span>{group.name}</span>
                      <span className="text-xs text-slate-400">{group.sites.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <SiteGrid groups={moduleData.groups} sectionIdPrefix="group" />
        </div>
      ) : (
        <SiteGrid groups={moduleData.groups} />
      )}
    </div>
  );
}
