/**
 * 分类注册表 — 全站分类的唯一真相源。
 *
 * frontmatter 里的 `category` 数组必须命中这里定义的路径（硬校验，见 content.config.ts）。
 * 顶层分类的顺序同时决定：星图（Atlas）的扇区顺序、时间线与待学页筛选 chips 的顺序。
 * 新增分类 = 在这里加一行；顺序是有意的（大致按领域亲缘排列）。
 */

export interface CategoryDef {
  /** 顶层分类名 */
  name: string;
  /** 一句话说明（分类页副标题用，可选） */
  note?: string;
  /** 子分类；仅支持一层（两级足够表达"领域 → 方向"） */
  children?: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: "Systems",
    note: "系统、网络与底层——东西是怎么真正跑起来的",
    children: ["Distributed", "Storage", "Networking", "OS & Kernel"],
  },
  {
    name: "Frontend",
    note: "渲染、交互与工程化",
    children: ["Rendering", "Frameworks", "Tooling"],
  },
  {
    name: "Language",
    note: "语言设计与运行时",
    children: ["TypeScript", "Rust", "Go"],
  },
  {
    name: "ML",
    note: "机器学习与 AI",
    children: ["Fundamentals", "LLM", "RAG"],
  },
  {
    name: "Design",
    note: "设计与排版（这个站本身就是练习场）",
    children: ["Typography", "Interaction"],
  },
  {
    name: "Engineering",
    note: "工程方法与实践",
    children: ["Testing", "Architecture", "DevOps"],
  },
];

/** 全部合法的顶层分类名 */
export const TOP_CATEGORIES = CATEGORIES.map((c) => c.name);

/** "Top > Child" → 合法路径集合（含仅顶层的两段写法校验用） */
export const VALID_PATHS = new Set<string>(
  CATEGORIES.flatMap((c) => [
    c.name,
    ...(c.children ?? []).map((child) => `${c.name}/${child}`),
  ]),
);

/** 校验分类路径，返回错误信息；合法返回 null */
export function validateCategoryPath(path: string[]): string | null {
  if (path.length === 0) return null; // category 可选
  if (path.length > 2) return "分类最多两级（如 [Systems, Distributed]）";
  const joined = path.join("/");
  if (!VALID_PATHS.has(joined)) {
    return `未注册的分类 "${joined}"——请在 src/data/categories.ts 注册，或改成已注册分类`;
  }
  return null;
}

/** 顶层分类的显示顺序索引（星图扇区/筛选排序用） */
export const TOP_ORDER: ReadonlyMap<string, number> = new Map(
  CATEGORIES.map((c, i) => [c.name, i]),
);
