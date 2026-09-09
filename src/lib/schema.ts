import { z } from "zod";
import { validateCategoryPath } from "../data/categories";

/**
 * 材料类型枚举 — 与页面展示、⌘K 映射一一对应。
 * 新类型：加到这里 + src/lib/materials.ts 的展示映射。
 */
export const MATERIAL_TYPES = [
  "article",
  "video",
  "paper",
  "blog",
  "book",
  "course",
  "doc",
  "talk",
  "podcast",
  "project",
  "snippet",
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

/** 两个 collection 共享的基础字段（纯 zod，不依赖 Astro 运行时，可直接单测） */
export const baseMaterialSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  type: z.enum(MATERIAL_TYPES),
  /** learned = 学完日期；backlog = 加入日期 */
  date: z.coerce.date(),
  category: z
    .array(z.string().min(1))
    .max(2)
    .optional()
    .refine((p) => validateCategoryPath(p ?? []) === null, {
      message: "分类路径未注册（src/data/categories.ts 是唯一真相源）",
    }),
  /** 个人短评（列表页随行；区别于正文笔记 body） */
  comment: z.string().max(300).optional(),
  url: z
    .url()
    .refine((u) => /^https?:\/\//.test(u), "url 需以 http(s):// 开头")
    .optional(),
  // 标签直接作为 URL 段（/tags/[tag]/），限定小写字母数字连字符
  tags: z
    .array(
      z
        .string()
        .regex(
          /^[a-z0-9][a-z0-9-]*$/,
          "标签需为 URL 安全的小写形式（如 latency、event-loop）",
        ),
    )
    .min(1)
    .max(12)
    .default([]),
  pages: z.number().int().positive().optional(),
  source: z.string().max(120).optional(),
  revisit: z.boolean().default(false),
  /** 演示条目标记：页面上有"示例"角标；上线前整体移除（M7 验收项） */
  demo: z.boolean().default(false),
  draft: z.boolean().default(false),
});

/** learned：已学。duration = 实际用时（分钟），首页"总学习时长"的口径。 */
export const learnedSchema = baseMaterialSchema.extend({
  duration: z
    .number()
    .int()
    .positive()
    .max(60 * 100)
    .optional(),
  /** 从 backlog 晋升时保留的加入日期（"等了 n 个月"） */
  added: z.coerce.date().optional(),
  /** 最近修订（笔记持续完善时填写） */
  updated: z.coerce.date().optional(),
});

/** backlog：待学。est = 预计用时（分钟）；status 表达进行时。 */
export const backlogSchema = baseMaterialSchema.extend({
  est: z
    .number()
    .int()
    .positive()
    .max(60 * 100)
    .optional(),
  why: z.string().max(300).optional(),
  status: z.enum(["todo", "learning"]).default("todo"),
  /** 最近还碰过（推迟"还想学吗"的静默计时；如重读笔记、写了提纲） */
  updated: z.coerce.date().optional(),
});

export type LearnedData = z.output<typeof learnedSchema>;
export type BacklogData = z.output<typeof backlogSchema>;
export type BaseMaterialData = z.output<typeof baseMaterialSchema>;
