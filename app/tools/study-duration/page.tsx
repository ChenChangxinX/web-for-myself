import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "学习时长统计 | 学习教育", description: "学习时长趋势分析。" };
export default function Page() { return <LearningToolStudio toolId="study-duration" />; }