import { CATEGORIES } from "../data/categories";
import type { MaterialCommon } from "./content";

/**
 * 分类树（纯函数）：注册表定义结构，条目提供计数。
 * 顺序始终跟随注册表（星图扇区序 = 筛选序 = 本函数输出序）。
 */

export interface CategoryCount {
  /** 完整路径，如 "Systems/Distributed" */
  path: string;
  /** 显示名（末级） */
  name: string;
  /** 顶层名 */
  top: string;
  /** 直接挂在顶层的条目数 */
  ownCount: number;
  /** 含子分类的总数（顶层节点用） */
  totalCount: number;
}

export interface CategoryNode extends CategoryCount {
  children: CategoryCount[];
}

export function buildCategoryTree(items: MaterialCommon[]): CategoryNode[] {
  const own = new Map<string, number>(); // "Top/Child" 或 "Top" → 直接命中数
  for (const item of items) {
    const path = item.category;
    if (!path || path.length === 0) continue;
    own.set(path.join("/"), (own.get(path.join("/")) ?? 0) + 1);
  }

  return CATEGORIES.map((def) => {
    const topPath = def.name;
    const children = (def.children ?? []).map((child) => {
      const path = `${def.name}/${child}`;
      return {
        path,
        name: child,
        top: def.name,
        ownCount: own.get(path) ?? 0,
        totalCount: own.get(path) ?? 0,
      };
    });
    const ownTop = own.get(topPath) ?? 0;
    const total = ownTop + children.reduce((s, c) => s + c.totalCount, 0);
    return {
      path: topPath,
      name: def.name,
      top: def.name,
      ownCount: ownTop,
      totalCount: total,
      children,
    };
  });
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

/** 在分类树下查找路径对应的节点（分类页用） */
export function findCategory(
  tree: CategoryNode[],
  path: string[],
): { node: CategoryCount; defNote?: string } | undefined {
  if (path.length === 0) return undefined;
  const top = tree.find((n) => n.name === path[0]);
  if (!top) return undefined;
  if (path.length === 1) {
    return {
      node: top,
      defNote: CATEGORIES.find((c) => c.name === top.name)?.note,
    };
  }
  const child = top.children.find((c) => c.name === path[1]);
  if (!child) return undefined;
  return { node: child };
}
