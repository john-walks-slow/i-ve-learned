import { describe, expect, it } from 'vitest';
import { buildCategoryTree, buildTagIndex, findCategory } from '../../src/lib/category-tree';
import type { LearnedMaterial } from '../../src/lib/content';

function m(slug: string, category?: string[], tags: string[] = []): LearnedMaterial {
  return {
    slug,
    title: slug,
    type: 'paper',
    date: new Date('2026-09-01'),
    category,
    tags,
    revisit: false,
    demo: false,
  };
}

describe('buildCategoryTree', () => {
  it('结构跟随注册表，计数正确', () => {
    const tree = buildCategoryTree([
      m('a', ['Systems', 'Distributed']),
      m('b', ['Systems']),
      m('c', ['Systems', 'Distributed']),
      m('d', ['Frontend', 'Rendering']),
    ]);
    expect(tree.map((n) => n.name)).toEqual([
      'Systems',
      'Frontend',
      'Language',
      'ML',
      'Design',
      'Engineering',
    ]);
    const systems = tree[0];
    expect(systems.ownCount).toBe(1);
    expect(systems.totalCount).toBe(3);
    expect(systems.children.find((c) => c.name === 'Distributed')?.ownCount).toBe(2);
  });

  it('无分类条目不计入任何节点', () => {
    const tree = buildCategoryTree([m('loose')]);
    expect(tree.every((n) => n.totalCount === 0)).toBe(true);
  });
});

describe('buildTagIndex', () => {
  it('聚合标签 → 条目', () => {
    const idx = buildTagIndex([m('a', undefined, ['latency', 'p99']), m('b', undefined, ['latency'])]);
    expect(idx.get('latency')?.map((i) => i.slug)).toEqual(['a', 'b']);
    expect(idx.get('p99')?.map((i) => i.slug)).toEqual(['a']);
  });
});

describe('findCategory', () => {
  const tree = buildCategoryTree([m('a', ['Systems', 'Distributed'])]);

  it('顶层命中返回节点与 note', () => {
    const hit = findCategory(tree, ['Systems']);
    expect(hit?.node.name).toBe('Systems');
    expect(hit?.defNote).toBeTruthy();
  });

  it('子级命中', () => {
    expect(findCategory(tree, ['Systems', 'Distributed'])?.node.ownCount).toBe(1);
  });

  it('未知路径返回 undefined', () => {
    expect(findCategory(tree, ['Nope'])).toBeUndefined();
    expect(findCategory(tree, ['Systems', 'Nope'])).toBeUndefined();
    expect(findCategory(tree, [])).toBeUndefined();
  });
});
