import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "电影评论平台 | 社交互动", description: "影评和影单管理。" };
export default function Page() { return <SocialToolStudio toolId="movie-review" />; }