import { describe, expect, it } from "vitest";
import { TOP_ORDER, validateCategoryPath } from "../../src/data/categories";

describe("validateCategoryPath", () => {
  it("接受已注册的顶层分类", () => {
    expect(validateCategoryPath(["Systems"])).toBeNull();
  });

  it("接受已注册的两级路径", () => {
    expect(validateCategoryPath(["Systems", "Distributed"])).toBeNull();
    expect(validateCategoryPath(["Frontend", "Rendering"])).toBeNull();
  });

  it("拒绝未注册的顶层", () => {
    expect(validateCategoryPath(["Quantum"])).toMatch(/未注册/);
  });

  it("拒绝正确的顶层 + 错误的子级", () => {
    expect(validateCategoryPath(["Systems", "WrongChild"])).toMatch(/未注册/);
  });

  it("拒绝三级路径", () => {
    expect(validateCategoryPath(["Systems", "Distributed", "Deep"])).toMatch(
      /两级/,
    );
  });

  it("空路径（可选字段缺席）合法", () => {
    expect(validateCategoryPath([])).toBeNull();
  });
});

describe("TOP_ORDER", () => {
  it("顺序与注册表一致（星图扇区序 = 筛选序）", () => {
    expect(TOP_ORDER.get("Systems")).toBe(0);
    expect(TOP_ORDER.get("Engineering")).toBe(5);
  });
});
