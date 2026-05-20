import personalToolsData from "@/data/personal-tools.json";
import type { SiteGroup, SiteItem, SiteModuleData } from "@/types/site";

const moduleDatasetMap: Record<string, unknown> = {
  "personal-tools": personalToolsData,
};

function isValidHttpUrl(input: unknown): input is string {
  if (typeof input !== "string") {
    return false;
  }

  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSiteItem(value: unknown): value is SiteItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SiteItem>;
  const validStatus = candidate.status === "active" || candidate.status === "archived";

  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0 &&
    isValidHttpUrl(candidate.url) &&
    typeof candidate.description === "string" &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every((tag) => typeof tag === "string") &&
    validStatus
  );
}

function isSiteGroup(value: unknown): value is SiteGroup {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SiteGroup>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    Array.isArray(candidate.sites) &&
    candidate.sites.every((site) => isSiteItem(site))
  );
}

function isSiteModuleData(value: unknown): value is SiteModuleData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SiteModuleData>;
  return (
    typeof candidate.slug === "string" &&
    candidate.slug.length > 0 &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    Array.isArray(candidate.groups) &&
    candidate.groups.every((group) => isSiteGroup(group))
  );
}

export function getSiteModuleData(slug: string): SiteModuleData | null {
  const rawData = moduleDatasetMap[slug];
  if (!rawData) {
    return null;
  }

  if (!isSiteModuleData(rawData)) {
    console.warn(`Invalid module data shape for slug: ${slug}`);
    return null;
  }

  return rawData;
}
