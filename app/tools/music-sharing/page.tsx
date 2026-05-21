import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "音乐分享平台 | 社交互动", description: "歌单推荐和评论。" };
export default function Page() { return <SocialToolStudio toolId="music-sharing" />; }