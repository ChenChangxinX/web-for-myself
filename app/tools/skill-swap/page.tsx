import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "技能交换平台 | 社交互动", description: "技能发布与匹配。" };
export default function Page() { return <SocialToolStudio toolId="skill-swap" />; }