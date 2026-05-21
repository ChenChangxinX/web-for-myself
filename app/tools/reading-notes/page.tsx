import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "读书笔记管理 | 学习教育", description: "阅读进度、摘抄和感想。" };
export default function Page() { return <LearningToolStudio toolId="reading-notes" />; }