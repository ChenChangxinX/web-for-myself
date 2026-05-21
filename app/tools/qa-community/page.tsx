import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "问答社区（Mini 版） | 社交互动", description: "提问回答和采纳。" };
export default function Page() { return <SocialToolStudio toolId="qa-community" />; }