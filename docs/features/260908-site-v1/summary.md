# 260908-site-v1 交付总结

> 交付日期：2026-09-09
> 计划：`260908-site-v1.plan.md` · 审查：`review.md` · 用户验证：`260908-site-v1.validation.md`

## 交付物

"What I've Learned" V1 全站——两个 markdown 目录驱动的个人学习记录站，9 个 commit（26fe66a → 53dfa65），零框架运行时，GitHub Pages 就绪。

| 页面 | 路由 | 说明 |
|---|---|---|
| 时间线首页 | `/` | 自述 + 数据行 + 12 月热力带 + 类型×分类筛选 + 年月分组 |
| Atlas 星图 | `/atlas/` | 手写 Canvas 2D 墨点星座（~590 行零依赖），确定性布局 |
| 待学清单 | `/backlog/` | 正在学置顶 + 分类分组 why + "还想学吗"防腐烂 |
| 材料详情 | `/m/[slug]/` | learned/backlog 共用 URL；衬线笔记 + 关联条目 + "等了 n 个月" |
| 分类页 | `/category/[...path]/` | slugify 路由 + 注册表反查；`/category/` 索引 = 星图文本投影 |
| 标签页 | `/tags/[tag]/` | 从内容派生 |
| ⌘K 面板 | 全站 | 首次按键动态加载；minisearch + CJK 子串兜底 |
| OG 卡片 | `/og/*.png` | 构建期生成 31 张 + 站点卡，纸感模板本地字体 |
| 数据端点 | `/graph.json` `/search-index.json` | 交互数据源（gzip 各 ~2-4KB） |

## 里程碑与 commit

| M | commit | 内容 |
|---|---|---|
| M1 | 26fe66a | 地基 + Atlas spike；渲染器决策：手写 Canvas 2D（决策 #5） |
| M2 | 213a603 | 时间线首页 |
| M3 | ae3548f | 详情页 + 分类页 + 标签页 |
| M4 | 007eb34 | Atlas 生产化（面板/文本投影/noscript） |
| M5 | 8f97131 | 待学页 + ⌘K 命令面板 |
| M6 | 3f88e7e | CI / e2e / OG / sitemap / 预算门禁 / README |
| M7 | 166ce5a | 移动端 + a11y 对比度 + 反 AI 套路清单 |
| Review | 53dfa65 | 审查修复（XSS 补强、死代码、OG 键冲突、c++ 标签） |

## 质量门禁（交付时全绿）

| 门禁 | 结果 |
|---|---|
| Biome lint | 31 文件 0 问题 |
| Vitest | 43/43（布局确定性、防重叠、增量稳定性、schema、stats、格式化） |
| astro check + build | 118 页，~8s，Zod schema 拦截脏数据 |
| Playwright e2e | 7/7（访客主路径 + 无 JS 降级 + ⌘K 键盘流 + Atlas 像素断言） |
| 体积预算 | 首屏 JS 3KB/5KB · ⌘K 6KB/60KB · Atlas 4KB/250KB · HTML 70KB/80KB |
| 反 AI 套路 checklist（§4.4） | 7/7 通过 |

## 关键实现决策（全文见计划 §9 + review.md）

1. **零框架运行时**——服务端渲染完整 HTML；筛选/星图/⌘K 全部动态 `import()`；无 JS 全站可读。
2. **星图手写 Canvas 2D**——逐像素视觉控制（墨色 ramp/发丝线/琥珀虚弧）；布局构建期预计算；渲染器 gzip 2KB。
3. **布局确定性**——FNV-1a→mulberry32；分类角槽 + 日期作角度；增删条目不移动已有节点（测试钉住）。
4. **URL slugify**——`OS & Kernel`→`os-kernel`，注册表反查还原显示名。
5. **⌘K 范围切割**——只做导航查找；全文检索留 V1.1（Pagefind）。
6. **demo 条目进全站**（带"示例"角标）——上线前整体移除（M7 验收项）。

## 已知事项 / 待办

- `astro.config.mjs` 的 `site` 与页脚 source 链接为占位符——部署时替换真实仓库地址（验证项 9）。
- 真实内容回填：`grep -l 'demo: true' content/**/*.md | xargs rm` 后按 `_template.md` 写入（验证项 7）。
- V1.1 候选：Firefox 星图字距兼容、子分类间距余量（164/160px）、Pagefind 全文搜索、RSS、markmap。

## 上线步骤（用户操作）

1. 建仓库 push；2. 改 `site`；3. Settings → Pages → GitHub Actions；4. 回填真实内容后 push。
