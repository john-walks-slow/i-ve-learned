import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";

/**
 * OG 分享卡片（计划 §5.1：站名 + 标题 + 类型字）。
 * learned + backlog 全量生成，PNG 输出到 /og/<slug>.png。
 * 样式走默认纸感定制：底色取纸面、墨色标题、mono 元数据。
 */
const learned = await getCollection("learned", ({ data }) => !data.draft);
const backlog = await getCollection("backlog", ({ data }) => !data.draft);

const pages: Record<string, { title: string; description?: string }> =
  Object.fromEntries(
    [...learned, ...backlog].map((entry) => [
      entry.id,
      {
        title: entry.data.title,
        description: entry.data.comment,
      },
    ]),
  );
// 站点级默认卡片（首页/Atlas/待学页共用）。
// 键用 _site：下划线开头不会是内容 slug（目录 loader 排除 _ 前缀）。
pages._site = {
  title: "What I've Learned",
  description: "读过的、看完的、动手写下来的——两个 markdown 目录里的人生。",
};

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  // param 名由文件名 [...route] 自动推导（0.13.1 起 param 选项已移除）
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description ?? "",
    // 纸感三色：底纸、墨、发丝线（与站内 tokens 一致，RGB 数组）
    bgGradient: [[250, 248, 244]],
    border: { color: [227, 221, 205], width: 2, side: "inline-start" },
    font: {
      title: {
        families: ["Noto Serif SC"],
        size: 56,
        weight: "Bold",
        color: [33, 29, 23],
      },
      description: {
        families: ["Noto Serif SC"],
        size: 28,
        weight: "Normal",
        color: [87, 80, 63],
      },
    },
    padding: 72,
    // 本地 fontsource 字体（构建期无网络依赖；与站内衬线基调一致）
    fonts: [
      "./node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-600-normal.woff2",
      "./node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-400-normal.woff2",
    ],
  }),
});
