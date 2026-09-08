import { CATEGORIES } from "../../data/categories";
import type { AtlasGraph } from "./builder";

/**
 * 确定性聚类布局（构建期运行，写死进 graph.json）。
 *
 * 结构（花瓣/曼陀罗几何）：
 *   中心 → 无分类材料环 → 顶层分类环（R1）→ 子分类在各自扇区**向外**展开（R2）
 *   → 材料围绕叶分类的圆盘。同一扇区的相邻子分类弦距 > 双盘直径，天然不重叠。
 *
 * 设计目标（计划 §3.2 / cross-check 修正）：
 * 1. **增量稳定**：新增/删除一个材料只影响该材料自己的坐标；
 *    分类坐标只由注册表顺序决定（角槽固定），与内容量无关。
 * 2. **确定性**：材料的散布由 slug 哈希派生的 PRNG 决定，无 Math.random。
 * 3. **可读结构**：顺着半径读 = 领域 → 方向 → 材料。
 */

/* ---------- 确定性 PRNG（整数运算，跨平台稳定） ---------- */

/** FNV-1a 字符串哈希 → 32 位无符号整数 */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32：一个 32 位种子 → [0,1) 均匀流 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** slug → 稳定的 [0,1) 序列 */
function prngFor(key: string): () => number {
  return mulberry32(fnv1a(key));
}

/* ---------- 布局常量（世界坐标，中心 0,0） ---------- */

export const LAYOUT = {
  /** 顶层分类环半径 */
  ringRadius: 520,
  /** 子分类相对顶层的径向外推距离 */
  subOrbit: 210,
  /** 子分类在扇区内的最大张角（弧度，±） */
  subSpread: 0.35,
  /** 叶分类材料散布圆盘半径 */
  materialDisc: 80,
  /** 直接挂在顶层的材料：向内楔形（内径） */
  topWedgeInner: 40,
  topWedgeOuter: 90,
  /** 无分类材料的中心环（内半径） */
  looseRingInner: 150,
  looseRingOuter: 240,
} as const;

/** 顶层分类角槽：12 点钟起顺时针，i / N 均分，与内容量无关 */
function topAngle(index: number, total: number): number {
  return -Math.PI / 2 + (2 * Math.PI * index) / total;
}

/**
 * 就地写入节点坐标（保持 nodes 顺序与 id 不变 → graph.json 可 diff 审阅）。
 */
export function applyLayout(graph: AtlasGraph): AtlasGraph {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const topDefs = CATEGORIES;
  const N = topDefs.length;

  // 1) 顶层分类：环形固定角槽
  topDefs.forEach((def, i) => {
    const angle = topAngle(i, N);
    const node = byId.get(`cat:${def.name}`);
    if (node) {
      node.x = Math.round(Math.cos(angle) * LAYOUT.ringRadius);
      node.y = Math.round(Math.sin(angle) * LAYOUT.ringRadius);
    }

    // 2) 子分类：沿半径向外（R1 + subOrbit），在扇区内按注册表顺序均分张角；
    //    半径加确定性扰动（child 路径哈希）打破完美弧线，避免"网格吸附感"
    const children = def.children ?? [];
    const k = children.length;
    children.forEach((child, j) => {
      const offset = k === 1 ? 0 : (j / (k - 1) - 0.5) * 2 * LAYOUT.subSpread;
      const subAngle = angle + offset;
      const r =
        LAYOUT.ringRadius + LAYOUT.subOrbit + ((fnv1a(child) % 51) - 25);
      const cnode = byId.get(`cat:${def.name}/${child}`);
      if (cnode) {
        cnode.x = Math.round(Math.cos(subAngle) * r);
        cnode.y = Math.round(Math.sin(subAngle) * r);
      }
    });
  });

  // 3) 材料
  const memberTarget = new Map<string, string>();
  for (const l of graph.links) {
    if (l.kind === "member") memberTarget.set(l.source, l.target);
  }

  for (const node of graph.nodes) {
    if (node.kind !== "material") continue;
    const rand = prngFor(node.slug);

    // 时间即角度：材料在其锚点周围的角度由学习/加入日期决定（年内位置 → 2π），
    // 同时期的材料自然聚簇——有机感来自真实时间结构，且与内容量无关（增量稳定）。
    const d = new Date(node.date);
    const dayOfYear =
      (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000;
    const timeAngle = (dayOfYear / 366) * 2 * Math.PI;
    const angle = timeAngle + (rand() - 0.5) * 0.5; // 抖动 ±0.25 rad

    const anchorId = memberTarget.get(node.id);
    const anchor = anchorId ? byId.get(anchorId) : undefined;
    if (anchor && anchor.kind === "category" && !anchor.top) {
      // 叶分类：径向分布偏外壳（星座有远有近，但少有贴着锚点的）
      const radius = (0.35 + rand() * 0.65) * LAYOUT.materialDisc;
      node.x = Math.round(anchor.x + Math.cos(angle) * radius);
      node.y = Math.round(anchor.y + Math.sin(angle) * radius);
    } else if (anchor) {
      // 直接挂顶层：向心的楔形
      const toCenter = Math.atan2(-anchor.y, -anchor.x);
      const a = toCenter + (angle % (Math.PI / 2)) - Math.PI / 4;
      const radius =
        LAYOUT.topWedgeInner +
        rand() * (LAYOUT.topWedgeOuter - LAYOUT.topWedgeInner);
      node.x = Math.round(anchor.x + Math.cos(a) * radius);
      node.y = Math.round(anchor.y + Math.sin(a) * radius);
    } else {
      // 无分类：中心环（角度同样由日期驱动）
      const radius =
        LAYOUT.looseRingInner +
        rand() * (LAYOUT.looseRingOuter - LAYOUT.looseRingInner);
      node.x = Math.round(Math.cos(angle) * radius);
      node.y = Math.round(Math.sin(angle) * radius);
    }
  }

  return graph;
}
