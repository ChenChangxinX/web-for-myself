import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "美食分享平台 | 社交互动", description: "美食打卡和推荐。" };
export default function Page() { return <SocialToolStudio toolId="food-sharing" />; }