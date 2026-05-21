import type { Metadata } from "next";
import { SocialToolStudio } from "@/features/social-tools/components/social-tool-studio";
export const metadata: Metadata = { title: "在线协作文档 | 社交互动", description: "多人编辑、评论和版本。" };
export default function Page() { return <SocialToolStudio toolId="collab-docs" />; }