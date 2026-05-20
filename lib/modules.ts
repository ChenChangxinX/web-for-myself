import type { ModuleMeta } from "@/types/site";

export const moduleList: ModuleMeta[] = [
  {
    slug: "personal-tools",
    name: "个人工具",
    summary: "聚合我常用的效率站点、在线工具和实用服务。",
    status: "active",
  },
  {
    slug: "work-productivity",
    name: "工作效率",
    summary: "任务管理、协作与流程自动化工具集合。",
    status: "planned",
  },
  {
    slug: "creative-fun",
    name: "娱乐创意",
    summary: "设计灵感、AI 创作和娱乐玩法资源库。",
    status: "planned",
  },
  {
    slug: "learning-education",
    name: "学习教育",
    summary: "课程、知识库、学习方法和练习平台。",
    status: "planned",
  },
  {
    slug: "social-interaction",
    name: "社交互动",
    summary: "社区交流、创作者平台与互动工具。",
    status: "planned",
  },
];

export const modulesBySlug = Object.fromEntries(
  moduleList.map((item) => [item.slug, item]),
);
