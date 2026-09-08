---
title: "HTTP/3 与 QUIC：为什么要把 TCP 拆了重做"
type: doc
date: 2026-05-11
category: [Systems, Networking]
description: 队头阻塞是 TCP 的基因病，QUIC 在 UDP 上重写了传输层。
url: https://http3-explained.haxx.se/
tags: [http3, quic, networking]
duration: 75
rating: 4
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 笔记

- TCP 的队头阻塞：一个包丢了，后面所有流都要等重传——QUIC 在流之间做了独立确认
- 0-RTT 握手：会话票据缓存后，第一个包就能带数据
- 连接迁移：Connection ID 取代四元组，wifi → 5G 不断线
