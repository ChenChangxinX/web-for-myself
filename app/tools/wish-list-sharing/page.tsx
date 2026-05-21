import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "愿望清单分享 | 社交互动", description: "愿望记录和进度追踪。" };
export default function Page() { return <SocialToolStudio toolId="wish-list-sharing" />; }