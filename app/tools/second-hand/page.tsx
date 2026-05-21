import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "二手交易平台 | 社交互动", description: "闲置发布和交流。" };
export default function Page() { return <SocialToolStudio toolId="second-hand" />; }