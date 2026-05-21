import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "数学练习题生成器 | 学习教育", description: "随机数学题与即时批改。" };
export default function Page() { return <LearningToolStudio toolId="math-generator" />; }