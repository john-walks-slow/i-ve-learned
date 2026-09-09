---
title: "Astro Content Collections 源码阅读"
type: doc
date: 2026-06-25
category: [Frontend, Frameworks]
comment: glob loader 怎么把 markdown 目录变成类型安全的数据层。
url: https://docs.astro.build/en/guides/content-collections/
tags: [astro, static-site, typescript]
duration: 90
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 笔记

Content Layer 的核心抽象是 **loader：把任意数据源变成统一的 entry 流**，entry 再经过 zod schema 变成类型安全数据。

- `glob()` loader：扫描目录 → 解析 frontmatter → 生成 `{ id, data, body }`，id 默认是相对路径（去掉扩展名）
- `file()` loader：单文件数据（JSON/YAML）
- 自定义 loader 只要实现 `load({ store, meta, logger })`，可以塞数据库、CMS、甚至 GitHub API

**为什么 schema 校验是构建期的一等公民**：frontmatter 是人手写的 YAML，没有类型系统兜底；在 build 时炸掉总好过在页面上渲染出 `undefined`。

## 对本站的启发

两个目录 = 两个 collection，`_*` 前缀天然可以留给模板文件——`pattern: '**/[^_]*.md'` 一行解决。
