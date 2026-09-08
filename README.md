# What I've Learned

读过的、看完的、动手写下来的——全部落进两个 markdown 目录。

一个个人学习记录站：**时间线**（按月回顾）、**Atlas**（把学过的东西画成一张知识星图）、**Backlog**（想学的与它们等的月数）。内容即文件，`git mv` 一下就完成"从想学到学完"的晋升。

## 快速开始

```bash
pnpm install
pnpm dev          # 开发（内容改动热更新）
pnpm test         # lib 层单元测试
pnpm build        # 构建到 dist/（schema 校验在此拦截脏数据）
pnpm test:e2e     # Playwright 冒烟（先 build；自动拉起 preview）
pnpm verify       # lint + test + build + e2e 一条龙
./scripts/budgets.sh   # 性能预算门禁
```

## 内容模型

```
content/
├── learned/    # 学完的：frontmatter（类型/日期/时长/分类/标签…）+ 正文即笔记
└── backlog/    # 想学的：多一个 why（为什么想学）与 est（预计用时）
```

- frontmatter 由共享 Zod schema 硬校验，`category` 必须命中注册表（`src/data/categories.ts`），标签限定 URL 安全字符——**脏数据进不了构建**。
- 晋升 = `git mv content/backlog/xx.md content/learned/`，URL（`/m/xx/`）不变。
- 分类注册表是唯一真相源：星图扇区顺序、筛选 chips、分类页路由都从它派生。

## 架构

```
content/*.md ──→ Astro Content Collections（Zod 校验）
                      │
                      ├─→ 构建期图谱布局（确定性几何：分类角槽 + 日期作角度）
                      │        └─→ /graph.json ─→ Canvas 2D 渲染器（零依赖手写）
                      │
                      ├─→ 时间线 / 待学页 / 分类页 / 标签页（纯静态 HTML）
                      │
                      ├─→ /search-index.json ─→ ⌘K 面板（首次按键动态加载）
                      │
                      └─→ OG 分享卡片（astro-og-canvas，纸感模板）
```

### 关键决策（完整的见 `docs/features/260908-site-v1/260908-site-v1.plan.md` §9）

1. **零框架运行时**——不用任何前端框架。服务端渲染完整 HTML，交互脚本（筛选 reveal / 星图 / ⌘K）全部 `import()` 按需加载，无 JS 时内容完整可读（渐进增强）。
2. **图谱渲染器手写 Canvas 2D**（而非 sigma.js）——视觉需逐像素受控（墨色 ramp / 发丝线 / 唯一强调色的虚弧连线）；布局是构建期预计算的确定性几何，运行时布局库反而是阻力；目标 ≤500 节点，Canvas 2D 无压力，渲染器 gzip ≈ 2KB。
3. **布局确定性**——FNV-1a → mulberry32 PRNG（无 `Math.random()`），增删条目不移动任何已有节点（有测试钉住），diff 干净、心智负担为零。
4. **URL 段 slugify**——"OS & Kernel" → `/category/systems/os-kernel`，注册表反查还原显示名。
5. **⌘K 范围切割**——面板只做"导航与查找"（标题/标签/分类），全文检索（Pagefind，CJK 分词）留 V1.1 独立设计。

## 性能预算（`scripts/budgets.sh` 门禁，CI 强制）

| 预算项 | 目标 | 当前 |
|---|---|---|
| 首屏阻塞 JS | ≤ 5KB raw | 3KB |
| ⌘K 延迟包 | ≤ 60KB gzip | 6KB |
| Atlas 延迟包（渲染器 + graph.json） | ≤ 250KB gzip | 4KB |
| 搜索索引 | ≤ 100KB gzip | 2KB |
| 最大单页 HTML | ≤ 80KB raw | 70KB |
| 构建 | < 60s | ~10s |

## 测试

- **Vitest（43 用例）**：布局几何（确定性、防重叠、增量稳定性）、时长/页数格式化、schema 校验、stats。
- **Playwright（7 冒烟）**：访客主路径（落地 → 筛选 → 详情 → 星图 → 待学 → ⌘K）+ 无 JS 降级。CI 顺带产出 Atlas 截图 artifact 供人工审阅。

## 部署

GitHub Pages（Actions，`.github/workflows/deploy.yml`）：push 到 main → build → 预算门禁 → 发布。仓库自包含，无外部服务。

> 注意：`astro.config.mjs` 的 `site` 需改成真实仓库名，首次部署前在仓库 Settings → Pages 选 "GitHub Actions"。

## License

内容（`content/`）版权归作者；代码 MIT。
