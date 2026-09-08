---
title: "What the heck is the event loop anyway?"
type: video
date: 2026-08-28
category: [Language, TypeScript]
description: 用 setTimeout 不等于异步这件事讲透浏览器的事件循环。
url: https://www.youtube.com/watch?v=8aGh-ZQ-ENo
tags: [event-loop, async, browser, latency]
duration: 26
source: "Philip Roberts, JSConf EU"
rating: 4
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

## 笔记

Philip 用一个 "loupe" 工具把 JS 运行时拆成了三块：**call stack / Web APIs / task queue**。

关键直觉：

- `setTimeout(fn, 0)` 不是"立即"，是"尽快（但要等当前栈清空 + 前面的任务跑完）"
- 点击处理、定时器、网络回调都进同一个 task queue，**渲染插在 task 之间**
- 所以长任务会卡 UI——主线程不是"忙"，是"栈没清空"

微任务（microtask）他没展开，但那正是 Promise 的队列：每个 task 结束后、渲染前清空全部微任务。
