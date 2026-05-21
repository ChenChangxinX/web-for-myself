import type { Metadata } from "next";
import { LearningToolStudio } from "@/features/learning-tools/components/learning-tool-studio";
export const metadata: Metadata = { title: "课程表管理 | 学习教育", description: "课程和作业提醒。" };
export default function Page() { return <LearningToolStudio toolId="course-schedule" />; }