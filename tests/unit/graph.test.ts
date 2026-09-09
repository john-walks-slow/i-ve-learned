import { describe, expect, it } from "vitest";
import { CATEGORIES } from "../../src/data/categories";
import type { BacklogMaterial, LearnedMaterial } from "../../src/lib/content";
import { buildGraph } from "../../src/lib/graph/builder";
import { applyLayout } from "../../src/lib/graph/layout";

function learned(
  slug: string,
  over: Partial<LearnedMaterial> = {},
): LearnedMaterial {
  return {
    slug,
    title: slug,
    type: "paper",
    date: new Date("2026-09-01"),
    tags: [],
    revisit: false,
    hasBody: false,
    noteType: "note",
    demo: false,
    ...over,
  };
}

function backlog(
  slug: string,
  over: Partial<BacklogMaterial> = {},
): BacklogMaterial {
  return {
    slug,
    title: slug,
    type: "video",
    date: new Date("2026-08-01"),
    tags: [],
    revisit: false,
    hasBody: false,
    noteType: "note",
    demo: false,
    status: "todo",
    ...over,
  };
}

describe("buildGraph", () => {
  it("分类骨架完整（即使无条目），member/tag 边正确", () => {
    const g = buildGraph(
      [learned("a", { category: ["Systems", "Distributed"], tags: ["x"] })],
      [backlog("b", { category: ["Frontend", "Rendering"], tags: ["x"] })],
    );
    const catIds = g.nodes
      .filter((n) => n.kind === "category")
      .map((n) => n.id);
    expect(catIds).toContain("cat:Systems");
    expect(catIds).toContain("cat:Systems/Distributed");
    expect(g.links).toContainEqual({
      source: "mat:a",
      target: "cat:Systems/Distributed",
      kind: "member",
    });
    // 跨星系共享标签 x → 一条 tag 边
    expect(g.links).toContainEqual({
      source: "mat:a",
      target: "mat:b",
      kind: "tag",
      weight: 1,
    });
  });

  it("同星系内共享标签不产生 tag 边", () => {
    const g = buildGraph(
      [
        learned("a", { category: ["Systems", "Distributed"], tags: ["x"] }),
        learned("b", { category: ["Systems", "Storage"], tags: ["x"] }),
      ],
      [],
    );
    expect(g.links.filter((l) => l.kind === "tag")).toHaveLength(0);
  });

  it("draft 由数据层过滤；demo 条目正常进图谱（上线前整体移除）", () => {
    const g = buildGraph([learned("d", { demo: true })], []);
    expect(g.nodes.some((n) => n.id === "mat:d")).toBe(true);
  });

  it("learning 状态来自 backlog.status，learned 一律 done", () => {
    const g = buildGraph(
      [learned("done1")],
      [backlog("ing", { status: "learning" })],
    );
    const st = (id: string) =>
      g.nodes.find((n) => n.id === id)?.kind === "material" &&
      (g.nodes.find((n) => n.id === id) as { status: string }).status;
    expect(st("mat:done1")).toBe("done");
    expect(st("mat:ing")).toBe("learning");
  });
});

describe("applyLayout（确定性 + 增量稳定）", () => {
  it("同输入 → 同输出（确定性）", () => {
    const src = [
      learned("a", { category: ["Systems", "Distributed"] }),
      learned("b", { category: ["ML", "LLM"], tags: ["t"] }),
      learned("c"),
    ];
    const g1 = applyLayout(buildGraph(src, []));
    const g2 = applyLayout(buildGraph(src, []));
    expect(g1).toEqual(g2);
  });

  it("顶层分类角槽与内容量无关：增删条目不移动任何已有节点", () => {
    const before = applyLayout(
      buildGraph(
        [
          learned("a", { category: ["Systems", "Distributed"] }),
          learned("b", { category: ["ML"] }),
        ],
        [backlog("c", { category: ["Design"] })],
      ),
    );
    const beforePos = new Map(before.nodes.map((n) => [n.id, [n.x, n.y]]));

    // 新增一个材料 + 一个带新分类引用的条目
    const after = applyLayout(
      buildGraph(
        [
          learned("a", { category: ["Systems", "Distributed"] }),
          learned("b", { category: ["ML"] }),
          learned("new-one", { category: ["Systems", "Storage"] }),
        ],
        [backlog("c", { category: ["Design"] })],
      ),
    );

    for (const node of after.nodes) {
      const prev = beforePos.get(node.id);
      if (prev) {
        expect([node.x, node.y], `节点 ${node.id} 不应移动`).toEqual(prev);
      }
    }
    // 新节点有坐标
    const added = after.nodes.find((n) => n.id === "mat:new-one")!;
    expect(Number.isFinite(added.x)).toBe(true);
  });

  it("顶层分类在环上、材料在叶分类圆盘内", () => {
    const g = applyLayout(
      buildGraph([learned("a", { category: ["Systems", "Distributed"] })], []),
    );
    const top = g.nodes.find((n) => n.id === "cat:Systems")!;
    expect(Math.hypot(top.x, top.y)).toBeCloseTo(520, 0);
    const mat = g.nodes.find((n) => n.id === "mat:a")!;
    const leaf = g.nodes.find((n) => n.id === "cat:Systems/Distributed")!;
    const dist = Math.hypot(mat.x - leaf.x, mat.y - leaf.y);
    expect(dist).toBeLessThanOrEqual(80 + 1); // 圆盘半径（含取整容差）
  });

  it("直接挂顶层的材料落在向心楔形内", () => {
    const g = applyLayout(buildGraph([learned("t", { category: ["ML"] })], []));
    const mat = g.nodes.find((n) => n.id === "mat:t")!;
    const top = g.nodes.find((n) => n.id === "cat:ML")!;
    const dist = Math.hypot(mat.x - top.x, mat.y - top.y);
    expect(dist).toBeGreaterThanOrEqual(40);
    expect(dist).toBeLessThanOrEqual(90);
    // 楔形朝中心：材料到中心的距离 < 顶层节点到中心的距离
    expect(Math.hypot(mat.x, mat.y)).toBeLessThan(Math.hypot(top.x, top.y));
  });

  it("同扇区相邻子分类的间距 > 双盘直径（防材料盘重叠）", () => {
    const g = applyLayout(buildGraph([], []));
    const systems = CATEGORIES.find((c) => c.name === "Systems")!;
    const names = systems.children ?? [];
    for (let i = 0; i + 1 < names.length; i++) {
      const a = g.nodes.find((n) => n.id === `cat:Systems/${names[i]}`)!;
      const b = g.nodes.find((n) => n.id === `cat:Systems/${names[i + 1]}`)!;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      expect(dist, `${names[i]} 与 ${names[i + 1]} 弦距`).toBeGreaterThan(
        80 * 2,
      );
    }
  });

  it("无分类材料落在中心环带内", () => {
    const g = applyLayout(buildGraph([learned("loose")], []));
    const mat = g.nodes.find((n) => n.id === "mat:loose")!;
    const dist = Math.hypot(mat.x, mat.y);
    expect(dist).toBeGreaterThanOrEqual(150);
    expect(dist).toBeLessThanOrEqual(230);
  });
});
