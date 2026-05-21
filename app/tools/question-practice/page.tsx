import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "在线题库练习 | 学习教育", description: "系统刷题和正确率统计。" };
export default function Page() { return <LearningToolStudio toolId="question-practice" />; }