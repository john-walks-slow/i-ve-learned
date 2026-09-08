/**
 * ⌘K 命令面板（计划 §3.6）：
 * - 首次 ⌘K/Ctrl+K 才动态加载本模块 + minisearch + 索引（首屏零成本）
 * - mono 风格、分组展示（pages/learned/backlog/categories/tags）
 * - 键盘全程可操作：↑↓ 选择、Enter 跳转、Esc 关闭
 */
import MiniSearch from "minisearch";

interface SearchItem {
  g: string;
  label: string;
  href: string;
  k?: string;
}

const GROUP_LABELS: Record<string, string> = {
  pages: "pages",
  learned: "learned",
  backlog: "backlog",
  categories: "fields",
  tags: "tags",
};

interface PaletteElements {
  overlay: HTMLElement;
  input: HTMLInputElement;
  list: HTMLElement;
  hint: HTMLElement;
}

let palette: PaletteElements | null = null;
let miniSearch: MiniSearch<SearchItem> | null = null;
let items: SearchItem[] = [];
let activeIndex = 0;
let rendered: SearchItem[] = [];
let opened = false;

export async function ensurePalette(): Promise<void> {
  if (!palette) {
    palette = buildPalette();
    document.body.append(palette.overlay);
  }
  if (!miniSearch) {
    const base =
      document.documentElement.dataset.base?.replace(/\/+$/, "") ?? "";
    const res = await fetch(`${base}/search-index.json`);
    items = (await res.json()) as SearchItem[];
    miniSearch = new MiniSearch({
      idField: "href", // href 全局唯一，免造自增 id
      fields: ["label", "k"],
      storeFields: ["g", "label", "href"],
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { label: 2 } },
    });
    miniSearch.addAll(items);
  }
}

export function openPalette(): void {
  if (!palette) return;
  opened = true;
  palette.overlay.classList.add("is-open");
  palette.input.value = "";
  palette.input.focus();
  renderResults("");
}

export function closePalette(): void {
  if (!palette) return;
  opened = false;
  palette.overlay.classList.remove("is-open");
}

export function isPaletteOpen(): boolean {
  return opened;
}

export function moveSelection(delta: number): void {
  if (rendered.length === 0) return;
  activeIndex = (activeIndex + delta + rendered.length) % rendered.length;
  updateSelection();
}

export function gotoActive(): void {
  const item = rendered[activeIndex];
  if (item) window.location.assign(withBase(item.href));
}

function withBase(path: string): string {
  const base = document.documentElement.dataset.base?.replace(/\/+$/, "") ?? "";
  return path === "/" ? `${base}/` : `${base}${path}`;
}

function renderResults(query: string): void {
  if (!palette || !miniSearch) return;
  const q = query.trim();
  let results: SearchItem[];
  if (!q) {
    results = items.slice(0, 12);
  } else if (/[\u4e00-\u9fff]/.test(q)) {
    // MiniSearch 的默认分词面向 ASCII 词；CJK 查询走标题/关键词子串匹配
    results = items.filter(
      (it) => it.label.includes(q) || (it.k?.includes(q) ?? false),
    );
  } else {
    results = miniSearch.search(q).map((r) => ({
      g: r.g as string,
      label: r.label as string,
      href: r.href as string,
    })) as SearchItem[];
  }

  rendered = results;
  activeIndex = 0;

  if (results.length === 0) {
    palette.list.innerHTML = `<li class="empty">no matches</li>`;
    return;
  }

  // 按组重排（保持组内顺序）
  const byGroup = new Map<string, SearchItem[]>();
  for (const item of results) {
    const list = byGroup.get(item.g) ?? [];
    list.push(item);
    byGroup.set(item.g, list);
  }
  const order = ["pages", "learned", "backlog", "categories", "tags"];
  let html = "";
  let idx = 0;
  for (const g of order) {
    const group = byGroup.get(g);
    if (!group?.length) continue;
    html += `<li class="group-label" aria-hidden="true">${GROUP_LABELS[g] ?? g}</li>`;
    for (const item of group) {
      const active = idx === activeIndex ? " is-active" : "";
      const safe = escapeHtml(item.label);
      html += `<li><a class="item${active}" data-idx="${idx}" href="${withBase(item.href)}">${safe}</a></li>`;
      idx++;
    }
  }
  palette.list.innerHTML = html;
  updateSelection();
}

function updateSelection(): void {
  if (!palette) return;
  const links = palette.list.querySelectorAll<HTMLAnchorElement>(".item");
  for (const link of links) {
    const isActive = Number(link.dataset.idx) === activeIndex;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.scrollIntoView({ block: "nearest" });
  }
}

function buildPalette(): PaletteElements {
  const overlay = document.createElement("div");
  overlay.className = "ck-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "command palette");
  overlay.innerHTML = `
    <div class="ck-panel">
      <input class="ck-input" type="text" placeholder="search…" aria-label="search"
             autocomplete="off" spellcheck="false" />
      <ul class="ck-list" role="listbox"></ul>
      <p class="ck-hint">↑↓ select · ↵ open · esc close</p>
    </div>
  `;
  // 模板是我们刚写的，元素必然存在；用类型安全的方式取出
  const input = overlay.querySelector<HTMLInputElement>(".ck-input");
  const list = overlay.querySelector<HTMLElement>(".ck-list");
  const hint = overlay.querySelector<HTMLElement>(".ck-hint");
  if (!input || !list || !hint) {
    overlay.remove();
    throw new Error("[palette] template incomplete");
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePalette();
  });
  input.addEventListener("input", () => renderResults(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      gotoActive();
    }
  });
  list.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest("a.item");
    if (link) closePalette();
  });

  return { overlay, input, list, hint };
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
}
