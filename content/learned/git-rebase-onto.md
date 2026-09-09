---
title: "git rebase --onto 的正确用法"
type: snippet
date: 2026-05-18
category: [Engineering, DevOps]
comment: 把一段提交从一个基底搬到另一个基底，三参数顺序终于记住了。
tags: [git]
duration: 10
demo: true
---

> demo 条目——交付前会被真实学习记录替换。

`git rebase --onto <newBase> <oldBase> <branch>`：把 `(oldBase, branch]` 这段提交搬到 newBase 上。

最常用的场景：feature 分支基于了错误的分支（比如基于了 main 而不是 release），用 `--onto release main feature` 平移过去。
