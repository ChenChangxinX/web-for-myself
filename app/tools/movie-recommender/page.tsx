import type { Metadata } from "next";
import { FunToolStudio } from "@/features/creative-tools/components/fun-tool-studio";

export const metadata: Metadata = {
  title: "电影推荐工具 | 娱乐创意",
  description: "根据偏好生成电影推荐和收藏灵感。",
};

export default function MovieRecommenderPage() {
  return <FunToolStudio toolId="movie-recommender" />;
}