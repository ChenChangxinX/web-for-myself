import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "技能树可视化 | 学习教育", description: "路径解锁和进度成长。" };
export default function Page() { return <LearningToolStudio toolId="skill-tree" />; }