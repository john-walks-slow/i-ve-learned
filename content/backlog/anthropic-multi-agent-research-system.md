---
title: "How we built our multi-agent research system"
type: blog
date: 2026-09-15
category: [AI, Multi-Agent]
comment: Anthropic 解密 Claude Research 多 Agent 编排架构、工具设计、Prompt 经验与评测实践。
url: https://www.anthropic.com/engineering/multi-agent-research-system
tags: [multi-agent, claude, orchestrator, prompt-engineering, evals]
est: 45
source: Anthropic Engineering
why: 学习工业级复杂多 Agent 协同系统（Orchestrator-Worker 架构、Context 隔离与压缩、Tool 自反思优化与 LLM-as-a-judge 评估）的工程落地方案与避坑经验。
status: todo
---

## 核心要点与脉络

Anthropic 官方工程博客详细复盘了 Claude「深度研究（Research）」功能背后的多 Agent 系统架构、Prompt 工程经验、评测体系及生产可靠性挑战。

### 1. 为什么研究场景需要多 Agent？

- **动态性与路径依赖**：开放式深度研究无法用固定的线性 Pipeline 预定义步骤。
- **搜索的本质是压缩（Compression）**：子 Agent 各自拥有独立的 Context Window，在独立分支里探索并将重要信息提炼，避免主 Agent 受到中间杂音干扰。
- **有效扩展 Token 预算**：在 BrowseComp 评测中，Token 消耗量解释了 80% 的效果方差（多 Agent 系统约消耗传统对话 15× 的 Token）。通过 Claude Opus 4 主控 + Claude Sonnet 4 子 Agent 的组合，评测准确率相比单 Agent Opus 4 提升 90.2%。

### 2. 核心系统架构（Orchestrator-Worker）

1. **LeadResearcher（主编排器）**：
   - 深度思考并制定探索规划，将 Plan 存入外部 Memory 持久化（应对 >200k Token 上下文截断）。
   - 动态调度、创建并并行唤起子 Agent。
2. **Subagents（专业子 Agent）**：
   - 拥有独立上下文，并行调用 Web 搜索等工具。
   - 使用 **Interleaved Thinking** 在每次工具调用结果返回后评估质量、发现信息差并调整后续查询。
3. **CitationAgent（引用代理）**：
   - 退出研究主循环后介入，统一对齐文档与最终报告，进行逐句引用核验与标注，保障溯源可靠性。

### 3. Prompt Engineering 关键实践

- **Teach delegation explicitly**：主 Agent 拆解任务时必须给出明确的目标、输出结构、工具边界，避免子 Agent 重复搜索相同年份或主题。
- **Scale effort to query complexity**：硬性约束资源规模（简单事实 1 个 Agent、对比分析 2-4 个、复杂调研 >10 个）。
- **Let agents improve tools**：构建 Tool-testing Agent 专门测试 MCP 工具并重写工具描述（优化后任务完成时间下降 40%）。
- **Start wide, then narrow down**：启发式引导 Agent 先宽后窄，先获取全景再定向深挖。

### 4. 评测与生产可靠性

- **Evals**：早期 20 个真实 Query 小样本快速迭代；单个 LLM-as-judge（综合多维度打分与 Pass/Fail）比多个裁判更稳定；人工 Eval 发现 Agent 偏好 SEO 农场内容的偏差。
- **生产韧性**：长链路状态持久化与断点续跑；全链路 Tracing；采用 Rainbow Deployments（彩虹部署）避免中断运行中的长任务 Agent。
