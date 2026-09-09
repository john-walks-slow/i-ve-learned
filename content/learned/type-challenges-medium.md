---
title: "type-challenges: Medium 前 20 题"
type: project
date: 2026-06-28
category: [Language, TypeScript]
comment: 条件类型 + infer + 递归的肌肉训练。
url: https://github.com/type-challenges/type-challenges
tags: [typescript, type-level]
duration: 420
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 卡壳最久的两题

- `DeepReadonly`：递归时要同时处理元组和对象，忘了 tuple 的 readonly 是位置式的
- `StringToUnion`：infer 拿第一个字符 + 递归拆剩余——字符串递归原来可以这么用

## 沉淀

infer 的心智模型：**在模式匹配的位置开一个洞，让编译器替你填**。
