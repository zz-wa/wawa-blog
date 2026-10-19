import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type NoteColor = 'yellow' | 'peach' | 'cream' | 'blue' | 'pink' | 'mint';
// Round push-pin colours, mixed across the wall (see DESIGN.md)
export const PIN_COLORS = ['#d4a93f', '#e07a5f', '#6a9fd4', '#7dbe9a', '#b391d6', '#e89ab5'];

// Mixed so neighbours differ: warm, cool, warm, cool…
const NOTE_COLORS: NoteColor[] = ['yellow', 'blue', 'peach', 'mint', 'pink', 'cream'];

// Posts are written in China; show dates in Beijing time so 00:30 doesn't become "yesterday".
const TIME_ZONE = 'Asia/Shanghai';

function ymd(date: Date): { y: string; m: string; d: string } {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	return { y: get('year'), m: get('month'), d: get('day') };
}

/** 2026-10-18 — the machine-readable form, in Beijing time (for meta tags) */
export function isoDate(date: Date): string {
	const { y, m, d } = ymd(date);
	return `${y}-${m}-${d}`;
}

// Pictures that sit next to the posts (./xxx.jpg in markdown, or `cover:`), as Astro image objects
const postPictures = import.meta.glob<ImageMetadata>('/src/content/posts/*.{jpg,jpeg,png,webp}', {
	eager: true,
	import: 'default',
});

/**
 * Share picture for a post: its cover, else the first picture in the body, as a site-root path
 * to an optimised JPEG (JPEG because chat apps and link previews all read it). undefined = use og.png.
 */
/** The picture that belongs to a post (its cover, else the first picture in the body), as an Astro image object */
export function pictureFor(post: Post): ImageMetadata | undefined {
	if (post.data.cover) return post.data.cover;
	const m = (post.body ?? '').match(/!\[[^\]]*\]\(\.\/([^)\s]+)\)/);
	return m ? postPictures[`/src/content/posts/${m[1]}`] : undefined;
}

export async function ogImageFor(post: Post): Promise<string | undefined> {
	let source: ImageMetadata | undefined = post.data.cover;
	if (!source) {
		const m = (post.body ?? '').match(/!\[[^\]]*\]\(\.\/([^)\s]+)\)/);
		if (m) source = postPictures[`/src/content/posts/${m[1]}`];
	}
	if (!source) return undefined;
	return (await getImage({ src: source, width: Math.min(1200, source.width), format: 'jpeg' })).src;
}

/** 2026.10.18 */
export function formatDate(date: Date): string {
	const { y, m, d } = ymd(date);
	return `${y}.${m}.${d}`;
}

export function seasonOf(date: Date): { name: string; flower: string } {
	const m = Number(ymd(date).m);
	if (m >= 3 && m <= 5) return { name: '春', flower: '🌱' };
	if (m >= 6 && m <= 8) return { name: '夏', flower: '🍃' };
	if (m >= 9 && m <= 11) return { name: '秋', flower: '🌼' };
	return { name: '冬', flower: '❄' };
}

export const byDateDesc = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf();

/** Plain text of a post body, for length checks and excerpts. Images are dropped entirely. */
export function plainText(post: Post): string {
	return (post.body ?? '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their text
		.replace(/<[^>]+>/g, '') // MDX / HTML tags
		.replace(/\\$/gm, '') // hard line-break backslashes
		.replace(/^\s*>\s?/gm, '') // blockquote markers
		.replace(/[#*_`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** First ~n characters of the body, with an ellipsis if cut. */
export function excerpt(post: Post, n = 40): string {
	const chars = [...plainText(post)];
	return chars.length > n ? `${chars.slice(0, n).join('')}…` : chars.join('');
}

/** Notes longer than this are clipped on the wall and get a "读完" link. */
export const NOTE_SHORT_LIMIT = 220;

export function postHref(post: Post): string {
	return post.data.type === 'reading' ? `/reading/${post.id}/` : `/notes/${post.id}/`;
}

/** Stable pseudo-random number in [0, 1) from a string, so a note looks the same on every build. */
function rand(seed: string): number {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	h ^= h >>> 13;
	h = Math.imul(h, 0x5bd1e995);
	h ^= h >>> 15;
	return (h >>> 0) / 4294967296;
}

/** A number in [0, 1) that is fixed for this post id and salt — never changes between builds or refreshes. */
export function seeded(id: string, salt: string): number {
	return rand(`${id}:${salt}`);
}

const between = (r: number, min: number, max: number) => Math.round(min + r * (max - min));

export type WallLook = {
	width: number;
	tilt: number;
	dx: number;
	dy: number;
	marginTop: number;
	marginLeft: number;
	pinColor: string;
	/** horizontal pin position, % from the left edge */
	pinX: number;
	/** Uneven rounded corners, e.g. "14px 9px 17px 11px" */
	radius: string;
	curl: boolean;
	color: NoteColor;
};

/**
 * Everything that makes a note look hand-stuck instead of laid out:
 * width tier, tilt within ±6°, small offsets, pin colour and spot, a curled corner now and then.
 * All derived from the post id, so it never changes between refreshes.
 */
export function wallLook(post: Post, index: number): WallLook {
	const r = (salt: string) => rand(`${post.id}:${salt}`);
	const isReading = post.data.type === 'reading';

	const widths = isReading ? [320, 350, 390] : [210, 250, 300];
	const width = widths[Math.floor(r('w') * widths.length)];

	// How far it leans is random (1.5°–6°); which way alternates along the wall,
	// so neighbouring notes never all lean the same direction.
	const lean = 1.5 + r('t') * 4.5;
	const tilt = index % 2 === 0 ? -lean : lean;

	const color: NoteColor = isReading
		? 'cream'
		: (post.data.color ?? NOTE_COLORS[index % NOTE_COLORS.length]);

	return {
		width,
		tilt: Math.round(tilt * 10) / 10,
		dx: between(r('x'), -14, 14),
		dy: between(r('y'), -12, 16),
		marginTop: between(r('mt'), 0, 48),
		// negative left margin lets neighbours overlap a little
		marginLeft: between(r('ml'), -18, 14),
		pinColor: PIN_COLORS[Math.floor(r('p') * PIN_COLORS.length)],
		pinX: between(r('px'), 38, 62),
		radius: ['r1', 'r2', 'r3', 'r4'].map((k) => `${between(r(k), 8, 18)}px`).join(' '),
		curl: !isReading && r('c') < 0.35,
		color,
	};
}
