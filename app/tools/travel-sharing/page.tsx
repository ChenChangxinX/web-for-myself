import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "旅行分享平台 | 社交互动", description: "旅行游记与路线分享。" };
export default function Page() { return <SocialToolStudio toolId="travel-sharing" />; }