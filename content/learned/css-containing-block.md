---
title: "CSS 深入浅出：containing block 与格式化上下文"
type: blog
date: 2026-07-30
category: [Frontend, Rendering]
description: 为什么 position:absolute 的基准不总是父元素——containing block 规则一页讲清。
url: https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block
tags: [css, layout]
duration: 40
rating: 3
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 三个判定规则（记这个就够）

1. static / relative / sticky → 最近块级祖先的**内容盒**
2. absolute → 最近的 position ≠ static 祖先的 **padding 盒**
3. fixed → 视口——**除非**某个祖先有 transform/filter/perspective（此时变成那个祖先的 padding 盒，还附带成为 % 宽度的基准）

第三条是无数"fixed 失效"bug 的根源。

## 布局上下文

- BFC：overflow ≠ visible / float / position:absolute 触发；内部浮动参与高度计算
- IFC：行内排版的细则，vertical-align 的怪异都从这里解释

动手验证：开一个最小 repro 页面，改 transform 属性观察 fixed 元素基准变化。
