---
title: "CSS scroll-driven animations（Chrome 115+）"
type: doc
date: 2026-03-22
category: [Frontend, Rendering]
description: 滚动进度条、揭示动画——不再需要一行 JS 或 scroll 监听。
url: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
tags: [css, animation, performance]
duration: 45
rating: 4
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 笔记

```css
animation-timeline: scroll();
/* 或 view() —— 元素进入视口驱动 */
```

关键收益：滚动动画从主线程 JS 挪到合成器线程——滚动时零 jank。时间线首页的进场动画用它实现（渐进增强，不支持则直接显示）。
