import type { SiteGroup } from "@/types/site";
import { SiteCard } from "./site-card";

interface SiteGridProps {
  groups: SiteGroup[];
}

export function SiteGrid({ groups }: SiteGridProps) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.id} className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{group.name}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {group.sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
