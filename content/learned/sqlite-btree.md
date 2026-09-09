---
title: "SQLite 是怎么存数据的：B-tree 页与自由块"
type: blog
date: 2026-08-02
category: [Systems, Storage]
comment: 读完 DDIA 第 9 章后的落地练习：用 hexdump 看 sqlite 文件的页结构。
url: https://www.sqlite.org/fileformat2.html
tags: [sqlite, b-tree, storage]
duration: 90
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 动手记录

`xxd db.sqlite | head` 看到页头之后，最惊讶的是：**整个文件就是一棵 B-tree 的森林**——每张表一棵、每个索引一棵。

- 页 1 = sqlite_master 表（schema 自身也是 B-tree）
- 4096 字节页、页头 12 字节、cell 指针数组从页尾生长
- 自由块链表 = 碎片的账本

## 和 DDIA 的连线

B-tree 的写放大（一页 4KB，写一行也要整页落盘）在 WAL 模式下被 amortize 成 commit 粒度。
