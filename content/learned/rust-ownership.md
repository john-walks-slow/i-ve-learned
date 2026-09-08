---
title: "Rust 所有权模型（The Rust Programming Language, ch.4）"
type: course
date: 2026-07-12
category: [Language, Rust]
description: move / borrow / lifetime 三件套终于串起来了。
url: https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html
tags: [rust, ownership, memory]
duration: 120
source: "The Rust Book"
rating: 5
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 一句话模型

每个值有**一个**所有者；值被 move 后原变量不可用；borrow 分共享（&T，多个）与可变（&mut T，独占）。

## 真正的顿悟点

- `Copy` 类型（栈上的小值）不 move，是隐式复制——所以整数赋值后原变量还能用
- lifetime 不是把对象保活，而是**编译器证明引用不会悬空**的标记；`'a` 只是约束描述
- 借用检查报错时，先数同一作用域里有几个 `&mut`——超过一个就是设计问题，不是语法问题

## 练习记录

- [x] 修一个链表实现里的 double-borrow 错误（改用 index 代替引用）
- [ ] 实现 `Drop` 观察 move 时机
