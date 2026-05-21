import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "匿名聊天室 | 社交互动", description: "匿名聊天与话题匹配。" };
export default function Page() { return <SocialToolStudio toolId="anonymous-chat" />; }