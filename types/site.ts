export type ModuleStatus = "active" | "planned";

export interface ModuleMeta {
  slug: string;
  name: string;
  summary: string;
  status: ModuleStatus;
}

export interface SiteItem {
  id: string;
  name: string;
  url: string;
  description: string;
  tags: string[];
  icon?: string;
  featured?: boolean;
  status: "active" | "archived";
}

export interface SiteGroup {
  id: string;
  name: string;
  sites: SiteItem[];
}

export interface SiteModuleData {
  slug: string;
  title: string;
  description: string;
  groups: SiteGroup[];
}
