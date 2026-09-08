import type { APIRoute } from "astro";
import { getBacklog, getLearned } from "../lib/content";
import { buildGraph } from "../lib/graph/builder";
import { applyLayout } from "../lib/graph/layout";

/** 构建期产出带预计算坐标的图数据（客户端零布局成本，坐标可 diff 审阅） */
export const GET: APIRoute = async () => {
  const learned = await getLearned();
  const backlog = await getBacklog();
  const graph = applyLayout(buildGraph(learned, backlog));
  return new Response(JSON.stringify(graph), {
    headers: { "Content-Type": "application/json" },
  });
};
