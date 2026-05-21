import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "学习小组管理 | 学习教育", description: "学习小组任务与打卡。" };
export default function Page() { return <LearningToolStudio toolId="study-group" />; }