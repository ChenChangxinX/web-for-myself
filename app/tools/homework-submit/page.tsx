import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "作业提交系统 | 学习教育", description: "作业上传和批改追踪。" };
export default function Page() { return <LearningToolStudio toolId="homework-submit" />; }