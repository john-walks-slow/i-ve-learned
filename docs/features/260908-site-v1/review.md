# 审查报告：What I've Learned V1 实施

> 审查日期：2026-09-09
> 审查范围：6 个 commit（26fe66a → 213a603 → ae3548f → 007eb34 → 8f97131 → 3f88e7e → 166ce5a）
> 审查者：子代理（独立审查）

---

## 1. 执行摘要

代码质量高，架构与计划文档高度一致。锁发现 2 个阻塞性缺陷（已修复）和若干中等/低风险问题。

**质量门禁结果**（修复后）：

| 门禁 | 结果 |
|---|---|
| `pnpm lint`（Biome） | ✅ 31 文件通过，0 问题 |
| `vitest`（43 用例） | ✅ 6 文件 43 测试全通过 |
| `pnpm build`（Zod schema 校验） | ✅ 115 页，7.81s |
| `scripts/budgets.sh` | ✅ 6/6 预算通过 |
| `pnpm test:e2e`（Playwright 7 冒烟） | ✅ 7/7 通过（含 Atlas CI 截图） |

---

## 2. 阻塞性缺陷（已修复）

### 2.1 构建失败：`b-tree-visualization.md` 非法标签 `c++`

**症状**：`pnpm build` 因 `content/backlog/b-tree-visualization.md` 的 `tags.2` 违反 Zod regex `/^[a-z0-9][a-z0-9-]*$/` 而失败。`+` 字符不被允许。

**原因**：demo 条目使用了 `c++` 作为标签，该名称对 URL 不安全。

**修复**：`c++` → `cpp`（demo 条目，上线前整体替换，不影响语义）。

**根因**：M1 提交时引入，但 build 门禁未在每个 commit 强制执行（或该文件当时未被 `_*` 排除模式覆盖——它被 `[^_]` 模式正确匹配，所以是活跃的）。

### 2.2 E2E 测试失败：硬编码计数过期

**症状**：`smoke.spec.ts:30` 断言 `4 / 22`，但实际为 `4 / 21`。

**原因**：M7（166ce5a）删除了 `content/learned/zettelkasten-method.md`，但未同步更新 e2e 测试中的硬编码计数。

**修复**：`4 / 22` → `4 / 21`。

---

## 3. 数据层（`src/lib/`）

### 3.1 `schema.ts` ★ 优秀

- Zod 模式清晰分离：`baseMaterialSchema` → `learnedSchema` / `backlogSchema`
- 标签正则严格：`^[a-z0-9][a-z0-9-]*$` —— 确保 URL 段安全
- `category` 校验接入注册表，错误信息可操作（"请注册"引导）
- 字段上限合理：`duration` 100h、`description` 300 字、`tags` 12 个
- 类型定义周全：`z.coerce.date()` 支持 YAML 日期字符串
- 结论：质量高，直接可发

### 3.2 `content.ts` 数据访问层

- 薄层封装，`getCollection` 过滤 `draft`，排序倒序
- `MaterialCommon` 接口对称，`learned`/`backlog` 各自扩展
- `findLearned`/`findBacklog` 每次调用都 `getCollection`——Astro 7 构建期缓存，无性能问题
- 注意：`toLearned`/`toBacklog` 使用 `as LearnedData` 转型——由于 `CollectionEntry.data` 已由 Zod 验证，该转型安全

### 3.3 `graph/builder.ts` 图谱构建

- 纯函数，无副作用
- 状态推导：`materialStatus()` 正确识别 backlog 的 `learning` 状态
- 大小编码：`sizeFor()` 使用 `log2(1 + minutes/25)`，输出范围 4–9，克制且合理
- 🐛 **文档注释过时**：文件头部注释写 "demo 条目排除"，但实际行为（与决策 #6 一致）是 demo 包含。测试 `graph.test.ts:76` 明确断言 demo 包含。头部注释应更新为 "demo 条目正常进图谱（上线前整体移除）"。
- Tag 边：仅跨顶层分类的材料对，权重为共享标签数。正确防止同星系标签噪声。
- 边方向：`member` 边从材料指向分类。方向性不影响渲染（无箭头），但用于 `layout.ts` 定位锚点。

### 3.4 `graph/layout.ts` 确定性布局 ★ 精心设计

**数学正确性**：

- FNV-1a → mulberry32 PRNG：整数运算，跨平台一致，无 `Math.random()`
- 顶层分类角槽：`-π/2 + 2π * i / N`，12 点钟起顺时针，与内容量无关
- 子分类：沿半径向外，扇区内均分 `subSpread`（±0.35 rad），半径加 `fnv1a(child) % 51 - 25` 扰动
- 材料角度：`dayOfYear / 366 * 2π + 抖动(±0.25 rad)`——时间即角度，真实时间结构产生有机感
- 叶分类材料：`(0.35 + rand() * 0.65) * materialDisc`——偏外壳分布，避免簇拥锚点
- 顶层直挂材料：向心楔形，`topWedgeInner`–`topWedgeOuter`（40–90px）
- 无分类材料：中心环带，150–240px

**增量稳定性**：分类坐标仅由注册表序决定，材料的 PRNG 由 slug 派生——增删条目只影响其自身坐标。测试 `graph.test.ts:106` 认证。

**间隙边缘情况**：Systems 的 4 个子分类，相邻子分类弦距 ≈ 164px（仅比 2×80=160px 大 ~3%）。当材料在 ±80 圆盘内散布时，相邻扇区的材料盘可能轻微重叠。当前规模下可接受，但分类数增加或子分类更多时需关注。建议增加 `subOrbit` 或收紧 `subSpread` 以提供余量。

### 3.5 `stats.ts`

- 四则运算正确：`hours` 取一位小数，`fields` 使用 Set 去重
- `thisYear` 使用 `now.getFullYear()`——注入 `now` 参数使测试可预测
- `waiting`/`nowLearning` 分别计数——与计划一致

### 3.6 `materials.ts` 展示层

- 格式函数：`formatMinutes` 正确处理 `45m` / `2h` / `2h30m`；`formatPages` 输出 `12pp`（书目学缩写，有 editorial 气质）
- `monthsAgo`：正确处理月边界（`now.getDate() < d.getDate()` 时减 1）
- `silentMonthsSince`：`updated` 如果存在且晚于 `date`，则使用 `updated`——正确推迟"还想学吗"提示

### 3.7 `url.ts`

- `href()`：base 感知，移除末尾斜杠。注意：`href('/atlas/')` 返回 `/i-ve-learned/atlas`（去掉末尾斜杠）。GitHub Pages 处理 `/atlas` 和 `/atlas/` 都正确，但语义上传递 `/atlas/` 却得到 `/atlas` 可能令人困惑。
- `slugify()`：支持中文保留（`\u4e00-\u9fff`），`&` → 空格（"OS & Kernel" → "os-kernel"）
- 整体设计良好：一次 base 配置，全站链接一致

### 3.8 `category-tree.ts`

- 结构跟随注册表，计数正确
- `findCategory` 返回 `defNote`（顶层分类的描述）——用于分类页副标题
- `buildTagIndex` 聚合标签 → 条目列表

### 3.9 `timeline.ts`

- `groupByMonth`：年 → 月倒序，月内日期倒序，`getLearned` 已排序但双保险
- `activityByDay`：生成连续日期序列，`start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)`——含当月共 N 个月。正确。

---

## 4. Atlas 渲染器（`src/components/atlas/renderer.ts`）★ 签名代码

~590 行，零依赖 Canvas 2D 渲染器，实现精致。

### 4.1 架构

- `AtlasRenderer` 类管理：相机、交互状态机、LOD、入场动画、hover/select
- 事件驱动重绘（`requestDraw` → `requestAnimationFrame`），无持续 rAF 循环
- `destroy()` 清理所有事件监听器，适合 SPA 场景（但本站无 SPA）

### 4.2 交互状态机

- 拖拽/滚轮/双指捏合 —— 完整实现
- 拖拽检测：`dragMoved = Math.abs(dx) + Math.abs(dy) > 2`——2px 死区，防止点击误触
- 捏合：以双指中点为锚缩放，`pinchStart` 跟踪距离比
- 滚轮：`Math.exp(-deltaY * 0.0016)`——指数缩放，手感自然

### 4.3 几何正确性

- `worldToScreen`：`(x - cam.x) * zoom + width/2`——正确
- `zoomAt`：`cam.x = cx + px/zoomOld - px/zoomNew`——保持指针下的世界点不动，正确
- `hitTest`：世界坐标距离，命中半径 = `nodeRadius + 5/zoom`（触控容差）
- `screenRadius`：`max(0.9, min(2.2, 0.75 + zoom * 0.6))`——部分缩放补偿，防止节点在远距时过度缩小

### 4.4 视觉

- 纸面墨点：3 档墨色（`ink`/`inkMid`/`inkFaint`）+ 唯一强调色 `accent`
- 状态编码：实心(done) / 半填(learning) / 空心(todo) —— 与图例一致
- 顶层分类：靶心（环 + 中点）；子分类：菱形
- 选中环：强调色
- 入场动画：`easeOutCubic`，900ms，节点从中心散开。`sessionStorage` 控制每会话一次
- `prefers-reduced-motion` 跳过入场

### 4.5 边缘情况

- 空图：`maxX === 0 && maxY === 0` → `fitToViewport` 直接返回
- `withAlpha` 假设 `#rrggbb` 格式——CSS tokens 为 hex，安全
- `letterSpacing` 类型强制转换——`CanvasRenderingContext2D & { letterSpacing: string }`，运行时检查 `"letterSpacing" in this.ctx`。Chrome 支持，Firefox 可能不支持（该属性在 Canvas 2D 上下文上非标准）。`letterSpacing` 仅用于顶层分类标签的大写间距，缺失时视觉影响轻微。

### 4.6 性能

- `draw()` 在 `links` 循环中使用 `graph.nodes.find` —— O(E × N)。目标规模 ≤500 节点，无压力。
- 无脏矩形优化——全量重绘。Canvas 2D 在 ≤500 节点时完全足够。
- 渲染器 gzip ≈ 2KB（预算 250KB）

### 4.7 小问题

- `fitToViewport` 设置 zoom 时不应用 `[0.12, 6]` 钳位——如果未来图规模大幅增长，fit 可能产生低于 0.12 的 zoom。轮子缩放会钳位，但初始 fit 不会。
- `onResize` 在 `userAdjusted=false` 时重新 fit——手机旋转后用户调整标记保留，但视口宽高比变化显著时旧视角可能不佳。合理权衡。

---

## 5. 页面（`src/pages/`）

### 5.1 `index.astro`（时间线首页）

- 完整实现计划 §3.1 的线框图：自述 → 数据行 → 热力带 → 筛选 chips → 年份锚点 → 分组时间线
- `years.length === 0` 空状态文案
- Script 加载：`load` 事件后动态 `import('../scripts/timeline-enhance')`——首屏零阻塞 JS
- 注意：`<script>` 在 Astro 中默认 `is:inline`——该脚本所有页面加载。但 load 后再动态 import 仅触发增强，首屏阻塞 JS 预算为 3KB。

### 5.2 `atlas.astro`（星图）

- 完整实现：Canvas + noscript 降级 + 文本投影链接 + 图例 + 控制开关 + 详情侧栏
- `IntersectionObserver` 滚入视口后 boot——首屏零交互 JS
- `boot()` 并行 `Promise.all` 加载渲染器和 `graph.json`
- `sessionStorage` 标记入场动画已播放
- `esc()` 函数正确转义 HTML 实体——用于 `innerHTML` 赋值
- `slugify()` 在页面内联复制——与 `src/lib/url.ts` 同源，但副本。如果未来修改库函数，需同步更新此处。推荐提取为共享模块（但 Astro 的客户端 script 不能直接 import 服务端模块——这是已知限制）。
- 详情面板：`innerHTML` 使用 `esc()` 转义所有用户内容——XSS 安全
- 控制开关：`change` 事件与 `renderer.setTagLinksVisible`/`setLearnedOnly` 连接

### 5.3 `backlog.astro`（待学清单）

- 完整实现：统计行、正在学置顶（琥珀色呼吸点 + 左边框）、分类分组、防腐烂"还想学吗"、空状态
- `oldestLabel` 使用 `agoLabel(...).replace(" ago", "")`——生成 "5 months" 而非 "5 months ago"，符合计划
- `isStale()` 使用 `silentMonthsSince`——`updated` 可推迟过期
- `pulse` 动画：`prefers-reduced-motion` 跳过
- `groups` 按 `TOP_ORDER` 顺序——与注册表一致

### 5.4 `m/[slug].astro`（材料详情页）

- `getStaticPaths` 合并 learned + backlog——晋升不改变 URL
- 关联条目评分：同分类 +2，同路径 +3，共享标签 +1，取 top 4
- 等待时间：`monthsAgo(data.added, data.date)`——以学习日期为 now，计算 added 到 learned 的月数
- 侧栏：`data.rating` 用 ★ 展示，`data.source` 展示
- 注意：`{monthLabel(data.date) && ''}` 第 102 行——始终渲染空字符串，属于死代码。建议清理。

### 5.5 `category/[...path].astro` 与 `category/index.astro`

- 面包屑、子分类网格、计数、条目列表——完整实现
- `getStaticPaths` 从注册表派生——slugify 转换 URL 段，页面侧反查注册表还原显示名
- `category/index.astro` 是星图的文本投影——`aria-label` 在 atlas.astro 中引用

### 5.6 `tags/[tag].astro`

- 标签从内容派生，无注册表——`getStaticPaths` 扫描所有条目

### 5.7 `og/[...route].ts`（OG 卡片）

- 使用 `astro-og-canvas`，纸感风格（`bgGradient: [[250, 248, 244]]`，墨色标题）
- 字体使用本地 fontsource woff2——构建期无网络依赖
- ⚠️ **`pages.index` 覆盖**：第 23 行 `pages.index = { ... }` 在 `Object.fromEntries(...)` 之后执行。如果存在 slug 为 `index` 的材料（如 `content/learned/index.md`），其 OG 卡片会被站点默认卡片静默覆盖。低概率，但建议使用唯一键（如 `_site`）或先检查冲突。

### 5.8 `search-index.json.ts` 与 `graph.json.ts`

- 干净、简洁的 API 路由
- `graph.json.ts` 链式调用 `applyLayout(buildGraph(...))`——正确

---

## 6. 脚本与 XSS 审计

### 6.1 `timeline-enhance.ts`

- 筛选 chips 揭示与点击过滤：`entry.hidden = !ok`——无 innerHTML，安全
- 滚动 reveal：`IntersectionObserver` + class 切换
- `FilterState` 类型：`kind` 从 `data-kind` 属性提取，`state[kind as keyof FilterState]` 转型——`data-kind` 由 Astro 组件设置为 `"type"` 或 `"cat"`，实际安全
- 代码质量好，渐进增强设计正确

### 6.2 `command-palette.ts` ★ XSS 焦点

**HTML 模板构建**：`renderResults()` 使用字符串拼接构建 HTML：

```ts
html += `<li><a class="item${active}" data-idx="${idx}" href="${withBase(item.href)}">${safe}</a></li>`;
```

- `safe = escapeHtml(item.label)` —— ✅ 标签已转义
- `active` 来自 `idx === activeIndex` —— 布尔值，安全
- `idx` 数字，安全
- ⚠️ **`href` 未转义**：`withBase(item.href)` 返回 `base + path`。`item.href` 来自 `search-index.json`，由 slug 派生。如果 filename 包含 `"`（Linux 允许），则 `href` 中的 `"` 会闭合属性。这是低风险（单用户站点，仅作者创建文件），但防御性编程应转义 href。

**修复建议**：将 `escapeHtml()` 也应用于 href：

```ts
const safeHref = escapeHtml(withBase(item.href));
html += `... href="${safeHref}">${safe}</a>`;
```

**其他检查**：
- `escapeHtml` 函数正确转义 `&<>"'`——✅
- 键盘事件处理正确——✅
- `ensurePalette` 的 fetch 未处理失败——⚠️ 如果网络请求失败，`.catch` 缺失，palette 永久阻塞。`Base.astro` 的 keydown 处理器中 `import(...).then(...)` 无 catch：

```ts
// Base.astro line 58-62
import("../scripts/command-palette").then(async (mod) => {
  palette = mod;
  await mod.ensurePalette();
  mod.openPalette();
});
// ^ no .catch!
```

**修复建议**：添加 `.catch(err => { loading = false; console.error('[palette]', err); })`。

### 6.3 `Base.astro` 内联脚本（⌘K 触发器）

- 首屏零成本，首次按键才加载
- `loading` 标志防止重复加载
- `Escape` 关闭面板——但前提是 `palette` 非 null。如果加载失败，`palette` 保持 null，`loading` 保持 true，⌘K 永久失效。见上一条。

### 6.4 `atlas.astro` 内联脚本

- `esc()` 函数用于所有 innerHTML 插入——✅
- `catUrl` 通过 `slugify()` 构建，slugify 输出仅 `[a-z0-9\u4e00-\u9fff-]`——安全
- `encodeURIComponent(node.slug)` 用于 URL——`"` 被编码为 `%22`，无法突破双引号属性

---

## 7. 组件（`src/components/`）

### 7.1 `FilterChips.astro`

- `hidden` 初始隐藏，渐进增强揭示
- `role="group"` 和 `aria-label`——a11y 正确
- chips 为 `<button>` 元素——键盘可聚焦
- 计数在 `data-*` 属性中，由 JS 读取

### 7.2 `HeatBand.astro`

- 零 JS 渐进增强：纯 CSS + 原生 `title` 属性
- 浓度分级：`level()` 使用 `ceil(count / maxCount * 4)`——至少为 1 时返回 1–4，0 时返回 0
- 5 级墨色：`transparent` / `18%` / `34%` / `58%` / `82%`
- `role="img"` 和 `aria-label`——屏幕阅读器可识别
- 月份标签：`MONTH_NAMES` 前三位缩写

### 7.3 `TimelineEntry.astro`

- CSS Grid 布局：`grid-template-columns: 3.25rem 1rem 1fr auto`——日期 | 墨点 | 标题 | 类型
- 发丝线分隔：`entry + entry { border-top: 1px solid var(--color-line) }`
- 响应式：`.type` 在移动端隐藏（`display: none`，640px 以上显示）
- description 随行，`max-width: 38rem`——行宽控制
- 标签使用 `data-type`/`data-cat` 供筛选脚本读取

### 7.4 `SiteHeader.astro` 与 `SiteFooter.astro`

- `isActive` 正确识别当前页面，设置 `aria-current="page"`
- 导航标签：Timeline / Atlas / Backlog —— 英文，与计划一致
- 导航项 hover/active/focus 三态齐全
- `⌘K` 提示在导航栏右侧，`hidden sm:block`——移动端隐藏
- Footer colophon："Two directories of markdown · built with Astro"——工程师彩蛋

---

## 8. 测试

### 8.1 单元测试（6 文件，43 用例）✅

- `graph.test.ts`（10 用例）：布局确定性、增量稳定性、几何约束（位置区间、子分类间距、中心环带）——覆盖面广
- `schema.test.ts`（11 用例）：必填字段、默认值、越界、未注册分类、非法类型、URL 校验——完整
- `stats.test.ts`（5 用例）：计数、时长、年份过滤、now/waiting 分离、fields 去重
- `timeline.test.ts`（4 用例）：分组顺序、空输入、连续日期序列
- `categories.test.ts`（7 用例）：分类路径校验（接受/拒绝边界完整）
- `category-tree.test.ts`（6 用例）：树结构计数、无分类条目、标签聚合、findCategory

### 8.2 E2E 测试（7 冒烟）✅ 修复后全通过

- 覆盖访客主路径：落地 → 筛选 → 详情 → 星图 → 待学 → ⌘K → 无 JS 降级
- 星图测试：等待 Canvas 有像素渲染（非零检测），产出 CI 截图 artifact
- 无 JS 测试：`{ javaScriptEnabled: false }` 上下文，验证条目链接 ≥ 20

### 8.3 测试质量评估

- 布局几何测试钉住了增量稳定性——这是计划 §3.2 的关键验收项
- 无 snapshot 测试——`toEqual` 深度比较 `applyLayout` 输出，等价于 snapshot
- 缺少渲染器测试（Canvas 2D 需要模拟浏览器环境，合理）
- 缺少 budgets.sh 的 CI 集成测试

---

## 9. 基础设施

### 9.1 `astro.config.mjs`

- `site: 'https://example.github.io'` —— 占位符，文档已标注需修改
- `base: '/i-ve-learned'` —— 与 GitHub Pages project site 一致
- `trailingSlash: 'never'` —— 构建输出为目录式 `index.html`，部署后 `/atlas` 和 `/atlas/` 均可访问
- `cssMinify: 'esbuild'` —— 规避 Tailwind v4 + LightningCSS 的 OKLCH 改写问题
- Shiki theme `min-light` —— 低饱和，匹配纸感设计

### 9.2 `scripts/budgets.sh`

- 6 项预算，覆盖阻塞 JS、延迟包、索引、HTML 体积
- 当前：全部低于预算，且裕量充足（渲染器 2KB vs 250KB、⌘K 6KB vs 60KB）
- 注意：`gzip -c` 性能——在 CI 中可接受（构建后运行）
- 首屏阻塞 JS 检测：排除异步加载的脚本（排除 `command-palette*`、`renderer*`、`timeline-enhance*`、`preload-helper*`）——正确

### 9.3 CI 工作流

- `ci.yml`：lint → check → build → test → budgets → e2e → artifacts
- `deploy.yml`：build → budgets → upload-pages-artifact → deploy-pages
- 部署前也运行 budgets.sh —— 防止带病上线
- 截图 artifact 条件上传（`if: always()`）——即使 e2e 失败也保留
- Playwright report 仅失败时上传

### 9.4 `package.json`

- `engines: { node: ">=22.12.0" }` —— 正确
- `allowScripts: { esbuild: true }` —— 必要
- 依赖版本范围合理，zod v4、astro v7、tailwindcss v4.3.3

### 9.5 `playwright.config.ts`

- `baseURL: "http://localhost:4322/i-ve-learned/"` —— 正确
- `webServer` 自动拉起 preview，`reuseExistingServer` 在 CI 外重用

---

## 10. 内容

### 10.1 Demo 条目

- 全部正确标记 `demo: true`，页面上有"示例"角标
- 23 条 learned + 8 条 backlog = 31 条 demo 条目，内容来源于真实技术笔记但标注 demo
- 部分条目含真实笔记内容（如 raft-paper 含 Figure 8 笔记）——上线前需替换为真实学习记录

### 10.2 模板文件

- `_template.md` 在两个目录中，注释清晰，含完整字段说明
- 字段说明指向计划文档 §2.2——维护方便
- 模板排除模式 `**/[^_]*.md` 正确排除 `_template.md`

### 10.3 缺失字段

- 部分 demo 条目缺少 `category`（如 `but-what-is-a-neural-network.md`、`flash-attention.md`）——这些条目会出现在中心环（无分类），星图布局中坐标正确，但可能不是作者的意图。上线前回填真实内容时需注意。

---

## 11. 反 AI 套路 Checklist（§4.4）评估

| 检查项 | 状态 | 备注 |
|---|---|---|
| 无 Inter 主字体；无蓝/靛/紫主色；渐变 ≤1 处 | ✅ | Source Serif 4 + 思源宋体；唯一强调色琥珀（#ab550c）；渐变仅 1 处（⌘K 面板 backdrop-filter） |
| 无玻璃拟态、无三列等宽卡片、无居中 hero + eyebrow | ✅ | 布局为列表/时间线/星图，无上述模式 |
| 动效全局一条缓动曲线；无 `transition-all 300ms ease-in-out` | ✅ | `--ease-snap: cubic-bezier(0.2,0.8,0.2,1)`；所有 transition 使用该曲线 |
| 每个可交互元素 hover/active/focus 三态 | ✅ | 导航、chips、标签、链接全部三态 |
| 图谱关掉动画仍可读可导航；每个效果回答"它帮我理解了什么" | ✅ | reduced-motion 跳过入场；状态编码（实/半/空心）和 LOD 有明确语义，无纯装饰效果 |
| 无 JS 时核心内容可读 | ✅ | 时间线/待学/详情/分类/标签全部静态 HTML；星图页有 noscript 文本投影 |
| 文案无空话；全站有至少一处"只有这个站才有"的东西 | ✅ | 晋升仪式（`git mv` 不改链接）、星图状态编码、诚实的"还想学吗"提示 |

**反 AI 套路门禁：通过** ✅

---

## 12. 与计划文档的偏差

1. **内容排除口径**（决策 #6 记录在案）：计划原定 `demo` 条目排除出图谱，实施修正为"demo 条目进图谱与统计 + 上线前整体移除"。代码与修正后一致。`builder.ts` 头部注释未同步更新。

2. **⌘K 范围切割**（计划 §3.6）："面板只做导航与查找，全文检索留 V1.1"——实施正确。

3. **LOD 完整分级**（计划 §3.2）：实施为三级（顶层/子分类/材料标签），但材料标签的 LOD 阈值 `materialLabel: 1.18` 在 zoom 0.42 时不显示——需要更深缩放才出现。这是设计选择，但计划提到"远景只见分类标签 → 中景见节点群 → 近景见材料名"，实施与之一致。

4. **无分类条目处理**：计划未明确说明，实施为"中心环带"。合理。

5. **trailing slash** 计划未明确说明，实施为 `trailingSlash: 'never'`。`href()` 函数移除了所有尾部斜杠，与 Astro 配置一致。

---

## 13. 建议与后续工作

### 必须修复（上线前）

- [ ] 更新 `builder.ts` 头部注释（"demo 条目排除" → "demo 条目正常进图谱"）
- [ ] 设置 `astro.config.mjs` 的 `site` 为真实 GitHub Pages URL

### 建议修复

- [ ] `command-palette.ts`：添加 `escapeHtml` 应用于 href
- [ ] `Base.astro` 的 ⌘K 加载器：添加 `.catch` 处理
- [ ] 清理 `m/[slug].astro` 第 102 行的死代码
- [ ] `og/[...route].ts`：使用唯一键（如 `_site`）而非 `index` 避免与材料 slug 冲突
- [ ] 考虑将 `slugify` 函数从 `atlas.astro` 内联脚本提取（但受限于 Astro 脚本隔离，可接受当前状态）

### V1.1 候选

- `renderer.ts` 的 `letterSpacing` 在 Firefox 上的兼容性验证
- 布局几何的子分类间距余量评估（当前 164px vs 160px 阈值，仅 3% 余量）
- 笔记全文搜索（Pagefind，计划已切割）

---

## 14. 总结

| 维度 | 评级 |
|---|---|
| 架构与计划一致性 | ★★★★★ |
| 代码质量与可维护性 | ★★★★★ |
| 测试覆盖与质量 | ★★★★☆ |
| 布局几何数学正确性 | ★★★★★ |
| 安全性（XSS 防御） | ★★★★☆ |
| 渐进增强与无 JS 降级 | ★★★★★ |
| 可访问性 | ★★★★☆ |
| 性能预算 | ★★★★★ |
| 内容模板 | ★★★★★ |

**总体评价**：高质量实现，架构清晰，与计划文档高度一致。发现 2 个阻塞缺陷（均已在审查中修复）和若干中低风险建议。星图渲染器（~590 行零依赖 Canvas 2D）是签名代码，实施精致。项目已准备好进入真实内容回填和上线部署阶段。