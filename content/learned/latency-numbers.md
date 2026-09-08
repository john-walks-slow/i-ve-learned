---
title: "Latency numbers every programmer should know"
type: article
date: 2026-08-20
category: [Systems, Distributed]
description: L1 缓存 0.5ns、同机房往返 500µs——数量级感是性能直觉的地基。
url: https://gist.github.com/jboner/2841832
tags: [latency, performance, back-of-envelope]
duration: 15
source: "Jeff Dean"
rating: 4
revisit: true
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 抄一遍加深记忆

| 操作 | 数量级 |
|---|---|
| L1 cache reference | 0.5 ns |
| Main memory reference | 100 ns |
| SSD random read | 16 µs |
| Same-DC round trip | 500 µs |
| 跨大西洋往返 | ~70 ms |

## 用法

做容量估算时先问：这个操作落在哪一档？一次"感觉很快"的函数调用链，串 10 次跨机房 RPC 就是 5ms 起步。

配套练习：给一个接口做预算，把每一步的开销填表，超过 1ms 的步骤才值得优化。
