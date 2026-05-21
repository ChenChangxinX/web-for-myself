import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "短视频分享平台 | 社交互动", description: "短视频发布和话题。" };
export default function Page() { return <SocialToolStudio toolId="short-video" />; }