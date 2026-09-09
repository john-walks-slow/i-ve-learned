---
title: "Rolldown：Vite 的 Rust 打包器核心"
type: article
date: 2026-01-25
category: [Frontend, Tooling]
comment: 为什么 Vite 要用 Rust 重写 Rollup，以及它对构建速度的真实影响。
url: https://rolldown.rs/
tags: [vite, bundler, rust]
duration: 35
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 笔记

Rollup 的 JS 单线程成为大仓库的瓶颈；Rolldown = Rollup 兼容 API + Rust 实现 + 原生 ESM。Astro 7 的构建提速一部分就来自这条线。

对个人站的意义：冷构建从"泡杯茶"回到"眨个眼"，CI 时间也跟着短。
