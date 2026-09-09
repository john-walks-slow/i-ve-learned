---
title: "《Designing Data-Intensive Applications》第 5–9 章"
type: book
date: 2026-08-14
category: [Systems, Storage]
comment: 从 B-tree 到 LSM-tree，从单机事务到分布式一致性——数据库内核的经典地图。
url: https://dataintensive.net/
tags: [database, replication, consensus]
duration: 640
pages: 210
source: "Martin Kleppmann"
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 结构记忆

- **第 5 章 Replication**：单主 / 多主 / 无主；故障切换的脑裂问题；读己之写的几种实现
- **第 6 章 Partitioning**：按 key range vs hash 分区；skew 与热点
- **第 7 章 Transactions**：隔离级别的真面目——脏读/不可重复读/幻读/丢失更新；SSI 比乐观锁强在哪
- **第 8 章 一致性与共识**：线性一致性的代价（CAP 不是三选二）；Raft 的领导选举与日志复制
- **第 9 章 一致性与共识（续）**：etcd/Zookeeper 的线性一致存储怎么用

## 印象最深的一点

"读己之写"这个看似简单的需求，在异步复制的世界里需要 session guarantee 一整层机制来兜底。

## 待办

- [ ] 把 Raft 论文精读一遍（已列入待学）
- [ ] 用 sqlite 复现一个最小的 B-tree 页分裂
