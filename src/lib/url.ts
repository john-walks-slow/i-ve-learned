/**
 * base 感知的 URL 工具 —— 所有站内链接一律经过这里生成。
 * GitHub Pages project site 的 base 是 /i-ve-learned，换自定义域名时只改 astro.config.mjs。
 */
export function href(
  path: string,
  base: string = import.meta.env.BASE_URL ?? "/",
): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`.replace(/\/+$/, "") || "/";
}

/**
 * 分类名 → URL 段（"OS & Kernel" → "os-kernel"）。
 * 分类页的 getStaticPaths 与所有链接生成处统一走这里，页面侧再反查注册表还原显示名。
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
