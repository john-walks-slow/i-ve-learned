import { type CollectionEntry, getCollection, render } from "astro:content";
import type { BacklogData, LearnedData } from "./schema";

/**
 * 数据访问层（薄）：Astro collection 查询 + 过滤 + 排序。
 * 纯转换逻辑（分组/建树/统计）在 timeline.ts / category-tree.ts / stats.ts 中单测。
 */

/** 视图层使用的材料形状（与 zod 输出同构，slug = 文件名） */
export interface MaterialCommon {
  slug: string;
  title: string;
  type: LearnedData["type"];
  date: Date;
  category?: string[];
  comment?: string;
  /** 正文笔记是否存在（决定列表页 note → 链接） */
  hasBody: boolean;
  url?: string;
  tags: string[];
  pages?: number;
  source?: string;
  revisit: boolean;
  demo: boolean;
}

export interface LearnedMaterial extends MaterialCommon {
  duration?: number;
  added?: Date;
  updated?: Date;
}

export interface BacklogMaterial extends MaterialCommon {
  est?: number;
  why?: string;
  status: "todo" | "learning";
  updated?: Date;
}

type LearnedEntry = CollectionEntry<"learned">;
type BacklogEntry = CollectionEntry<"backlog">;

function toLearned(entry: LearnedEntry): LearnedMaterial {
  const d = entry.data as LearnedData;
  return {
    slug: entry.id,
    title: d.title,
    type: d.type,
    date: d.date,
    category: d.category,
    comment: d.comment,
    hasBody: Boolean(entry.body && entry.body.trim().length > 0),
    url: d.url,
    tags: d.tags,
    pages: d.pages,
    source: d.source,
    revisit: d.revisit,
    demo: d.demo,
    duration: d.duration,
    added: d.added,
    updated: d.updated,
  };
}

function toBacklog(entry: BacklogEntry): BacklogMaterial {
  const d = entry.data as BacklogData;
  return {
    slug: entry.id,
    title: d.title,
    type: d.type,
    date: d.date,
    category: d.category,
    comment: d.comment,
    hasBody: Boolean(entry.body && entry.body.trim().length > 0),
    url: d.url,
    tags: d.tags,
    pages: d.pages,
    source: d.source,
    revisit: d.revisit,
    demo: d.demo,
    est: d.est,
    why: d.why,
    status: d.status,
    updated: d.updated,
  };
}

/** 判别联合：status 只在 BacklogMaterial 上（必填） */
export function isBacklog(
  m: LearnedMaterial | BacklogMaterial,
): m is BacklogMaterial {
  return "status" in m;
}

/** 全部已学（排除草稿），按学完日期倒序 */
export async function getLearned(): Promise<LearnedMaterial[]> {
  const entries = await getCollection("learned", ({ data }) => !data.draft);
  return entries
    .map(toLearned)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** 全部待学（排除草稿），按加入日期倒序 */
export async function getBacklog(): Promise<BacklogMaterial[]> {
  const entries = await getCollection("backlog", ({ data }) => !data.draft);
  return entries
    .map(toBacklog)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** 详情页渲染（Astro 7 的 markdown 渲染入口） */
export async function renderMaterial(entry: LearnedEntry | BacklogEntry) {
  return render(entry);
}

/** 按 slug 查找（详情页 getStaticParams 之后的数据源） */
export async function findLearned(
  slug: string,
): Promise<CollectionEntry<"learned"> | undefined> {
  const entries = await getCollection("learned", ({ data }) => !data.draft);
  return entries.find((e) => e.id === slug);
}

export async function findBacklog(
  slug: string,
): Promise<CollectionEntry<"backlog"> | undefined> {
  const entries = await getCollection("backlog", ({ data }) => !data.draft);
  return entries.find((e) => e.id === slug);
}

export type { BacklogEntry, LearnedEntry };
