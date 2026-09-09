# 260909-inline-notes 交付总结

> 交付日期：2026-09-09
> 计划依据：用户反馈 4 条 + 追加修订 1 条（"详情页保留，description→comment，有正文则 note → 进详情"）
> 审查：`260909-inline-notes.review.md`（可交付，2 P2 已修，3 P3 采纳）
> 用户验证：`260909-inline-notes.validation.md`

## 需求与落地

| # | 用户反馈 | 落地 |
|---|---|---|
| 1 | 日期与标题之间的墨点突兀 | 移除 dot 装饰与分隔列；grid 3.25rem + 1fr，日期直邻标题 |
| 2 | 标题超链到原材料 | `item.url ?? /m/[slug]`；外链 `target=_blank rel=noopener`；时间线/分类/标签/待学四列表一致 |
| 3 | description 改为 comment（个人短评） | schema/接口/30 个 demo/模板全量改名；列表随行（italic 衬线） |
| 4 | 有正文 → note → 按钮 | `hasBody = entry.body 非空`；comment 两行 CSS 截断 + `note →`（琥珀色） |
| 5 | 不要 rating | 详情页移除展示；schema/content/23 个 demo 文件全量删除该字段 |
| 6 | now learning 怎么判定 | = backlog frontmatter `status: learning` 的条目；首页 now: n 与 backlog 页标题加 title 悬停提示 |

连带改造：⌘K 材料条目外链优先（回车/点击新标签页打开）、comment 进搜索关键词（中文短评可搜）、Atlas 材料面板标题外链 + `open source ↗` + `note →` 双入口、graph.json 节点新增 `url/hasBody`。

## 审查后修复（P2）

1. MiniSearch `idField: "href"` → `"slug"`（两条目共享同一原文 URL 时 addAll 会抛 duplicate ID，⌘K 整体打不开——真实内容回填才引爆的隐患）
2. 验证文档预期与实现对齐（palette 外链新标签页、backlog now learning title）

## 审查采纳的 P3

- schema 删 rating 字段 + `url` 加 `^https?://` scheme 门（zod `z.url()` 接受 `javascript:`/`data:`，实测确认）+ 单测覆盖
- e2e 增加精确断言：搜 "Figure 8"（只出现在 Raft 短评）恰命中 1 条，锁住 comment 进索引的特性

未采纳 P3（记录在 review.md）：atlas 面板自动化覆盖、详情页孤岛边界（有 url 无 body 的条目详情页仍可达——正确行为）、组件样式重复。

## 质量门禁

biome 0 · astro check 0 错 · vitest 43/43 · build 118 页 · budgets 6/6（首屏 JS 3KB、HTML 68KB）· Playwright 7/7。浏览器实测：时间线视觉（无墨点、层级正常）、⌘K "Figure 8"→1 命中、外链 target=_blank、Atlas 面板双形态。

## 第二轮反馈（同日追加）

1. 首页标题 → 「学习记录」
2. 筛选只留分类一排（媒体类型 chips 与年份锚点移除；e2e 断言改 Systems 6/22）
3. ⌘K 徽章可鼠标点击（提取 openPalette() 共用；加 hover/focus 态；e2e 补点击路径）
4. 时间线 meta 首位 = 分类完整路径链接（dotted underline；无分类条目从用时开始）

门禁复核：biome 0 · astro check 0 · vitest 43 · build 118 · budgets 6 · e2e 7；浏览器双重视觉验证通过。

## 第三轮反馈（同日追加）

1. `noteType` frontmatter 字段（默认 note；translation/fulltext/自定义）驱动时间线按钮文案；按钮移到右列第二行（媒体类型下方），meta 行只留分类/用时/标签
2. 删除 "x/22 items" 计数行（FilterChips 去 summary + enhance 脚本同步）；空内容时 chips 不渲染
3. 首页删「学习记录」h1；chips 与列表间距收紧（year pt 2rem→1.25rem、hero pb 10→4）；空内容时统计行隐藏
4. 清空全部 30 个 demo 占位条目（保留 _template.md）——真实内容回填开始
   - 排障：Astro data store 缓存已删条目 → `rm -rf .astro node_modules/.astro` 后 118 页→28 页
   - e2e 重写为内容无关的空态冒烟（5 用例），回填真实内容后依然成立
   - ⌘K 默认列表/搜索行为已验证（atlas 精确命中 1）

门禁复核：biome 0 · astro check 0 · vitest 43 · build 28 页（空内容）· budgets 6 · e2e 5；临时条目实测 noteType 渲染 + 空态双重视觉验证。
