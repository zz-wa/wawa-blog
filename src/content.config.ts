import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 碎碎念和读书放在同一个集合里，用 type 区分，首页按日期混排。
// 文件名就是网址：notes 在 /notes/<文件名>/，读书在 /reading/<文件名>/
const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.discriminatedUnion('type', [
		z.object({
			type: z.literal('note'),
			date: z.coerce.date(),
			// 不写就按顺序在三种颜色里轮换
			color: z.enum(['yellow', 'peach', 'cream']).optional(),
		}),
		z.object({
			type: z.literal('reading'),
			date: z.coerce.date(),
			book: z.string(),
			author: z.string(),
			// 墙上那张便利贴写的一两句感想；不写就取正文开头
			summary: z.string().optional(),
		}),
	]),
});

export const collections = { posts };
