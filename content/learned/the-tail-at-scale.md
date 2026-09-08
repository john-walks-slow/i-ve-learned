---
title: "The Tail at Scale"
type: paper
date: 2026-09-02
category: [Systems, Distributed]
description: 尾延迟不是平均值问题，是百分位问题——一台慢机器足以拖垮整个服务。
url: https://research.google/pubs/the-tail-at-scale/
tags: [latency, p99, scheduling]
duration: 45
pages: 12
source: "Jeff Dean & Luiz Barroso, CACM 2013"
rating: 5
revisit: true
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 核心论点

一个系统的用户体验由**最慢的那部分请求**决定，而不是平均值。当请求扇出到 1000 台机器，只要 1% 的机器变慢，**每个用户请求几乎都会撞上慢机器**（1 - 0.99^1000 ≈ 99.996%）。

## 为什么会有尾巴

- 机器共享（后台任务抢资源）
- GC 停顿、缓存失效的雪崩
- 硬件老化（"柠檬机器"）
- 排队效应：负载略升 → 等待时间陡增

## 缓解手段

| 手段 | 代价 |
|---|---|
| 请求级关联（同一用户请求发到同一机器） | 负载不均 |
| 对冲请求（tail 大于阈值时重发一份） | 2x 流量，但 p99 显著下降 |
| 末尾感知调度 | 复杂 |

## 与我的关联

hedge requests 的思路可以直接用到我们的 RPC 框架上：p99 场景下重试成本远低于超时成本。
