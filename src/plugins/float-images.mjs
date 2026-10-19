// 文章里单独成段的图片，挪到它前一段文字的前面，并标上 float-img。
// 这样图片能飘在“对应的那段文字”右边，而不是把文章切成上下两块。
// Markdown 原文不用改：图片照常写在那段文字下面就行。
//
// Astro 7 默认用 Sätteri 处理 Markdown，它的插件是“访问器”写法（不是 rehype 插件），
// 在 astro.config.mjs 里通过 satteri({ hastPlugins: [floatImages] }) 注册。

const isElement = (node, tag) => node?.type === 'element' && (!tag || node.tagName === tag);
const isBlank = (node) => node?.type === 'text' && !node.value.trim();

/** A <p> whose only real content is a single <img>. */
function isImageParagraph(node) {
	if (!isElement(node, 'p')) return false;
	const content = node.children.filter((c) => !isBlank(c));
	return content.length === 1 && isElement(content[0], 'img');
}

/** Plain copy of a node, since visitor nodes are read-only views. */
function clone(node) {
	if (node.type === 'text') return { type: 'text', value: node.value };
	if (node.type !== 'element') return { ...node };
	return {
		type: 'element',
		tagName: node.tagName,
		properties: { ...(node.properties ?? {}) },
		children: (node.children ?? []).map(clone),
	};
}

// Each picture leans and drops a little differently, like photos stuck on by hand.
// Picked in order within a page, so a page always looks the same.
const LOOKS = [
	{ tilt: 3, drop: 0, shift: 0 },
	{ tilt: -3.4, drop: 40, shift: 46 },
	{ tilt: 2, drop: 16, shift: 18 },
	{ tilt: -2.6, drop: 52, shift: 38 },
];

/** Plugin factory: called once per document, so the picture count restarts on every page. */
export const floatImages = () => {
	let count = 0;

	return {
		name: 'wawa-float-images',
		element: {
			filter: ['p'],
			visit(node, ctx) {
				if (!isImageParagraph(node)) return;

				const parent = ctx.parent(node);
				const index = ctx.indexOf(node);
				if (!parent || index === undefined) return;

				// Previous non-whitespace sibling: the paragraph this picture belongs to
				let j = index - 1;
				while (j >= 0 && isBlank(parent.children[j])) j--;
				const previous = parent.children[j];

				const look = LOOKS[count++ % LOOKS.length];
				const floated = clone(node);
				floated.properties.className = [...(floated.properties.className ?? []), 'float-img'];
				floated.properties.style = `--tilt: ${look.tilt}deg; --drop: ${look.drop}px; --shift: ${look.shift}px`;
				// Pictures show about 240px wide on the page, so generate small versions and let the
				// browser pick; the biggest one is what the click-to-enlarge viewer shows.
				// (Astro hands these attributes to its image optimiser.)
				const img = floated.children.find((c) => isElement(c, 'img'));
				if (img) {
					img.properties.widths = ['240', '480', '800'];
					img.properties.sizes = '240px';
					img.properties.width = 480;
				}

				if (isElement(previous, 'p') && !isImageParagraph(previous)) {
					ctx.removeNode(node);
					ctx.insertBefore(previous, floated);
				} else {
					ctx.replaceNode(node, floated);
				}
			},
		},
	};
};
