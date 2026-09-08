import type { BacklogMaterial, LearnedMaterial } from "./content";

/**
 * 全站统计（纯函数）：首页数据行、待学页统计、"今年已点亮"。
 * 口径：draft 已在数据层过滤；demo 条目带"示例"角标展示，上线前整体移除（M7 验收项）。
 */

export interface SiteStats {
  learnedCount: number;
  /** 实际学习总时长（小时，learned.duration 之和；无 duration 的条目不计） */
  hours: number;
  /** 有条目挂载的分类数（顶层） */
  fields: number;
  /** 今年已学数量 */
  thisYear: number;
  /** 正在学（backlog status=learning） */
  nowLearning: number;
  /** 待学数量（不含 learning） */
  waiting: number;
  /** 待学预计总时长（小时） */
  waitingHours: number;
}

export function computeStats(
  learned: LearnedMaterial[],
  backlog: BacklogMaterial[],
  now: Date = new Date(),
): SiteStats {
  const minutes = learned.reduce((s, m) => s + (m.duration ?? 0), 0);
  const fields = new Set(
    [...learned, ...backlog].flatMap((m) =>
      m.category?.length ? [m.category[0]] : [],
    ),
  ).size;

  return {
    learnedCount: learned.length,
    hours: Math.round((minutes / 60) * 10) / 10,
    fields,
    thisYear: learned.filter((m) => m.date.getFullYear() === now.getFullYear())
      .length,
    nowLearning: backlog.filter((m) => m.status === "learning").length,
    waiting: backlog.filter((m) => m.status === "todo").length,
    waitingHours:
      Math.round((backlog.reduce((s, m) => s + (m.est ?? 0), 0) / 60) * 10) /
      10,
  };
}
