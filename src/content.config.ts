import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 碎碎念和读书放在同一个集合里，用 type 区分，首页按日期混排。
// 文件名就是网址：碎碎念在 /notes/<文件名>/，读书在 /reading/<文件名>/
const common = {
	// 发布时间，可以带时分和时区，比如 2026-10-18T20:00:00+08:00
	date: z.coerce.date(),
	// 有标题的是长文：墙上只显示标题和开头一小段
	title: z.string().optional(),
	author: z.string().optional(),
	// 原来发在哪里，比如 bluesky
	source: z.string().optional(),
	// 配图：墙上的便利贴里会显示这张小图，文章页里飘在正文右边。路径放在 public/ 下，比如 /images/xxx.jpg
	cover: z.string().optional(),
};

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.discriminatedUnion('type', [
		z.object({
			type: z.literal('note'),
			...common,
			// 不写就按顺序在三种颜色里轮换
			color: z.enum(['yellow', 'peach', 'cream']).optional(),
		}),
		z.object({
			type: z.literal('reading'),
			...common,
			book: z.string().optional(),
			// 墙上那张便利贴写的一两句感想；不写就显示正文
			summary: z.string().optional(),
		}),
	]),
});

export const collections = { posts };
