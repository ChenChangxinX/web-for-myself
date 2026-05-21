import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "书评分享平台 | 社交互动", description: "书评发布和书单推荐。" };
export default function Page() { return <SocialToolStudio toolId="book-review" />; }