---
title: "给博客做了一个阅读时长估算器"
type: project
date: 2026-06-10
category: [Engineering, Architecture]
description: 一个 200 行的 CLI，顺手处理了 CJK 字符按 0.5 字/秒折算的问题。
tags: [cli, reading-time, cjk]
duration: 180
rating: 3
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 做了什么

输入 markdown，输出 `{minutes, words, cjkChars}`。规则：拉丁词 220 wpm，汉字 300 字/分钟（实测中文略慢于英文词频折算，取了中文阅读研究的中位数）。

## 踩坑

1. 正则 `[\u4e00-\u9fff]` 匹配汉字没问题，但 CJK 标点（，。、）不该计阅读时长——单独剥离
2. 代码块里的内容要剔除，否则一篇带大段代码的文章时长虚高 2x

## 沉淀

字数统计这类"看起来简单"的功能，正确性全在边界情况里。
