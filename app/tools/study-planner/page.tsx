import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "学习计划制定工具 | 学习教育", description: "制定学习计划和任务分解。" };
export default function Page() { return <LearningToolStudio toolId="study-planner" />; }