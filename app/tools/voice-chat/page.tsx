import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "语音聊天室 | 社交互动", description: "语音房间和话题讨论。" };
export default function Page() { return <SocialToolStudio toolId="voice-chat" />; }