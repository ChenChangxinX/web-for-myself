import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "博客平台 | 社交互动", description: "博客发布和订阅。" };
export default function Page() { return <SocialToolStudio toolId="blog-platform" />; }