---
title: "Attention Is All You Need"
type: paper
date: 2026-04-22
category: [ML, LLM]
comment: Transformer 原论文。QKV 的物理直觉：一次可微分的数据库查询。
url: https://arxiv.org/abs/1706.03762
tags: [transformer, attention]
duration: 150
pages: 15
source: "Vaswani et al., NeurIPS 2017"
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 读法

第一遍读图 1 和第 3 节，跳过实验部分；第二遍手推一个 head 的维度变化（d_model=512, h=8, d_k=64）。

## 直觉

- **Q·Kᵀ = 相关性打分**，softmax 后变成"注意力权重"，再加权 V——一次端到端可训练的"软性数据库查询"
- 多头 = 在 8 个不同子空间里各自做一遍，等于ensemble
- positional encoding 用 sin/cos 是因为"任意相对位置都能表示成线性变换"

## 与后续工作的连线

- KV cache 的必要性：自回归解码时 K、V 不变，重复计算纯浪费
- FlashAttention 的本质：不改变数学，只改变显存访问模式
