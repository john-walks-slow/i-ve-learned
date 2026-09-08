# What I've Learned 站点 V1 · 技术选型调研

> 调研日期：2026-09-08 · 状态：已完成，供设计/实施文档参考
> 范围：markdown 驱动内容站框架与工具链、知识图谱/时间线可视化、同类开源项目实现方式
> 方法：官方文档 + GitHub/npm registry（版本号均为 2026-09-08 实测）+ 社区横评文章交叉验证；对内容农场类来源（无法溯源的 SEO 对比文）仅采信能与官方信息互证的部分

---

## 0. 结论速览（TL;DR）

**推荐主栈：Astro 7 + TypeScript + Content Collections（Zod 校验）+ 客户端可视化孤岛**

| 层 | 推荐 | 一句话理由 |
|---|---|---|
| 站点框架 | **Astro 7.3** | 内容驱动站点的事实标准；零 JS 默认输出 + islands 架构；内置 markdown 目录加载器与 Zod frontmatter 校验；2026-01 团队加入 Cloudflare 后 MIT 开源不变、投入更强 |
| 内容管线 | Content Collections（`glob()` loader + Zod schema） | 两个目录（已学/待学）= 两个 collection；构建期校验 + 自动生成 TS 类型 + 编辑器 JSON Schema 补全 |
| 知识图谱 | **sigma.js v3 + graphology**（vanilla TS 孤岛）；备选 react-force-graph | WebGL 渲染上限高（数万节点）；graphology 提供布局/社区发现算法生态；构建期预计算布局坐标可避免"爆炸式"开场动画 |
| 思维导图 | **markmap** | markdown → mindmap 的原生转换，与"每个学习材料一个 md"的模型零成本契合 |
| 词云 | d3-cloud 或 echarts-wordcloud | 轻量、风格可完全自控 |
| 时间线首页 | 自绘 CSS Grid 时间线 + scroll 动效（CSS scroll-driven animations 或 GSAP ScrollTrigger，均已免费） | 个人学习时间线没有趁手的现成库，自绘反而是"高技术力"展示点，且保住零 JS 基线 |
| 站内搜索（可选） | Pagefind | 构建期索引、纯浏览器运行、零服务器 |
| 部署 | **Vercel 或 Cloudflare Pages**（PR 预览）+ GitHub Actions CI；GitHub Pages 作为纯 GitHub 免费备选 | 全静态产物，四家均可；差别在预览部署与生态契合度 |

**备选方案**（若求职方向需要突出特定生态）：
- React 方向：Next.js 16 静态导出 + **Velite**（Contentlayer 停维后的继任者）+ react-force-graph/@react-sigma
- Vue 方向：Nuxt 3 + **Nuxt Content 3**（SQL 存储 + Zod schema，能力对标 Astro collections）
- 极速上线：直接用 **Quartz v5**（数字花园全家桶，含图谱/反链/搜索），代价是"配置定制"多于"工程展示"

**明确不推荐**：Contentlayer（已停维）、Gatsby（生态收缩）、纯运行时拉取 markdown 渲染（SEO 与性能双输，理由见 §3.2）。

---

## 1. 需求约束回顾（选型即约束求解）

从项目背景中提炼出决定性约束：

1. **内容即文件**：每个学习材料一个 markdown，frontmatter 存元数据（标题/类型/时长/标签/分类），正文是笔记 → 必须有强大的 frontmatter 处理与**校验**能力
2. **两个内容目录**：已学 / 待学 → 天然映射为两个内容集合，需要按目录过滤/查询
3. **多级分类**：分类层级需要可靠建模（目录结构 or frontmatter 树形字段，见 §7）
4. **三个核心页面**：时间线首页、全量知识图谱页、待学清单页 → 图谱是唯一的重交互页，其余应保持轻量
5. **静态可部署**（GitHub Pages / Vercel 等）→ 产物必须是纯静态文件
6. **求职面试展示项目** → 技术栈要有现代性（islands、WebGL、类型安全）与工程性（CI、测试、质量门禁），且**能讲出权衡故事**
7. 体验关键词：简洁、高技术力、有新意

---

## 2. 站点框架层

### 2.1 候选全景（2026-09 现状）

| 框架 | 当前版本 | 定位 | 默认客户端 JS | frontmatter schema 校验 | 备注 |
|---|---|---|---|---|---|
| **Astro** | 7.3.1（npm 2026-09-03） | 内容驱动网站框架 | **零**（按需 island） | ✅ 内置（Zod） | 2026-01 团队加入 Cloudflare，保持 MIT、平台中立 |
| Next.js | 16.3.4 | 全栈 React 应用框架 | React 运行时 | ❌ 自建（Velite/MDX 手动） | 静态导出可用，但为内容站付出额外 JS 税 |
| Eleventy | 3.1.6（2026-07-01） | 极简 SSG | 零 | ❌（需第三方） | 最小产物、极稳；无组件模型、交互全 DIY |
| Nuxt + Nuxt Content | Content 3.16.0 | Vue 全栈 + 文件 CMS | 低 | ✅（Zod，`content.config.ts`） | v3 改为 SQL 存储，大规模查询更快 |
| Hugo | — | Go 编译型 SSG | 零 | ❌ | 构建最快、万页级无压力；Go 模板，扩展生态偏弱 |
| VitePress | 1.6.4（2026-09-04） | Vue 驱动文档站 | 低 | ❌ | 中文社区知识库常用（见 §5.5） |
| SvelteKit | — | Svelte 全栈 | 低 | ❌ | 组件体验好，但内容层无内建方案 |
| Quartz v5 | 13.2k★ | 数字花园专用 SSG | 低 | 部分（插件体系） | 开箱含图谱/反链/搜索，见 §5.1 |

**关键事实核对**（官方来源）：
- Astro 7.0（2026-06-22 发布）：Vite 8、新 Rust 编译器、Advanced Routing、后台 dev server、结构化日志，主打构建速度（[官方公告](https://astro.build/blog/astro-7)）。Astro 5（2024-12）引入 Content Layer API 与 `glob()`/`file()` loader；Astro 6（2026 初）将 live collections 转正并内置 CSP（[v5→v6 升级指南](https://docs.astro.build/en/guides/upgrade-to/v6)）。
- [Astro Technology Company 加入 Cloudflare](https://astro.build/blog/joining-cloudflare/)（2026-01-16，[Cloudflare 公告](https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/)）：Astro 保持开源、MIT、平台中立，仅团队入职；官方博客明确"content remains at the center"。周下载量近 100 万，Webflow/Wix/Microsoft/Google 在用。
- 社区共识与官方定位一致：**内容站默认选 Astro，应用才选 Next**；Next 静态导出比同站 Astro/Eleventy 产物重数倍，且 export 模式下 ISR、API 路由、默认图片优化等特性不可用（[Astro vs Next 对比](https://www.alphonsolabs.com/nextjs-vs-astro-for-blog/)、[SSG 横评](https://jwatte.com/blog/blog-ssg-comparison-2026/)）。
- **Contentlayer 已停维**（README 官方声明：缺乏资金停止维护，社区 fork 为 [contentlayer2](https://github.com/contentlayerdev/contentlayer)）——Next.js 生态"类型安全内容层"这一空缺目前由 [Velite](https://github.com/zce/velite)（0.4.0，2026-06 仍在更新，Zod schema 构建 Markdown/MDX/YAML/JSON → 类型安全数据层）等补位。

### 2.2 构建期解析 vs 运行时加载

内容型站点的三条技术路线：

| 路线 | 代表 | 优点 | 缺点 |
|---|---|---|---|
| **A. 构建期解析（SSG）** | Astro/11ty/Hugo/VitePress/Quartz | SEO 最佳（纯 HTML）；首屏快；免费托管简单；frontmatter 校验在 CI 拦截 | 内容变更需重新构建（个人站无感知，GitHub push 触发 Actions 即可） |
| **B. 运行时加载** | SPA fetch markdown / GitHub API 渲染 | 无构建步骤；数据"永远最新" | SEO 差（客户端渲染）；首屏白屏；API 限流/缓存问题；无法做构建期校验 |
| **C. 混合（推荐采用的变体）** | SSG 页面 + 构建期导出的 JSON 索引供客户端 island 消费 | 兼得 A 的 SEO 与交互页所需的数据访问 | 需要设计 JSON 产物契约 |

对本项目的结论：**路线 A 为主体，图谱页采用路线 C 的变体**——即所有内容页在构建期渲染为静态 HTML；同时构建期生成一份"图数据 JSON"（节点 = 材料 + 分类 + 标签，边 = 从属/引用关系），图谱 island 在浏览器拉取该 JSON 渲染。这正是 Quartz 的做法（构建期产出 `contentIndex.json`，图谱在客户端模拟）；Astro 也可以用 [endpoints](https://docs.astro.build/en/guides/endpoints/) 静态导出 JSON。进阶优化：**在构建期用 graphology + ForceAtlas2 预计算节点坐标**写入 JSON，前端拿到即渲染，省掉模拟收敛时间、避免"节点爆炸"开场（各库通用痛点，见 [force-graph 实践分析](https://starlog.is/articles/data-knowledge/vasturiano-force-graph) 的 warmup/cooldown 讨论）。

顺带说明：Astro 6+ 还提供 live content collections（请求时取数），但这要求 SSR/适配器，对纯静态个人站属于过度设计——官方也建议"能用 build-time 就用 build-time"（[Content Collections 文档](https://docs.astro.build/en/guides/content-collections/)）。

### 2.3 frontmatter schema 校验现状

这是本项目"工程性"的核心卖点之一，现状梳理：

1. **Astro Content Collections（推荐基准）**
   - `src/content.config.ts` 中 `defineCollection({ loader: glob({ base: './content/learned', pattern: '**/*.md' }), schema: z.object({...}) })`；Zod 4 全特性支持（`z.coerce.date()`、`.transform()`、`refine` 等）
   - 违反 schema 的文件**构建直接报错**并指向具体文件与字段（[错误参考](https://docs.astro.build/en/reference/errors/content-entry-data-error/)），CI 天然拦截脏数据
   - 自动生成 TS 类型（查询时补全）**和** `.astro/collections/*.schema.json`（VS Code 里给 JSON/YAML frontmatter 提供补全——编辑体验直接拉满，见[文档](https://docs.astro.build/en/guides/content-collections/#using-json-schema-files-in-your-editor)）
   - 已学/待学两个目录 = 两个 collection，schema 可共享一个基础对象再差异化扩展；**多级分类既可用目录结构（id 由文件路径生成），也可用 frontmatter 字段**，两者可叠加（详见 §7）

2. **Nuxt Content v3**：`content.config.ts` 的 `defineCollection` 同样支持 Zod schema（[官方文档](https://content.nuxt.com/docs/collections/define)），v3 底层改为 SQL 存储、查询大规模内容更快（[v3 发布公告](https://content.nuxt.com/blog/v3)）。Vue 技术栈下的对等选择。

3. **Velite**（Next.js 路线）：Zod schema 把 Markdown/MDX/YAML/JSON 编译为类型安全数据层，是 Contentlayer 停维后的活跃继任者。

4. ** remark-lint-frontmatter-schema**：任何 remark 管线可加的 lint 插件，可作为 Hugo/Eleventy 等无原生校验方案的补丁（社区方案，成熟度低于上述框架内建能力）。

5. **Hugo**：无原生 frontmatter 校验；优势在构建速度与内置 taxonomies，但"类型安全内容"故事讲不出来。

### 2.4 部署流程对比

全部候选框架产物均为纯静态文件，四家主流托管都能跑；差异在细节：

| 平台 | 配置成本 | PR 预览部署 | 免费额度 | 对本项目的适配 |
|---|---|---|---|---|
| **Vercel** | 零配置识别 Astro | ✅ 每个分支独立 URL | Hobby 免费档足够 | DX 最好；面试官打开 preview 链接即所见 |
| **Cloudflare Pages/Workers** | 零配置 + 官方 `@astrojs/cloudflare` 适配器 | ✅ | 极宽松免费额度 | 与 Astro 团队同属 Cloudflare，长期契合度高 |
| **Netlify** | 零配置 + 官方适配器 | ✅ | 免费档足够 | 同上，无明显短板 |
| **GitHub Pages** | 需 Actions 工作流（[官方指南](https://docs.astro.build/en/guides/deploy/github/) 提供 withastro/action 模板） | ❌ 无预览部署 | 免费、仓库内自包含 | "所有东西都在 GitHub"的叙事完整；注意 project pages 需配 `base` 路径，仓库/站点体积有 1GB 级限制 |

GitHub Pages 官方现在推荐用 GitHub Actions 自定义构建（`actions/deploy-pages`），Jekyll 早已不是唯一路径（[Jekyll CI 文档](https://jekyllrb.com/docs/continuous-integration/github-actions/)）。**建议：主站 Vercel 或 Cloudflare（拿预览部署），CI 全部跑在 GitHub Actions；若坚持单平台 GitHub 也可接受。**

### 2.5 工程性加分项（面试叙事的弹药库）

- TypeScript `strict`（Astro 脚手架默认模板即 strict）+ `astro check`（模板类型检查）
- GitHub Actions：lint（Biome/ESLint+Prettier）→ `astro check` + 构建（frontmatter 校验在此拦截）→ Playwright 冒烟（三个核心页面可交互）→ Lighthouse CI 性能预算
- 单测：Vitest 覆盖纯逻辑层（分类树构建、图数据生成、时间线分组）——这层逻辑与 UI 解耦本身就是架构亮点
- 产物分析（rollup-plugin-visualizer）+ 性能预算数字写进 README
- 可选：astro-og-catalog 类 OG 图自动生成（Satori + Sharp，Maggie Appleton 同款，见 §5.3）

---

## 3. 可视化层

### 3.1 渲染技术天花板：先看物理约束

| 渲染器 | 机制 | 可交互规模上限（经验值） | 风格自由度 |
|---|---|---|---|
| SVG | 每个节点/边一个 DOM 元素 | ~2k 元素后明显卡顿 | 最高（CSS、每元素事件、a11y 友好） |
| Canvas 2D | 单画布立即模式 | ~5k–10k（受 CPU 与布局计算制约） | 中（自绘回调） |
| WebGL | GPU 批量绘制 | 数万–数十万 | 历史上偏低（写 shader），新一代库在补齐 |

（量级数字综合 [Cylynx 横评](https://www.cylynx.io/blog/a-comparison-of-javascript-graph-network-visualisation-libraries/)（引 yWorks 测试）与 [gdotv 实践](https://gdotv.com/blog/practical-advice-on-graph-visualization-with-sigmajs/)；注意实际瓶颈常在**布局计算、标签渲染、hit-testing**而非绘制本身——[PkgPulse 2026 指南](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026) 特别强调不要迷信通用节点数基准，要用自己的数据测。）

**对本项目的规模判断**：个人学习材料 + 分类 + 标签，数量级大约在 10²–10³ 节点。Canvas 完全够用，WebGL 是为"全量知识图谱随年限增长 + 视觉冲击力"买的保险，也是面试谈资。

### 3.2 力导向图库横评（npm 版本均为 2026-09-08 实测）

| 库 | 版本/状态 | 渲染 | 规模定位 | 定制风格 | 框架集成 | 评 |
|---|---|---|---|---|---|---|
| **d3-force** | 3.0.0（d3 v7 线，稳定） | 无（仅物理模拟，渲染自理） | 模拟本身 O(n²) 壁垒 ~10⁵ | 完全自控（自己写渲染） | 无绑定，任意框架 | 最大自由度、最高实现成本；Quartz 的图谱即基于它 |
| **force-graph / react-force-graph**（vasturiano） | 1.51.4 / react 版 1.29.1，**活跃维护**（2026 年仍频繁发版） | Canvas 2D（2D）/ three.js（3D） | canvas 轻松 1 万节点 60fps；物理模拟 ~10⁵ 封顶 | 回调式自绘（canvas context） | React 组件开箱；亦有 web component 版 | **上手最快、效果最稳的"够用"选择**；缺点：无障碍性弱（canvas 无 DOM 事件）、样式深度定制要写 canvas 代码 |
| **sigma.js + graphology** | sigma 3.0.3 稳定 / **4.0.0-beta.5**（官方计划 2026-10 转 stable）；graphology 0.26.0；@react-sigma/core 5.0.6 | WebGL | 数万–数十万 | v3：声明式样式 + 自定义 node/edge program（GLSL）；**v4 全面重写**：单一 WebGL 上下文、SDF 任意节点形状、WebGL 标签与标签事件、内置拖拽、组合式边层——明确目标是"补齐 WebGL 的样式短板" | vanilla（配任何框架）/ @react-sigma | **技术叙事最强的选择**；渲染与数据结构（graphology）分离，算法（ForceAtlas2 含 Web Worker、Louvain 社区发现、最短路）按需拼装 |
| **cytoscape.js** | 3.34.3（2026-09-07 仍在发版，长期维护） | Canvas | 中大图 | JSON stylesheet（类 CSS，规整但偏刚性） | ref 挂载 / 社区 React 包装 | 内建图算法最全（生物信息学出身）；分析型需求首选，视觉"新意"一般 |
| vis-network | 维护节奏放缓 | Canvas | ~1k 节点后物理模拟掉帧 | 内建丰富但代码风格陈旧 | 无官方 React 绑定 | 快速原型可用，不建议新项目（[learning-graphs 评估](https://dmccreary.github.io/learning-graphs/appendix-graph-libs/)） |
| **@antv/G6**（+ Graphin） | 5.1.1（2026-05-08） | Canvas/其他 | 中大图 | 主题系统完善 | Graphin（React）官方支持 | 功能密度高、中文文档生态好；国际面试语境辨识度低于 d3/sigma |
| **ECharts graph** | 6.1.0（2026-05-19） | Canvas/SVG | 中等 | 配置项驱动，开箱好看 | 各框架封装众多 | 一站式（图谱+词云+关系图同库）；ECharts 6 带来新默认主题、动态主题切换、暗色模式适配（[v6 特性](https://echarts.apache.org/handbook/en/basics/release-note/v6-feature/)）；深度定制不如直接用图库 |

**sigma v3 → v4 的时间线要点**（[官方 v4 alpha 公告](https://github.com/jacomyal/sigma.js/discussions/1539)，2026-05）：v4 解决的是 v3 架构级问题（节点/边/标签分层渲染、canvas 标签无法命中事件、多 WebGL 上下文消耗等），改为全 WebGL + 声明式 styles/primitives API + SDF 节点形状；由 OuestWare 开发、gdotv 赞助，维护方计划 **2026 年 10 月上半月发布 v4.0.0**。策略建议：**以 v3（stable）开发，数据层走 graphology（v3/v4 通用），渲染层薄封装隔离 API 差异**，v4 转正后小成本升级——这本身就是一个很好的面试迁移故事。

**选型倾向**：
- 若追求"简洁 + 高技术力 + 有新意"的最优组合 → **sigma.js v3 + graphology**（WebGL、可预计算布局、Louvain 社区发现可用于"分类聚类着色"）
- 若追求最短路径出效果 → **react-force-graph**（React island 里 10 行出图，3D 模式天然吸睛）
- 若图谱之外还想要大量统计图表 → ECharts 6 一个库全包

### 3.3 与静态框架的集成方式（SSR/静态导出兼容性）

所有图库都依赖 canvas/WebGL/DOM，**只能客户端渲染**，集成模式：

- **Astro islands**：图谱组件标记 `client:visible`（滚入视口才水合）或 `client:idle`，其余页面保持零 JS——这正是 islands 架构的教科书用例（[Astro islands 文档](https://docs.astro.build/en/concepts/islands/)）。组件内部用 vanilla TS 直接初始化 sigma/force-graph，**不必引入 React**；若用 react-force-graph 则通过 `@astrojs/react` 集成
- Next.js：`next/dynamic` + `ssr: false`
- Nuxt/Vue：`<ClientOnly>` / `defineAsyncComponent`
- 生命周期注意（[PkgPulse](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)）：canvas 类实例必须在 ref/卸载时显式 destroy，避免 prop 变化时泄漏
- **数据流**：构建期 Astro endpoint 输出 `graph.json`（nodes/links/预计算坐标）→ island `fetch` 后渲染；这样图谱数据可以单独缓存/版本化，也方便 Playwright 直接断言 JSON 契约

### 3.4 思维导图：markmap（强烈契合本项目模型）

[markmap](https://markmap.js.org/docs/markmap) = markdown + mindmap：`markmap-lib` 解析 markdown 层级结构 → `markmap-view` 渲染为可交互 SVG（d3 驱动，缩放/折叠/平移）。当前 0.18.x（markmap-lib 2025-06 更新），提供 React/Vue 官方示例、VSCode 插件、CLI、自动加载器等完整生态（[GitHub](https://github.com/markmap/markmap)）。

对本项目的意义：**学习笔记的 markdown 标题层级天然就是思维导图**，无需为 mind map 视图额外维护数据——单篇材料的"大纲视图"可以直接用 markmap 呈现，全站知识树也可以用"目录结构 → markdown 列表 → markmap"生成。竞品 mermaid mindmap（mermaid v9.2+ 内置）适合文档内嵌静态导图，交互性弱于 markmap。

### 3.5 词云

- **d3-cloud**（1.2.9，2026-03 仍有发布）：经典螺旋布局词云，SVG 产出、样式完全自控，155 个依赖项目；简单需求首选
- **echarts-wordcloud**（ECharts 插件）：若图谱已用 ECharts 则顺手；支持形状遮罩
- 若"词云"只是标签聚合展示，也可考虑直接用图谱中的标签节点（Quartz 即把 tag 作为图节点），减少一种视图反而更简洁

### 3.6 时间线首页：没有好库，自绘即亮点

调研结论：**个人学习时间线没有占主导地位的现成库**。事件范围类需求有 vis-timeline（甘特式）、叙事类有 Knight Lab TimelineJS（偏老），都不匹配"简洁现代"的诉求。社区实践（含数字花园/作品集时间线）基本是：

- 结构：CSS Grid/Flex 双列时间线 + 日期轴，纯 HTML/CSS
- 动效：滚动进场 reveal 用 **CSS scroll-driven animations**（原生，零 JS）或 Intersection Observer；更复杂的编排用 **GSAP ScrollTrigger**（GSAP 被 Webflow 收购后 2025 年起 **100% 免费含插件**）；平滑滚动配 Lenis（[2026 scrollytelling 横评](https://cssauthor.com/best-javascript-scroll-animation-scrollytelling-libraries/)）
- 数据：已学 collection 按日期分组（年/月分节）——构建期算好，页面零交互成本

这条路线同时满足"简洁"（无重库依赖）与"高技术力"（原生 CSS 动画 / GSAP 编排是前端基本功的展示位），并保住 Astro 零 JS 基线——时间线页在 Lighthouse 应能拿满分。

### 3.7 可视化层小结

| 视图 | 推荐 | 备选 |
|---|---|---|
| 全站知识图谱 | sigma.js v3 + graphology（构建期 FA2 预布局 + Louvain 着色） | react-force-graph（更快出活）/ ECharts graph（图表全家桶） |
| 单篇材料大纲 | markmap（零成本复用 markdown） | mermaid mindmap |
| 词云/标签云 | d3-cloud | echarts-wordcloud、或并入图谱标签节点 |
| 时间线 | 自绘 CSS + scroll 动效 | GSAP ScrollTrigger |
| 站内搜索 | Pagefind（构建期索引、纯前端 UI；astro-pagefind 集成周下载 19.4 万，Starlight 默认方案） | — |

---

## 4. 同类开源项目案例分析

### 4.1 Quartz v5 —— 与本项目最接近的"全家桶"参照

[jackyzha0/quartz](https://github.com/jackyzha0/quartz)（13.2k★，2026-09 仍在活跃提交）：把一个 markdown 目录（Obsidian 兼容语法）变成完整数字花园站，TypeScript 自研 SSG + 插件架构（transformer/emitter/component 三类插件）。与本项目需求高度重合的功能清单（[官方 features](https://quartz.jzhao.xyz/features)）：

- **图谱视图**：全局图 + 当前页局部图（一跳邻域），实现为 **d3-force 模拟 + PixiJS WebGL 渲染**（[graph 插件](https://github.com/quartz-community/graph)、[DeepWiki 分析](https://deepwiki.com/jackyzha0/quartz/5.2-graph-visualization)），标签作为图节点、悬停/点击交互、访问过的节点高亮
- **目录与标签页**（folder/tag listings）≈ 本项目的"多级分类页"
- 反链、全文搜索、文件树 explorer、popover 预览、Andy Matuschak 式堆叠页面、SPA 路由、RSS、暗色模式、i18n 30+、Docker 部署、私有页过滤
- v5 变化：配置改为 `quartz.config.yaml`；新增 Obsidian Bases/Canvas 支持

**启示**：① 图谱数据在构建期从 wikilinks 解析为 JSON、客户端模拟——验证了 §2.2 路线 C；② "材料 ↔ 分类/标签"混合建图（ Quartz 的 tag 节点）直接可借鉴；③ 若本项目的重心是"快速有个站"可直接用 Quartz，但**求职叙事会从"我构建了 X"降级为"我配置了 X"**——除非 fork 后做深度定制。

### 4.2 Obsidian Digital Garden —— 编辑器插件 + SSG 的管道化方案

[oleeskild/obsidian-digital-garden](https://github.com/oleeskild/obsidian-digital-garden)：Obsidian 插件把带 `dg-publish: true` frontmatter 的笔记通过 GitHub API 推到仓库 → [Eleventy 模板](https://github.com/oleeskild/digitalgarden)（Nunjucks 组件可覆写）→ Vercel/Netlify 自动构建。支持反链、图谱、搜索、Dataview/Bases/Canvas/Excalidraw/MathJax/Mermaid 等重度 Obsidian 语法。

**启示**：① frontmatter 布尔位（`dg-publish`）做选择性发布是最小成本的内容过滤模式——本项目的"待学 → 已学"流转也可以考虑用一个 status 字段 + 目录移动双保险；② "写作工具 → git → 构建"的管道对学习记录场景非常顺手，若作者用 Obsidian 记笔记可考虑同款思路（反之不需要）。

### 4.3 Maggie Appleton 的花园 —— 三代技术栈演进的活教材

[Maggie Appleton's garden V3](https://github.com/MaggieAppleton/maggieappleton.com-v3)（Astro 61.5% + MDX 35.5%）：typed content collections（essays/notes/patterns/talks/... 多 collection）、双向链接、Tippy.js 悬停预览、CSS masonry、生长阶段（seedling→budding→evergreen，**用 frontmatter 驱动内容状态**——与本项目的待学/已学状态同构）、webmentions、Satori+Sharp 动态 OG 图、View Transitions。她的 [colophon](https://maggieappleton.com/colophon/) 明确建议：个人站不要用应用框架（V1 Gatsby、V2 Next.js 均已废弃重写），**Astro/Eleventy/Hugo 这类静态生成器才对**；"我的 CMS 就是一堆平铺的 MDX 文件"。

**启示**：① 权威实践者用真金白银的迁移历史投了 Astro 一票；② frontmatter 驱动的"内容状态/阶段"是数字花园社区成熟模式；③ 悬停预览（Tippy.js + 预渲染 HTML）是低成本高质感的交互细节。

### 4.4 Simon Willison 的 TIL —— "markdown 仓库 + 脚本 + Actions"的极简流派

[simonw/til](https://github.com/simonw/til)（1.5k★，582 条 TIL，2026-09 仍在更新）：按主题分目录的 markdown 仓库 + Python 脚本（`build_database.py`/`update_readme.py`）+ GitHub Actions，搜索站跑在 Datasette（SQLite）上。该格式源自 [jbranchaud/til](https://github.com/jbranchaud/til)。

**启示**：① "一个主题目录一个文件夹"的朴素组织经受住了 5 年 500+ 条内容的考验；② 构建期把 markdown 变结构化数据库（SQLite/JSON）再服务前端，与本项目的 graph.json 思路一致；③ 极简流派的可维护性极强，但表现力（图谱/时间线）不足——正是本项目要超越的部分。

### 4.5 VitePress 知识库生态 —— 中文社区的主流路径

[Nólëbase](https://github.com/nolebase/nolebase)（627★，"记录回忆，知识和畅想的地方"）：VitePress 驱动的双语知识库，并衍生出 [nolebase/integrations](https://github.com/nolebase/integrations) 插件全家桶（双向链接、面包屑、阅读增强、Git 页面历史、行内链接预览、OG 图生成等 markdown-it/VitePress 插件）。其文档还罗列了大量 VitePress 知识库案例（maomao1996/mm-notes、ATQQ/sugar-blog、chodocs 等）。

**启示**：① 中文社区"学习/知识记录站"最常见解就是 VitePress（零配置出文档站）——但它是**文档站形态**，时间线/图谱/待学清单这种产品化页面需要大量越出其主题系统的定制；② @nolebase 的 markdown-it 插件群（尤其双向链接、行内预览）若走 Astro + remark 也有对应生态可平移。

### 4.6 共性模式提炼（可直接借用的"行业默认答案"）

1. **内容**：平铺 markdown 目录 + frontmatter（元数据/状态/标签），目录即大类
2. **管线**：构建期解析 → 类型安全数据层（Astro collections / Velite / 自写脚本）→ 静态 HTML + 一份全量索引 JSON
3. **图谱**：客户端力导向（d3-force 是事实内核，渲染层选 canvas/PixiJS/WebGL 按规模与审美）+ 构建期建边（wikilink 或 frontmatter 关系）
4. **搜索**：构建期索引 + 纯前端 UI（Pagefind 已成为静态站新默认）
5. **部署**：git push → Actions/Vercel/Cloudflare 自动构建，全免费
6. **状态表达**：frontmatter 字段驱动（生长阶段/发布位），而非分库分表

---

## 5. 面试展示价值评估

| 候选栈 | 讲点（面试可展开的深度话题） | 风险 |
|---|---|---|
| **Astro + sigma/graphology** | islands 架构与选择性水合的原理与收益；Zod 构建期校验的"内容即代码"实践；WebGL vs Canvas 渲染管线权衡；力导向模拟与预计算布局；Louvain 社区发现用于分类聚类；性能预算与 Lighthouse | Astro 7 较新（2026-06），个别生态集成可能滞后——锁版本即可 |
| Next.js + Velite | React 生态纵深、RSC/静态导出边界（export 模式特性取舍）、Contentlayer 之死与依赖治理教训 | 内容站场景 JS 体积税、"为什么不用 Astro"要能自圆其说 |
| Quartz v5 定制 | 快速交付、插件源码级定制（图谱用 d3+PixiJS 可深挖） | "造轮子含量"低，差异化叙事吃力 |
| Nuxt Content 3 | Vue 全栈、SQL 内容层的查询架构 | 若目标岗位偏 React 则叙事错位 |

**通用加分项**（与栈无关，建议无论选谁都做）：README 里的架构图与权衡记录（本文档即可演化过去）；CI 徽章；Playwright e2e；Lighthouse CI 预算文件；内容 schema 的 JSON Schema 演示 GIF。

---

## 6. 推荐方案与架构草图（供下一步设计文档输入）

### 6.1 主张

- **框架**：Astro 7（static 输出）+ TypeScript strict + MDX（笔记内嵌交互组件时才用）
- **内容**：`content/learned/` 与 `content/backlog/` 两个 collection；共享基础 schema（title/type/duration/tags/categories/date），backlog 增补 priority/est 等字段；**多级分类建议"目录即分类"为主**（`content/learned/前端/Astro/xxx.md`，glob loader 的 id 自带层级路径，天然支持多级分类页路由），frontmatter `categories` 字段作为冗余校验（Zod `refine` 对齐目录树，不一致即构建失败）——两个来源、构建期强制一致，这本身就是很干净的工程设计
- **图数据**：构建期（Astro endpoint 或构建脚本）产出 `/graph.json`：节点 = 材料/分类/标签（含类型、颜色、预计算 x/y），边 = 分类从属（树）+ 标签关联 + 材料 wikilink；图谱 island `client:visible` 加载 sigma v3 渲染
- **页面**：`/`（时间线，纯静态 CSS 动效）· `/graph/`（全量图谱）· `/backlog/`（待学清单，可加轻量过滤 island）· `/[...slug]/`（材料详情，含 markmap 大纲视图）· `/categories/[...path]/`（多级分类列表）
- **搜索**：Pagefind（可选，V1 可后置）
- **部署**：Vercel/Cloudflare（PR preview）+ GitHub Actions CI（lint → check+build → Playwright 冒烟 → Lighthouse CI）
- **测试**：Vitest（schema/分类树/graph builder 单测）+ Playwright（三核心页面）

### 6.2 备选触发条件

- 求职目标明确是 **React 重型团队** → 换 Next.js 16 + Velite（叙事对齐岗位）
- 求职目标是 **Vue 团队** → Nuxt 3 + Nuxt Content 3
- 时间极度紧张（<1 周）→ Quartz v5 起步再逐步替换定制层

### 6.3 风险与开放问题

1. **sigma v4 转正时间**（官方计划 2026-10）：v3 开发、graphology 数据层隔离 API，v4 stable 后升级
2. **图规模预期**：若 5 年内材料数 >2k，Canvas 方案（react-force-graph）与 WebGL（sigma）差距才会显现；当前规模两者皆可，按"叙事价值"选 sigma
3. **GH Pages 子路径**：若用 project pages 需配 `base`，会影响 Pagefind/OG 图等绝对路径——用自定义域名或 Vercel 可规避
4. **markmap 的全站树视图**：与力导向图谱功能重叠，V1 建议只在单篇详情页用 markmap，避免两种"知识结构视图"互相稀释
5. **wikilinks vs 普通链接**：材料间互链若采用 `[[wikilink]]` 语法需要 remark 插件转换（Astro 生态有现成方案，Quartz/obsidian-garden 同款需求），V1 可先用标准相对链接

---

## 7. 参考链接汇总

**官方/一手**
- Astro：[Content Collections](https://docs.astro.build/en/guides/content-collections/) · [Astro 7 发布公告](https://astro.build/blog/astro-7) · [加入 Cloudflare](https://astro.build/blog/joining-cloudflare/) · [Islands](https://docs.astro.build/en/concepts/islands/) · [部署指南](https://docs.astro.build/en/guides/deploy/)（[GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) / [Vercel](https://docs.astro.build/en/guides/deploy/vercel/) / [Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)）
- Nuxt Content：[v3 公告](https://content.nuxt.com/blog/v3) · [collections/schema 文档](https://content.nuxt.com/docs/collections/define)
- sigma.js：[官网](https://www.sigmajs.org/) · [v4 alpha 公告](https://github.com/jacomyal/sigma.js/discussions/1539) · [v4 站点](https://v4.sigmajs.org/) · [GitHub](https://github.com/jacomyal/sigma.js)
- graphology / react-force-graph（[2D](https://github.com/vasturiano/react-force-graph)）/ [markmap](https://markmap.js.org/) · [cytoscape.js](https://js.cytoscape.org/) · [G6](https://github.com/antvis/G6) · [ECharts 6 特性](https://echarts.apache.org/handbook/en/basics/release-note/v6-feature/) · [d3-force](https://d3js.org/d3-force) · [d3-cloud](https://github.com/jasondavies/d3-cloud)
- Quartz：[GitHub](https://github.com/jackyzha0/quartz) · [features](https://quartz.jzhao.xyz/features) · [graph-view](https://quartz.jzhao.xyz/features/graph-view) · [graph 插件](https://github.com/quartz-community/graph)
- Eleventy · [Contentlayer 停维声明](https://github.com/contentlayerdev/contentlayer) · [Velite](https://github.com/zce/velite) · [Pagefind（astro-pagefind）](https://github.com/shishkin/astro-pagefind)

**案例**
- [Maggie Appleton colophon](https://maggieappleton.com/colophon/) · [garden V3 源码](https://github.com/MaggieAppleton/maggieappleton.com-v3) · [digital-gardeners 清单](https://github.com/maggieappleton/digital-gardeners)
- [oleeskild/obsidian-digital-garden](https://github.com/oleeskild/obsidian-digital-garden) · [digitalgarden 模板](https://github.com/oleeskild/digitalgarden)
- [simonw/til](https://github.com/simonw/til) · [Nólëbase](https://github.com/nolebase/nolebase) · [nolebase/integrations](https://github.com/nolebase/integrations)

**横评/深度分析**
- [gdotv：SigmaJS 图可视化的实用建议](https://gdotv.com/blog/practical-advice-on-graph-visualization-with-sigmajs/)（2026-07）
- [PkgPulse：Cytoscape vs vis-network vs Sigma 2026](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)
- [Cylynx：JS 图可视化库对比](https://www.cylynx.io/blog/a-comparison-of-javascript-graph-network-visualisation-libraries/)
- [learning-graphs 附录：图库选择](https://dmccreary.github.io/learning-graphs/appendix-graph-libs/)
- [starlog：force-graph 为何用 canvas](https://starlog.is/articles/data-knowledge/vasturiano-force-graph)
- [jwatte：SSG 横评 2026](https://jwatte.com/blog/blog-ssg-comparison-2026/) · [toolchew：Astro vs Eleventy](https://toolchew.com/en/astro-vs-eleventy/) · [Next.js vs Astro（内容站）](https://www.alphonsolabs.com/nextjs-vs-astro-for-blog/)
