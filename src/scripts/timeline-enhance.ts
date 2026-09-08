/**
 * 时间线增强脚本（动态加载，无 JS 时完整列表可读）：
 * 1. 揭示筛选 chips 并接管点击（类型 × 分类 AND 组合，"all" 复位）
 * 2. 空月份/空年份自动收起
 * 3. 滚动进场 reveal（8px 上移 + 淡入，300ms；reduced-motion 跳过）
 */

interface FilterState {
  type: string;
  cat: string;
}

export function enhance(): void {
  const filters = document.getElementById("filters");
  const entries = [...document.querySelectorAll<HTMLElement>(".entry")];
  const summary = document.getElementById("filter-summary");
  if (!filters || entries.length === 0) return;

  const groups = [...document.querySelectorAll<HTMLElement>("[data-group]")];
  const state: FilterState = { type: "all", cat: "all" };

  const apply = (): void => {
    let visible = 0;
    for (const entry of entries) {
      const ok =
        (state.type === "all" || entry.dataset.type === state.type) &&
        (state.cat === "all" || entry.dataset.cat === state.cat);
      entry.hidden = !ok;
      if (ok) visible++;
    }
    // 收起空组
    for (const group of groups) {
      const hasVisible = [
        ...group.querySelectorAll<HTMLElement>(".entry"),
      ].some((e) => !e.hidden);
      group.hidden = !hasVisible;
    }
    if (summary) {
      summary.textContent =
        visible === entries.length
          ? `${entries.length} items`
          : `${visible} / ${entries.length} items`;
    }
  };

  filters.addEventListener("click", (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>(".chip");
    if (!chip) return;
    const { kind, value } = chip.dataset;
    if (!kind) return;
    state[kind as keyof FilterState] = value ?? "all";
    // 同组单选切换：再点一次回到 all
    if (value !== "all" && chip.classList.contains("is-active")) {
      state[kind as keyof FilterState] = "all";
    }
    for (const c of filters.querySelectorAll<HTMLElement>(
      `.chip[data-kind="${kind}"]`,
    )) {
      c.classList.toggle(
        "is-active",
        (c.dataset.value ?? "all") === state[kind as keyof FilterState],
      );
    }
    apply();
  });

  filters.removeAttribute("hidden");
  apply();

  // 滚动 reveal（reduced-motion 直接跳过；离屏条目滚入时再淡入）
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  document.documentElement.classList.add("enhanced");
  const io = new IntersectionObserver(
    (observed) => {
      for (const o of observed) {
        if (o.isIntersecting) {
          o.target.classList.add("shown");
          io.unobserve(o.target);
        }
      }
    },
    { rootMargin: "0px 0px -4% 0px" },
  );
  for (const entry of entries) io.observe(entry);
}
