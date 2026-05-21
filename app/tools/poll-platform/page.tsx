import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "投票调查平台 | 社交互动", description: "在线投票与问卷统计。" };
export default function Page() { return <SocialToolStudio toolId="poll-platform" />; }