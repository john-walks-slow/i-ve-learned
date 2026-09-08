import type { MaterialType } from "./schema";

/**
 * 材料的展示层映射（结构性词汇用英文，mono 小字呈现——计划 §2.3）。
 */

/** 类型 → 复数形式（筛选 chips / ⌘K 分组用） */
export const TYPE_PLURAL: Record<MaterialType, string> = {
  article: "articles",
  video: "videos",
  paper: "papers",
  blog: "blogs",
  book: "books",
  course: "courses",
  doc: "docs",
  talk: "talks",
  podcast: "podcasts",
  project: "projects",
  snippet: "snippets",
};

/** 用时（分钟）→ mono 展示："45m" / "2h" / "2h30m" */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}m`;
}

/** 页数 → "12pp"（书目学缩写，editorial 气质） */
export function formatPages(pages: number): string {
  return `${pages}pp`;
}

/** Date → "09-08"（时间线条目的 mono 日期） */
export function formatDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

/** Date → "2026-09-08"（详情页/tooltip 的完整日期） */
export function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** 时间线月份分组的标签："September" */
export function monthLabel(d: Date): string {
  return MONTH_NAMES[d.getMonth()];
}

/** 相对时间："3 months ago"（backlog 的"加入于"） */
export function monthsAgo(d: Date, now: Date = new Date()): number {
  const months =
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth());
  return Math.max(0, months - (now.getDate() < d.getDate() ? 1 : 0));
}

export function agoLabel(d: Date, now: Date = new Date()): string {
  const m = monthsAgo(d, now);
  if (m <= 0) return "this month";
  if (m === 1) return "1 month ago";
  if (m < 12) return `${m} months ago`;
  const y = Math.floor(m / 12);
  return y === 1 ? "1 year ago" : `${y} years ago`;
}

/** backlog 静默多久了（用于"还想学吗"，可被 updated 推迟） */
export function silentMonthsSince(
  date: Date,
  updated: Date | undefined,
  now: Date = new Date(),
): number {
  return monthsAgo(updated && updated > date ? updated : date, now);
}
