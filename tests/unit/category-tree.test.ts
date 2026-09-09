import { describe, expect, it } from "vitest";
import {
  buildCategoryTree,
  buildTagIndex,
  deriveTopCategories,
  findCategory,
} from "../../src/lib/category-tree";
import type { LearnedMaterial } from "../../src/lib/content";

function m(
  slug: string,
  category?: string[],
  tags: string[] = [],
): LearnedMaterial {
  return {
    slug,
    title: slug,
    type: "paper",
    date: new Date("2026-09-01"),
    category,
    tags,
    revisit: false,
    hasBody: false,
    noteType: "note",
    demo: false,
  };
}

describe("buildCategoryTree（内容自动派生）", () => {
  it("结构来自条目：出现过的分类才存在，计数正确", () => {
    const tree = buildCategoryTree([
      m("a", ["Systems", "Distributed"]),
      m("b", ["Systems"]),
      m("c", ["Systems", "Distributed"]),
      m("d", ["Frontend", "Rendering"]),
    ]);
    expect(tree.map((n) => n.name)).toEqual(["Frontend", "Systems"]);
    const systems = tree[1];
    expect(systems.ownCount).toBe(1);
    expect(systems.totalCount).toBe(3);
    expect(
      systems.children.find((c) => c.name === "Distributed")?.ownCount,
    ).toBe(2);
  });

  it("排序：字母序（与数量无关——星图角槽稳定）", () => {
    const tree = buildCategoryTree([
      m("a", ["Zeta"]),
      m("b", ["Alpha"]),
      m("c", ["Alpha"]),
      m("d", ["Mid"]),
      m("e", ["Zeta", "sub"]),
      m("f", ["Zeta", "sub"]),
    ]);
    // Zeta 数量最多也排最后：位置不随内容量漂移
    expect(tree.map((n) => n.name)).toEqual(["Alpha", "Mid", "Zeta"]);
    expect(tree[2].children.map((c) => c.name)).toEqual(["sub"]);
  });

  it("空输入 → 空树（没有注册表骨架）", () => {
    expect(buildCategoryTree([])).toEqual([]);
  });

  it("无分类条目不计入任何节点", () => {
    const tree = buildCategoryTree([m("loose")]);
    expect(tree).toEqual([]);
  });
});

describe("deriveTopCategories", () => {
  it("顶层名列表按字母序", () => {
    const tops = deriveTopCategories([
      m("a", ["B", "x"]),
      m("b", ["A"]),
      m("c", ["A"]),
    ]);
    expect(tops).toEqual(["A", "B"]);
  });
});

describe("buildTagIndex", () => {
  it("聚合标签 → 条目", () => {
    const idx = buildTagIndex([
      m("a", undefined, ["latency", "p99"]),
      m("b", undefined, ["latency"]),
    ]);
    expect(idx.get("latency")?.map((i) => i.slug)).toEqual(["a", "b"]);
    expect(idx.get("p99")?.map((i) => i.slug)).toEqual(["a"]);
  });
});

describe("findCategory", () => {
  const tree = buildCategoryTree([m("a", ["Systems", "Distributed"])]);

  it("顶层命中返回节点", () => {
    const hit = findCategory(tree, ["Systems"]);
    expect(hit?.node.name).toBe("Systems");
  });

  it("子级命中", () => {
    const hit = findCategory(tree, ["Systems", "Distributed"]);
    expect(hit?.node.name).toBe("Distributed");
    expect(hit?.node.path).toBe("Systems/Distributed");
  });

  it("未出现的分类不命中", () => {
    expect(findCategory(tree, ["Quantum"])).toBeUndefined();
    expect(findCategory(tree, ["Systems", "Storage"])).toBeUndefined();
  });
});
