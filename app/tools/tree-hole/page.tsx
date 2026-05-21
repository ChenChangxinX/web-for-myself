import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "树洞倾诉平台 | 社交互动", description: "匿名倾诉与安慰互动。" };
export default function Page() { return <SocialToolStudio toolId="tree-hole" />; }