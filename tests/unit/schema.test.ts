import { describe, expect, it } from 'vitest';
import { learnedSchema, backlogSchema } from '../../src/lib/schema';

describe('learnedSchema', () => {
  const base = {
    title: 'Test Paper',
    type: 'paper',
    date: '2026-09-01',
  };

  it('必填字段齐备时通过', () => {
    const r = learnedSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('默认值：tags/revisit/demo/draft', () => {
    const r = learnedSchema.parse(base);
    expect(r.tags).toEqual([]);
    expect(r.revisit).toBe(false);
    expect(r.demo).toBe(false);
    expect(r.draft).toBe(false);
  });

  it('date 字符串被 coerce 成 Date', () => {
    const r = learnedSchema.parse(base);
    expect(r.date).toBeInstanceOf(Date);
  });

  it('拒绝未注册分类', () => {
    const r = learnedSchema.safeParse({ ...base, category: ['Nope'] });
    expect(r.success).toBe(false);
  });

  it('拒绝非法 type', () => {
    const r = learnedSchema.safeParse({ ...base, type: 'webinar' });
    expect(r.success).toBe(false);
  });

  it('拒绝 rating 越界', () => {
    expect(learnedSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(learnedSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
  });

  it('拒绝非法 url', () => {
    expect(learnedSchema.safeParse({ ...base, url: 'not-a-url' }).success).toBe(false);
  });

  it('duration 上限 100h（防手滑）', () => {
    expect(learnedSchema.safeParse({ ...base, duration: 60 * 101 }).success).toBe(false);
  });
});

describe('backlogSchema', () => {
  const base = {
    title: 'Raft',
    type: 'paper',
    date: '2026-08-30',
  };

  it('status 默认 todo', () => {
    const r = backlogSchema.parse(base);
    expect(r.status).toBe('todo');
  });

  it('status 只能是 todo|learning', () => {
    expect(backlogSchema.safeParse({ ...base, status: 'done' }).success).toBe(false);
  });

  it('learned 独有字段 duration 不属于 backlog（应被剥离而非报错）', () => {
    const r = backlogSchema.parse({ ...base, duration: 30, why: 'x' });
    expect('duration' in r).toBe(false);
    expect(r.why).toBe('x');
  });
});
