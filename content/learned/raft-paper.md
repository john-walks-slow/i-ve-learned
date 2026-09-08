---
title: "Raft: In Search of an Understandable Consensus Algorithm"
type: paper
date: 2026-09-05
category: [Systems, Distributed]
description: 从 backlog 晋升——终于把 Figure 8 啃下来了。
url: https://raft.github.io/raft.pdf
tags: [consensus, raft, replication]
duration: 200
pages: 18
source: "Ongaro & Ousterhout"
rating: 5
added: 2026-08-30
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 领导选举

随机超时是 Raft 可理解性的第一处妙笔：split vote 时各自随机退避，冲突自然收敛。

## 日志复制

AppendEntries 的一致性检查（prevLogIndex + prevLogTerm）把"回退"做成了协议的一部分。

## Figure 8 的绕路

不能提交**别任期的日志**——这是安全性证明里最反直觉的一条，画了四遍状态机才理顺。
