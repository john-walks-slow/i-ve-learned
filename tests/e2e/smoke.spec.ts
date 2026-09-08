import { expect, test } from "@playwright/test";

/**
 * 核心访客路径冒烟（计划 §3.7）：
 * 落地 → 滚时间线 → 进条目 → 星图 → 待学页 → ⌘K。
 */

test("首页：自述 + 统计行 + 热力带 + 条目列表", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("h1")).toContainText("markdown 目录");
  // 统计行
  await expect(page.getByText(/learned ·/)).toBeVisible();
  // 热力带存在且有月份标签
  await expect(
    page.locator('[role="img"][aria-label*="热力图"]'),
  ).toBeVisible();
  await expect(page.getByText("Sep", { exact: true })).toBeVisible();
  // 条目渲染（demo 数据 22 条）
  const entries = page.locator("article.entry, .entry");
  await expect(entries.first()).toBeVisible();
});

test("时间线筛选：paper → 计数摘要变化", async ({ page }) => {
  await page.goto("./");
  await page.waitForLoadState("load");
  // chips 由 JS 揭示
  const chip = page.locator("#filters [data-kind='type'][data-value='paper']");
  await chip.waitFor({ state: "visible", timeout: 10_000 });
  await chip.click();
  await expect(page.locator("#filter-summary")).toContainText(/4 \/ 22/);
});

test("详情页：笔记正文 + 关联条目 + 面包屑", async ({ page }) => {
  await page.goto("./m/raft-paper");
  await expect(page.locator("h1")).toContainText("Raft");
  await expect(page.locator(".note-body h2").first()).toBeVisible();
  await expect(page.locator(".related a").first()).toBeVisible();
  // 分类面包屑链接可用
  await expect(
    page.locator('a[href*="/category/systems/distributed"]'),
  ).toBeVisible();
});

test("Atlas：canvas 渲染 + 文本投影入口", async ({ page }) => {
  await page.goto("./atlas");
  const canvas = page.locator("#atlas-canvas");
  await expect(canvas).toBeVisible();
  // 等渲染器入场完成（图上有像素）
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const c = document.getElementById(
            "atlas-canvas",
          ) as HTMLCanvasElement;
          return (
            c
              .getContext("2d")
              ?.getImageData(0, 0, c.width, c.height)
              .data.some((v) => v !== 0) ?? false
          );
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
  await expect(page.locator('a:has-text("text view")')).toBeVisible();
  // CI 审阅产物：入场完成后的整页截图（上传为 artifact）
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/atlas-ci.png", fullPage: false });
});

test("Backlog：统计行 + 正在学区 + 防腐烂提示", async ({ page }) => {
  await page.goto("./backlog");
  await expect(page.locator("h1")).toContainText("Backlog");
  await expect(page.getByText(/waiting · ~/)).toBeVisible();
  await expect(page.locator(".now-row a").first()).toBeVisible();
});

test("⌘K：打开 → 搜索 → 键盘选择", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Control+k");
  const overlay = page.locator(".ck-overlay");
  await expect(overlay).toHaveClass(/is-open/);
  // 默认列表有 pages 组
  await expect(overlay.locator(".item").first()).toContainText("Timeline");
  // 搜索 raft
  await page.keyboard.type("raft");
  await expect(overlay.locator(".item")).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(overlay).not.toHaveClass(/is-open/);
});

test("无 JS 降级：时间线完整可见", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("./");
  // 条目本体不依赖 JS（chips 隐藏但列表完整）
  const links = page.locator("article a[href*='/m/']");
  expect(await links.count()).toBeGreaterThanOrEqual(20);
  await ctx.close();
});
