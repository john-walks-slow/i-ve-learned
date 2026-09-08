import type { LearnedMaterial } from "./content";

/**
 * 时间线分组（纯函数）：年 → 月，倒序。
 * 月份用 0-11 数字键，展示时由 monthLabel 转英文月份名。
 */

export interface MonthGroup {
  month: number; // 0-11
  items: LearnedMaterial[];
}

export interface YearGroup {
  year: number;
  months: MonthGroup[];
}

export function groupByMonth(items: LearnedMaterial[]): YearGroup[] {
  const byYear = new Map<number, Map<number, LearnedMaterial[]>>();

  for (const item of items) {
    const y = item.date.getFullYear();
    const m = item.date.getMonth();
    let byMonth = byYear.get(y);
    if (!byMonth) {
      byMonth = new Map();
      byYear.set(y, byMonth);
    }
    const list = byMonth.get(m) ?? [];
    list.push(item);
    byMonth.set(m, list);
  }

  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0]) // 年倒序
    .map(([year, byMonth]) => ({
      year,
      months: [...byMonth.entries()]
        .sort((a, b) => b[0] - a[0]) // 月倒序
        .map(([month, list]) => ({
          month,
          // 同月内按日期倒序（getLearned 已排序，双保险）
          items: [...list].sort((a, b) => b.date.getTime() - a.date.getTime()),
        })),
    }));
}

/** 近 N 个月的活动计数（热力带数据）：[{date, count}]，按天聚合，最早在前 */
export function activityByDay(
  items: LearnedMaterial[],
  months = 12,
  now: Date = new Date(),
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // 生成从 (now - months + 1) 月第一天到今天的连续日期序列
  const days: { date: string; count: number }[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  for (
    let d = new Date(start);
    d <= now;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return days;
}
