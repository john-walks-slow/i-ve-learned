import { describe, expect, it } from "vitest";
import type { BacklogMaterial, LearnedMaterial } from "../../src/lib/content";
import { computeStats } from "../../src/lib/stats";

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
    type: "paper",
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

describe("computeStats", () => {
  const now = new Date(2026, 8, 8);

  it("统计所有非 draft 条目（demo 带角标展示、上线前移除）", () => {
    const s = computeStats(
      [learned("real"), learned("demo", { demo: true })],
      [backlog("b-real")],
      now,
    );
    expect(s.learnedCount).toBe(2);
    expect(s.waiting).toBe(1);
  });

  it("hours = duration 之和（小时，一位小数）", () => {
    const s = computeStats(
      [learned("a", { duration: 45 }), learned("b", { duration: 30 })],
      [],
      now,
    );
    expect(s.hours).toBe(1.3);
  });

  it("thisYear 只数当年", () => {
    const s = computeStats(
      [
        learned("now", { date: new Date("2026-01-02") }),
        learned("old", { date: new Date("2025-12-31") }),
      ],
      [],
      now,
    );
    expect(s.thisYear).toBe(1);
  });

  it("nowLearning 与 waiting 分开计数", () => {
    const s = computeStats(
      [],
      [backlog("l", { status: "learning" }), backlog("t1"), backlog("t2")],
      now,
    );
    expect(s.nowLearning).toBe(1);
    expect(s.waiting).toBe(2);
  });

  it("fields 由 learned+backlog 的顶层分类去重", () => {
    const s = computeStats(
      [learned("a", { category: ["Systems", "Distributed"] })],
      [
        backlog("b", { category: ["Systems", "Storage"] }),
        backlog("c", { category: ["ML"] }),
      ],
      now,
    );
    expect(s.fields).toBe(2);
  });
});
