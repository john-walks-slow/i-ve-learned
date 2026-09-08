import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { backlogSchema, learnedSchema } from "./lib/schema";

/**
 * 两个 markdown 目录 = 两个 collection（`_*` 前缀被排除，留给模板）。
 * Schema 定义在 src/lib/schema.ts（纯 zod，可单测）；这里是 Astro 的接线处。
 */
export const collections = {
  learned: defineCollection({
    loader: glob({ base: "./content/learned", pattern: "**/[^_]*.md" }),
    schema: learnedSchema,
  }),
  backlog: defineCollection({
    loader: glob({ base: "./content/backlog", pattern: "**/[^_]*.md" }),
    schema: backlogSchema,
  }),
};
