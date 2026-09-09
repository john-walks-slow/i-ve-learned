import type { APIRoute } from "astro";
import { TOP_ORDER } from "../data/categories";
import { getBacklog, getLearned } from "../lib/content";
import { slugify } from "../lib/url";

/**
 * ⌘K 命令面板的构建期索引（计划 §3.6）：
 * 页面 + 材料（learned/backlog）+ 分类 + 标签，一次 JSON。
 * minisearch 在首次按键时才加载——首屏零成本。
 */
export const GET: APIRoute = async () => {
  const learned = await getLearned();
  const backlog = await getBacklog();

  const items: SearchItem[] = [
    {
      g: "pages",
      slug: "page-timeline",
      label: "Timeline",
      href: "/",
      k: "timeline home 首页",
    },
    {
      g: "pages",
      slug: "page-atlas",
      label: "Atlas",
      href: "/atlas/",
      k: "atlas graph 星图",
    },
    {
      g: "pages",
      slug: "page-backlog",
      label: "Backlog",
      href: "/backlog/",
      k: "backlog todo 待学",
    },
    {
      g: "pages",
      slug: "page-fields",
      label: "Fields",
      href: "/category/",
      k: "fields category 分类",
    },
  ];

  for (const m of learned) {
    items.push({
      g: "learned",
      label: m.title,
      slug: m.slug,
      href: m.url ?? `/m/${m.slug}/`,
      k: [m.type, m.category?.join(" "), m.tags.join(" "), m.comment]
        .filter(Boolean)
        .join(" "),
    });
  }
  for (const m of backlog) {
    items.push({
      g: "backlog",
      label: m.title,
      slug: m.slug,
      href: m.url ?? `/m/${m.slug}/`,
      k: [m.type, m.status, m.category?.join(" "), m.tags.join(" "), m.comment]
        .filter(Boolean)
        .join(" "),
    });
  }
  for (const top of TOP_ORDER.keys()) {
    items.push({
      g: "categories",
      slug: `cat-${slugify(top)}`,
      label: top,
      href: `/category/${slugify(top)}/`,
      k: "field",
    });
  }
  const tags = new Set<string>();
  for (const m of [...learned, ...backlog]) {
    for (const t of m.tags) tags.add(t);
  }
  for (const tag of tags) {
    items.push({
      g: "tags",
      slug: `tag-${tag}`,
      label: `#${tag}`,
      href: `/tags/${tag}/`,
      k: "tag 标签",
    });
  }

  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json" },
  });
};

interface SearchItem {
  g: "pages" | "learned" | "backlog" | "categories" | "tags";
  label: string;
  /** MiniSearch 主键（slug 唯一；href 可能是共享的原文外链） */
  slug?: string;
  href: string;
  k?: string;
}
