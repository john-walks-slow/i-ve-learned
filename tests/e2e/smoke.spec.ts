import { expect, test } from "@playwright/test";

/**
 * 核心访客路径冒烟（计划 §3.7；260909 起内容无关化——demo 数据已清空，
 * 真实内容回填后这些断言依然成立）：
 * 落地（空态）→ 星图 → 待学页（空态）→ ⌘K。
 */

test("首页：空态——热力带 + 空提示，无统计行", async ({ page }) => {
  await page.goto("./");
  // h1 已删；还没有记录时统计行整体隐藏
  await expect(page.locator("h1")).toHaveCount(0);
  await expect(page.getByText(/learned ·/)).toHaveCount(0);
  // 热力带存在且有月份标签（站点身份元素，空内容也渲染）
  await expect(
    page.locator('[role="img"][aria-label*="热力图"]'),
  ).toBeVisible();
  await expect(page.getByText("Sep", { exact: true })).toBeVisible();
  // 空态提示可见
  await expect(page.getByText(/还没有记录/)).toBeVisible();
});

test("Atlas：canvas 渲染 + 文本投影入口", async ({ page }) => {
  await page.goto("./atlas");
  const canvas = page.locator("#atlas-canvas");
  await expect(canvas).toBeVisible();
  // 有节点时等渲染器入场（图上有像素）；空内容时 canvas 合法为空
  const nodeCount = await page.evaluate(async () => {
    const res = await fetch(new URL("graph.json", location.href));
    const g = (await res.json()) as { nodes: unknown[] };
    return g.nodes.length;
  });
  if (nodeCount > 0) {
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
  }
  await expect(page.locator('a:has-text("text view")')).toBeVisible();
  // CI 审阅产物：入场完成后的整页截图（上传为 artifact）
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/atlas-ci.png", fullPage: false });
});

test("Backlog：空态统计 + 空提示", async ({ page }) => {
  await page.goto("./backlog");
  await expect(page.locator("h1")).toContainText("Backlog");
  await expect(page.getByText(/waiting · ~/)).toBeVisible();
  await expect(page.getByText(/待学清单是空的/)).toBeVisible();
});

test("⌘K：打开 → 搜索 → 键盘选择", async ({ page }) => {
  await page.goto("./");
  // 鼠标点击导航栏徽章同样可打开
  await page.locator("#ck-trigger").click();
  const overlay = page.locator(".ck-overlay");
  await expect(overlay).toHaveClass(/is-open/);
  await page.keyboard.press("Escape");
  await expect(overlay).not.toHaveClass(/is-open/);
  // 键盘路径
  await page.keyboard.press("Control+k");
  await expect(overlay).toHaveClass(/is-open/);
  // 默认列表有 pages 组
  await expect(overlay.locator(".item").first()).toContainText("Timeline");
  // 搜索站点页面
  await page.keyboard.type("atlas");
  await expect(overlay.locator(".item")).toHaveCount(1);
  await expect(overlay.locator(".item").first()).toContainText("Atlas");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(overlay).not.toHaveClass(/is-open/);
});

test("无 JS 降级：空态提示可见、无 chips", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("./");
  await expect(page.getByText(/还没有记录/)).toBeVisible();
  await expect(page.locator("#filters")).toHaveCount(0);
  await ctx.close();
});
