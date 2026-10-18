import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_NAME } from '../consts';
import { byDateDesc, formatDate, plainText, postHref } from '../utils';

export async function GET(context) {
	const posts = (await getCollection('posts')).sort(byDateDesc);

	return rss({
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title:
				post.data.title ??
				(post.data.type === 'reading'
					? post.data.book
						? `读《${post.data.book}》`
						: `读书 ${formatDate(post.data.date)}`
					: `碎碎念 ${formatDate(post.data.date)}`),
			description:
				post.data.type === 'reading' && post.data.summary
					? post.data.summary
					: plainText(post).slice(0, 120),
			pubDate: post.data.date,
			link: postHref(post),
		})),
	});
}
