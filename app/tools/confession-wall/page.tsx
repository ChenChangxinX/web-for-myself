import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "表白墙 | 社交互动", description: "匿名表白发布与回应。" };
export default function Page() { return <SocialToolStudio toolId="confession-wall" />; }