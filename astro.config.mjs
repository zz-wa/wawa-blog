// @ts-check

import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { floatImages } from './src/plugins/float-images.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://wawa.blog',
	integrations: [mdx(), sitemap()],
	markdown: {
		// Pictures float beside the paragraph they belong to (see src/plugins/float-images.mjs)
		processor: satteri({ hastPlugins: [floatImages] }),
	},
});
