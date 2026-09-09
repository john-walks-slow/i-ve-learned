# 审查报告：260909-inline-notes 时间线交互改版

> 审查日期：2026-09-09
> 审查范围：工作树未提交 diff（49 文件，+151/-78；`git status` / `git diff` 可见全部）
> 审查者：reviewer 子代理（独立审查，门禁与浏览器行为均亲自复跑）

---

## 1. 执行摘要

**结论：可交付。** 7 条需求全部落地，无阻塞缺陷。发现 **2 个建议提交前处理的 P2**（验证文档与实现不一致会导致用户验收误判；MiniSearch id 唯一性隐患会在未来真实内容下炸掉整个 ⌘K 面板）和若干 P3 跟进项。

改动质量整体高：schema 改名干净彻底、hasBody 判定语义正确、atlas 面板模板转义完备、palette 直通逻辑正确、line-clamp 降级安全。demo 内容 30 文件的 `description → comment` 机械改名经全量 grep 验证无遗漏。

---

## 2. 质量门禁（审查者亲自复跑，直接退出码）

| 门禁 | 结果 |
|---|---|
| `npx biome check src tests` | ✅ 0 问题 |
| `npx astro check` | ✅ 0 errors / 0 warnings / 2 hints（均在 `HeatBand.astro`，本 diff 未触碰，预存） |
| `npx vitest run` | ✅ 6 文件 43/43 |
| `npm run build` | ✅ 118 页，7.26s |
| `bash scripts/budgets.sh` | ✅ 6/6（搜索索引 gzip 4KB/100KB，最大单页 68KB/80KB） |
| `npx playwright test` | ✅ 7/7（10.0s） |

---

## 3. 需求逐条对照

| # | 需求 | 结论 | 证据 |
|---|---|---|---|
| 1 | 移除时间线"墨点"装饰 | ✅ | `.dot` span 与 CSS 全删；grid 从 4 列改 3 列（`3.25rem 1fr auto`），gap 0.5→1rem；浏览器截图确认对齐自然 |
| 2 | 标题外链优先（新标签页），无原文落回 `/m/[slug]` | ✅ | TimelineEntry / MaterialRow / backlog 三处标题均 `url ?? /m/slug/`，外链带 `target="_blank" rel="noopener noreferrer"`；实测 raft 标题 → raft.github.io，reading-time-cli（无 url）→ 本站详情页 |
| 3 | description → comment，列表页随行 + 有正文两行截断 | ✅ | schema/内容/模板全链路改名；comment 斜体随行；`hasBody` 时挂 `.clamp`；无正文不截断（无详情可展开，逻辑自洽） |
| 4 | 有正文显示 note →；详情页保留 + comment 题记 - rating | ✅ | note → 链接进 `/m/[slug]`；详情页新增 `.lead` 题记；rating 展示已删（但字段本身保留，见 P3-1） |
| 5 | ⌘K：材料条目外链优先、关键词加 comment、withBase 直通 http(s) | ✅ | `href: m.url ?? /m/${slug}/`；`k` 追加 `m.comment`；`withBase` 加 `^https?:\/\//` 直通。实测搜 "raft" 3 项命中（含 b-tree 短评），外链 href 无 base 前缀；CJK "第二个"、ASCII "hexdump" 均经短评命中 |
| 6 | Atlas 面板：标题可点 + open source ↗ + note → 双链接；graph.json 加 url/hasBody | ✅ | 实测 raft-paper 节点（标题外链 + open source ↗ + note →）与 b-tree 节点（无 url：标题为 span + 仅 note →）两形态均正确；graph.json 30 材料节点带两字段 |
| 7 | backlog 三处标题外链优先；now learning 加 title 提示 | ✅* | 三处 h3（now learning / 分组 / unsorted）均外链优先；**首页** "now: 1" 加了 `title="backlog 中标记 status: learning 的条目"`（与 stats.ts 口径一致）；但 backlog 页 "now learning" 区块标题**没有** title——见 P2-1，验证文档因此会验收失败 |

---

## 4. 重点审查项

### 4.1 schema 改名完整性 ✅

- `grep -rn "description" src/`：残留引用全部属于 `Base.astro` 的 meta-description prop（不同概念，正确接收 `data.comment`）与 `og/[...route].ts` 的 OG description 结构。
- `grep "^description:" content/`：0 残留，30 个内容文件 + 2 个模板全部改名。
- 旧文档 `docs/features/260908-site-v1/` 中的 `description` 是 V1 历史记录，不改是对的。
- `astro check` 0 错误佐证类型层无漏改。

### 4.2 hasBody 判定 ✅

`Boolean(entry.body && entry.body.trim().length > 0)`——Astro content collections 的 `entry.body` 是 frontmatter 之后的原始 markdown 字符串，纯空白文件正确判 false。demo 数据 30 条全部有正文（hasBody 恒 true），false 分支仅由单测夹具覆盖（见 P3-2 覆盖缺口）。边界：正文只含 HTML 注释会判 true、点进详情页看不到东西——可接受的语义边界。

### 4.3 XSS（atlas 面板新模板）✅（含一个低危残留）

`esc()` 覆盖 `& < > " '`，`href="${esc(node.url)}"` 无法属性逃逸；`esc(node.label)`、status/type/date 同样全转义。**面板模板无注入路径。**

低危残留（P3-3）：`z.url()`（zod 4.5.4，已实测）接受 `javascript:` / `data:` scheme。palette 因 `withBase` 的 `^https?://` 门天然免疫；但 Astro 渲染的标题链接、atlas 面板 href、详情页"读原文"均无 scheme 门。单作者内容库 = 自伤模型，风险低；schema 一行 `.refine(u => /^https?:\/\//.test(u))` 可整类关闭。

### 4.4 palette 外链直通 ✅（含两个边界 + 一个隐患）

- 直通正则正确，实测渲染出的 `<a href="https://raft.github.io/raft.pdf">` 无 base 前缀。
- 边界 1：大写 `HTTPS://` 能过 `z.url()` 但过不了大小写敏感的直通正则 → 被拼上 base 变死链。
- 边界 2：协议相对 `//x.com` 能过 `z.url()`，同样被误当路径拼 base。
- 隐患：见 P2-2（MiniSearch id 冲突）。
- 行为一致性：palette Enter / 点击均在**当前标签页**跳转（`window.location.assign` + 无 target 的 `<a>`），与列表页标题的新标签页策略不同——本身是常见 palette 惯例，但验证文档写了相反预期，见 P2-1。

### 4.5 CSS line-clamp 降级 ✅

`display:-webkit-box` + `-webkit-line-clamp:2` + `overflow:hidden`：`-webkit-` 前缀在全部主流浏览器可用（已标准化）；不支持的远古浏览器回落为 display:block + 不截断（高度 auto，全文可见）——降级方向正确（宁多显示不丢内容）。无需 `@supports`。构建产物确认规则存在且 scoped 正确：外联 CSS 里 `.clamp[data-astro-cid-m6o4rvv2]`（TimelineEntry），MaterialRow 的同名规则以内联 `<style>` 进 tags/category 页（`.clamp[data-astro-cid-obkubpmy]`）——两处都验证到位，非只有一份。

### 4.6 e2e / 单测夹具 ✅（含断言弱化提醒）

- 4 个单测夹具统一加 `hasBody: false` 满足必填字段，类型完整（astro check 佐证）。
- e2e palette 断言从精确 `toHaveCount(2)` 弱化为 `>= 2`：实际命中 3（raft-paper + b-tree-visualization 经短评 + #raft tag 页）。弱化让"comment 进索引"这一新特性失去了锁定断言——建议改回精确 3 或显式断言 b-tree 条目命中（P3-4）。
- "无 JS 降级"测试 `article a[href*='/m/'] >= 20` 现在靠 22 个 note → 链接撑住（demo 全有正文）；真实内容回填后若无正文条目变多，计数可能跌破 20——语义已从"标题可达详情页"漂移为"note 链接存在"（P3-4）。

---

## 5. 发现的问题

### P2-1 验证文档两处预期与实现不符（用户验收会误判失败）

`docs/features/260909-inline-notes/260909-inline-notes.validation.md`：

1. **第 18 行（验证项 6）**："回车**新标签页**打开原文"。实际 palette 是当前标签页跳转（`gotoActive` 用 `window.location.assign`，渲染的 `<a>` 无 target）。需求原文只要求"withBase 对 http(s) 直通"，实现符合需求——要么改文档预期为"当前页跳转"，要么决定 palette 外链也开新标签（`gotoActive` 改 `window.open`、模板加 target），二选一。
2. **第 21 行（验证项 9）**："悬停首页 now: 1 **与 backlog 页 now learning 标题**"都浮出提示。backlog 页 `now learning` 的 `<h2>`（backlog.astro:61-63）**没有** title 属性，只有首页链接有。要么补上（一行），要么改文档。

两处都是"用户按表验收会打叉"的文档/实现偏差，提交前应消除。

### P2-2 MiniSearch `idField: "href"` 唯一性假设被外链 href 打破（潜在运行时崩溃）

改动前 href 恒为 `/m/${slug}/`（天然唯一）；现在材料条目 href = 原文 URL。**两个条目共享同一原文 URL 时**（真实内容完全可能：同一本书按章节记两条，demo 里 `ddia-ch5-9` 的 url 就是整本书的 `dataintensive.net`），`ensurePalette()` 内 `miniSearch.addAll(items)` 会抛 `MiniSearch: duplicate ID`（已在项目依赖 minisearch@7.2.0 上实测确认是**抛异常**而非静默丢弃）。异常发生在 ⌘K 按键的动态 import 链里 → 面板整体打不开，且无 UI 反馈。

当前 demo 数据无重复 URL（已验证 27 个外链 href 无重复），故门禁全绿——这是"回填真实内容才引爆"的定时炸弹。修法一行：索引条目加 `slug` 字段并 `idField: "slug"`（slug 恒唯一），或对 href 冲突做去重拼接。CJK 子串路径（`items.filter`）不受影响，但两条路径行为不一致本身就是症状。

### P3-1 rating 成为死字段

需求只说"移除展示"，schema 保留 `rating` 字段本身合规；但 22 个 learned demo 文件仍全部带 rating 值，全站已零消费方。本次已逐文件改过 frontmatter，正是顺手清理（或删字段或删数据）的时机；若有意保留待将来用，建议在 schema 注释标明，避免回填真实内容时困惑"这字段有什么用"。

### P3-2 新交互零自动化覆盖

atlas 面板双链接是本次唯一手写 innerHTML 模板的高风险代码，e2e 只测了 canvas 有像素；标题外链 target=_blank、note → 链接、comment 展示/clamp、hasBody=false 分支（无 note →、不截断）均无断言。建议 e2e 补：① 点击 atlas 节点后面板含两个链接且 href 正确（可复用本次审查的坐标计算法，或按 graph.json 节点坐标换算）；② 时间线首条标题 `target="_blank"` + note → href 断言。

### P3-3 z.url() 无 scheme 门 + withBase 正则两个边界

见 4.3 / 4.4。低危，但 schema 加 `^https?://` refine 可同时关闭三处暴露面和两个直通边界（正则顺便 `i` flag 或先 lowercase）。

### P3-4 e2e 断言弱化与语义漂移

见 4.6。建议：raft 断言改精确 3（锁住 comment 索引特性）；"无 JS 降级"改为断言"每条 entry 至少有一个可达详情页的链接（标题或 note →）"而非裸计数。

### P3-5 有 url 无 body 条目的详情页成为 UI 孤岛

标题外链 + 无 note → + palette 也外链 ⇒ 该条目的 `/m/[slug]` 详情页在全站 UI 无入口（仍被 sitemap / 其他页 related 链接 / 直接 URL 可达）。"无正文 = 没什么可看"在产品上说得通，但详情页仍会渲染（题记、面包屑、related）。知悉即可；若在意，可给这类条目的 meta 行也挂一个不显眼的详情链接。

### P3-6 `.comment` / `.clamp` / `.note-link` 样式在两个组件各写一份

scoped style 的固有代价，量小（各 ~12 行），可接受；若再扩散到第三处再抽公共层。

---

## 6. 实测记录（审查者执行）

**静态产物（dist/）**：

- `graph.json`：30 材料节点全带 `url` / `hasBody`；无 url 的 3 条 = reading-time-cli、git-rebase-onto、b-tree-visualization（与内容一致）。
- `search-index.json`：100 条目，27 外链 href，无重复；`k` 含 comment。
- `index.html`：无 `.dot`；外链标题带 target/rel；22 个 note →；clamp class 正确挂载。
- OG：31 张 PNG 正常生成（comment 作为卡片描述，链路同旧 description）。

**浏览器（preview 4322，camoufox）**：

- 时间线截图：无墨点，日期/标题/短评/meta/类型列对齐正常。
- Atlas：点击 raft-paper 节点 → 面板 = 标题外链 + `open source ↗` + `note →`；点击 b-tree 节点 → 标题为 span + 仅 `note →`。均与 graph.json 字段一一对应。
- ⌘K：搜 "raft" → 3 项，首项 Raft（label boost），外链 href 直通无 base 前缀；搜 "第二个"（CJK）命中 b-tree 短评；搜 "hexdump" 命中 sqlite-btree 短评。
- Escape 关闭面板正常。

**库行为验证**：zod 4.5.4 `z.url()` 接受 `javascript:`/`data:`（P3-3 依据）；minisearch 7.2.0 `addAll` 重复 id 抛异常（P2-2 依据）。

---

## 7. 结论

实现忠于 7 条需求，改名干净，模板转义完备，实测交互全部符合预期。**建议：处理 P2-1（对齐验证文档与实现，二选一各一行）与 P2-2（idField 改 slug，防真实内容回填后 ⌘K 崩溃）后提交**；P3 项可开 backlog 跟进。
