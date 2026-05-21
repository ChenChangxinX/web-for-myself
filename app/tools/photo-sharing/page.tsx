import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "照片分享平台 | 社交互动", description: "照片发布和互动。" };
export default function Page() { return <SocialToolStudio toolId="photo-sharing" />; }