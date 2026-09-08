import { CATEGORIES } from "../../data/categories";
import type { BacklogMaterial, LearnedMaterial } from "../content";
import type { MaterialType } from "../schema";

/**
 * 图谱数据模型（纯函数）：材料 + 分类 → 节点/边。
 * demo 条目排除；节点/边的 id 稳定（slug/路径派生）。
 */

export type AtlasStatus = "done" | "learning" | "todo";

export interface AtlasCategoryNode {
  id: string; // cat:Systems 或 cat:Systems/Distributed
  kind: "category";
  label: string; // 显示名（末级）
  path: string; // 完整路径
  top: boolean;
  x: number;
  y: number;
}

export interface AtlasMaterialNode {
  id: string; // mat:slug
  kind: "material";
  label: string;
  slug: string;
  type: MaterialType;
  status: AtlasStatus;
  /** 渲染半径（时长/笔记量的弱编码，3–7） */
  size: number;
  /** ISO 日期（时间即角度的布局依据，UTC 保证跨平台确定性） */
  date: string;
  x: number;
  y: number;
}

export type AtlasNode = AtlasCategoryNode | AtlasMaterialNode;

export interface AtlasLink {
  source: string;
  target: string;
  kind: "member" | "tag";
  /** tag 边的共享标签数 */
  weight?: number;
}

export interface AtlasGraph {
  nodes: AtlasNode[];
  links: AtlasLink[];
}

function materialStatus(m: LearnedMaterial | BacklogMaterial): AtlasStatus {
  if ("status" in m && m.status) return m.status;
  return "done";
}

/** 时长 → 半径的弱编码（对数感知，克制） */
function sizeFor(m: LearnedMaterial | BacklogMaterial): number {
  const minutes =
    ('duration' in m ? m.duration : undefined) ?? ('est' in m ? m.est : undefined) ?? 0;
  if (minutes <= 0) return 4;
  const s = 4 + Math.log2(1 + minutes / 25);
  return Math.min(9, Math.round(s * 10) / 10);
}

/**
 * 构建图谱（不含坐标——layout 负责）。
 * tag 边：仅跨顶层分类的材料对，共享标签数为权重。
 */
export function buildGraph(
  learned: LearnedMaterial[],
  backlog: BacklogMaterial[],
): AtlasGraph {
  const nodes: AtlasNode[] = [];
  const links: AtlasLink[] = [];

  const materials = [...learned, ...backlog];

  // 分类节点：来自注册表结构（即使空也保留骨架）
  for (const def of CATEGORIES) {
    nodes.push({
      id: `cat:${def.name}`,
      kind: "category",
      label: def.name,
      path: def.name,
      top: true,
      x: 0,
      y: 0,
    });
    for (const child of def.children ?? []) {
      nodes.push({
        id: `cat:${def.name}/${child}`,
        kind: "category",
        label: child,
        path: `${def.name}/${child}`,
        top: false,
        x: 0,
        y: 0,
      });
    }
  }

  // 材料节点 + 从属边
  for (const m of materials) {
    nodes.push({
      id: `mat:${m.slug}`,
      kind: "material",
      label: m.title,
      slug: m.slug,
      type: m.type,
      status: materialStatus(m),
      size: sizeFor(m),
      date: m.date.toISOString(),
      x: 0,
      y: 0,
    });
    if (m.category && m.category.length > 0) {
      links.push({
        source: `mat:${m.slug}`,
        target: `cat:${m.category.join("/")}`,
        kind: "member",
      });
    }
  }

  // tag 边：同标签、跨顶层分类的材料对
  const byTag = new Map<string, { slug: string; top: string }[]>();
  for (const m of materials) {
    for (const tag of m.tags) {
      const top = m.category?.[0] ?? "_none";
      const list = byTag.get(tag) ?? [];
      list.push({ slug: m.slug, top });
      byTag.set(tag, list);
    }
  }
  const pairWeight = new Map<string, number>();
  for (const items of byTag.values()) {
    if (items.length < 2) continue;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (a.top === b.top) continue; // 只连跨星系的
        const key = [a.slug, b.slug].sort().join("␟");
        pairWeight.set(key, (pairWeight.get(key) ?? 0) + 1);
      }
    }
  }
  for (const [key, weight] of pairWeight) {
    const [a, b] = key.split("␟");
    links.push({ source: `mat:${a}`, target: `mat:${b}`, kind: "tag", weight });
  }

  return { nodes, links };
}
