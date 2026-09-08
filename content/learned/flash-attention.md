---
title: "FlashAttention: Fast and Memory-Efficient Exact Attention"
type: paper
date: 2026-07-20
category: [ML, LLM]
description: 不改数学，只改显存访问——SRAM 分块 + online softmax。
url: https://arxiv.org/abs/2205.14135
tags: [transformer, attention, gpu]
duration: 180
pages: 16
source: "Dao et al., NeurIPS 2022"
rating: 5
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 核心直觉

标准 attention 要把 N×N 矩阵写回 HBM；FlashAttention 把 Q/K/V 分块搬进 SRAM，用 **online softmax**（running max + running sum）增量计算，永不物化整个矩阵。

IO 感知：速度提升来自访存次数的量级下降，FLOPs 几乎不变。
