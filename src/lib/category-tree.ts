import type { MaterialCommon } from "./content";

/**
 * 分类树（纯函数，260909 起自动派生）：结构完全来自条目 frontmatter 的
 * `category` 数组——没有预定义注册表，新增/弃用分类随内容自动整理。
 * 排序 = 字母序（星图角槽与筛选序稳定：内容增删不挪动已有分类的位置）。
 */

export interface CategoryCount {
  /** 完整路径，如 "Systems/Distributed" */
  path: string;
  /** 显示名（末级） */
  name: string;
  /** 顶层名 */
  top: string;
  /** 直接挂在该路径的条目数 */
  ownCount: number;
  /** 含子分类的总数（顶层节点用） */
  totalCount: number;
}

export interface CategoryNode extends CategoryCount {
  children: CategoryCount[];
}

/** 顶层分类名列表（字母序）——分组/索引/星图扇区用 */
export function deriveTopCategories(items: MaterialCommon[]): string[] {
  return buildCategoryTree(items).map((n) => n.name);
}

export function buildCategoryTree(items: MaterialCommon[]): CategoryNode[] {
  const own = new Map<string, number>(); // "Top/Child" 或 "Top" → 直接命中数
  for (const item of items) {
    const path = item.category;
    if (!path || path.length === 0) continue;
    own.set(path.join("/"), (own.get(path.join("/")) ?? 0) + 1);
  }

  // 路径 → 子树（只保留内容里真实出现过的分类）
  const tops = new Map<string, Map<string, number>>();
  for (const [path, count] of own) {
    const [top, child] = path.split("/");
    const children = tops.get(top) ?? new Map<string, number>();
    tops.set(top, children);
    if (child) {
      children.set(child, (children.get(child) ?? 0) + count);
    }
  }

  const byAlpha = (a: CategoryCount, b: CategoryCount) =>
    a.name.localeCompare(b.name);

  const nodes: CategoryNode[] = [...tops.entries()].map(([top, children]) => {
    const childNodes = [...children.entries()]
      .map(([child, count]) => ({
        path: `${top}/${child}`,
        name: child,
        top,
        ownCount: count,
        totalCount: count,
      }))
      .sort(byAlpha);
    const ownTop = own.get(top) ?? 0;
    return {
      path: top,
      name: top,
      top,
      ownCount: ownTop,
      totalCount: ownTop + childNodes.reduce((s, c) => s + c.totalCount, 0),
      children: childNodes,
    };
  });

  return nodes.sort(byAlpha);
}

/** 标签聚合：tag → 条目（按条目自身顺序） */
export function buildTagIndex<T extends MaterialCommon>(
  items: T[],
): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const item of items) {
    for (const tag of item.tags) {
      const list = index.get(tag) ?? [];
      list.push(item);
      index.set(tag, list);
    }
  }
  return index;
}

/** 在派生分类树下查找路径对应的节点（分类页用） */
export function findCategory(
  tree: CategoryNode[],
  path: string[],
): { node: CategoryCount } | undefined {
  if (path.length === 0) return undefined;
  const top = tree.find((n) => n.name === path[0]);
  if (!top) return undefined;
  if (path.length === 1) return { node: top };
  const child = top.children.find((c) => c.name === path[1]);
  if (!child) return undefined;
  return { node: child };
}
