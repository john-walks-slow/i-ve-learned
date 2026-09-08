import { describe, expect, it } from 'vitest';
import { groupByMonth, activityByDay } from '../../src/lib/timeline';
import type { LearnedMaterial } from '../../src/lib/content';

function m(slug: string, iso: string): LearnedMaterial {
  return {
    slug,
    title: slug,
    type: 'paper',
    date: new Date(iso),
    tags: [],
    revisit: false,
    demo: false,
  };
}

describe('groupByMonth', () => {
  it('按年月倒序分组', () => {
    const groups = groupByMonth([
      m('a', '2026-01-15'),
      m('b', '2026-09-02'),
      m('c', '2025-12-30'),
      m('d', '2026-09-20'),
    ]);
    expect(groups.map((g) => g.year)).toEqual([2026, 2025]);
    expect(groups[0].months.map((mo) => mo.month)).toEqual([8, 0]); // Sep, Jan
    expect(groups[0].months[0].items.map((i) => i.slug)).toEqual(['d', 'b']); // 同月内按日期倒序
  });

  it('空输入返回空数组', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('activityByDay', () => {
  it('生成连续日期序列并聚合计数', () => {
    const days = activityByDay([m('a', '2026-09-01'), m('b', '2026-09-01')], 1, new Date(2026, 8, 3));
    expect(days[0].date).toBe('2026-09-01');
    expect(days.length).toBe(3); // 09-01 .. 09-03
    expect(days[0].count).toBe(2);
    expect(days[2].count).toBe(0);
  });

  it('序列起点为 N 月前（含当月共 N 个月），终点为今天', () => {
    const days = activityByDay([], 12, new Date(2026, 8, 8));
    expect(days[0].date).toBe('2025-10-01');
    expect(days.at(-1)?.date).toBe('2026-09-08');
  });
});
