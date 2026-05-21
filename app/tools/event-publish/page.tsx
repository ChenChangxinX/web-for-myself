import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "活动发布平台 | 社交互动", description: "活动发布、报名和签到。" };
export default function Page() { return <SocialToolStudio toolId="event-publish" />; }