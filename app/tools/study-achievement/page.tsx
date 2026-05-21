import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "学习成就系统 | 学习教育", description: "勋章积分和学习里程碑。" };
export default function Page() { return <LearningToolStudio toolId="study-achievement" />; }