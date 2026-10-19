import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 碎碎念和读书放在同一个集合里，用 type 区分，首页按日期混排。
// 文件名就是网址：碎碎念在 /notes/<文件名>/，读书在 /reading/<文件名>/
// 文章里的图片放在文章旁边，用相对路径（./xxx.jpg），Astro 会自动转成 WebP。
const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) => {
		const common = {
			// 发布时间，可以带时分和时区，比如 2026-10-18T20:00:00+08:00
			date: z.coerce.date(),
			// 有标题的是长文：首页只显示标题和开头一小段
			title: z.string().optional(),
			author: z.string().optional(),
			// 原来发在哪里，比如 bluesky
			source: z.string().optional(),
			// 配图：文章页里飘在正文右边。图片放在文章旁边，写相对路径，比如 ./xxx.jpg
			cover: image().optional(),
			// 配图的文字说明（读屏软件会读）
			coverAlt: z.string().optional(),
		};
		return z.discriminatedUnion('type', [
			z.object({
				type: z.literal('note'),
				...common,
				// 不写就按顺序在颜色里轮换
				color: z.enum(['yellow', 'peach', 'cream', 'blue', 'pink', 'mint']).optional(),
			}),
			z.object({
				type: z.literal('reading'),
				...common,
				book: z.string().optional(),
				// 便利贴上写的一两句感想；不写就显示正文
				summary: z.string().optional(),
			}),
		]);
	},
});

export const collections = { posts };
