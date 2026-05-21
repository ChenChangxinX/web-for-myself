import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "每日一图分享 | 社交互动", description: "每日图片投稿和互动。" };
export default function Page() { return <SocialToolStudio toolId="daily-photo" />; }