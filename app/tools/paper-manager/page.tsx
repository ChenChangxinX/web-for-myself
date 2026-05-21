import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "论文管理工具 | 学习教育", description: "文献和引用管理。" };
export default function Page() { return <LearningToolStudio toolId="paper-manager" />; }