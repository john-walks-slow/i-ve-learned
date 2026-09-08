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
