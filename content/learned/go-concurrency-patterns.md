---
title: "Go Concurrency Patterns (Rob Pike, 2012)"
type: talk
date: 2026-02-14
category: [Language, Go]
description: generator / fan-in / pipeline / timeout 的祖师爷讲义。
url: https://go.dev/talks/2012/concurrency.slide
tags: [go, concurrency, channels]
duration: 50
source: "Rob Pike"
rating: 5
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 笔记

"Concurrency is not parallelism"——并发是**结构**，并行是**执行**。

最优雅的一段：用 select + time.After 实现超时，用 nil channel 在 select 中禁用分支。
