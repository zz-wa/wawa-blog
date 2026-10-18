import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type NoteColor = 'yellow' | 'peach' | 'cream';
// Round push-pin colours, mixed across the wall (see DESIGN.md)
export const PIN_COLORS = ['#d4a93f', '#e07a5f', '#6a9fd4', '#7dbe9a', '#b391d6', '#e89ab5'];

const NOTE_COLORS: NoteColor[] = ['yellow', 'peach', 'cream'];

/** 2026.10.18 */
export function formatDate(date: Date): string {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, '0');
	const d = String(date.getUTCDate()).padStart(2, '0');
	return `${y}.${m}.${d}`;
}

export function seasonOf(date: Date): { name: string; flower: string } {
	const m = date.getUTCMonth() + 1;
	if (m >= 3 && m <= 5) return { name: '春', flower: '🌱' };
	if (m >= 6 && m <= 8) return { name: '夏', flower: '🍃' };
	if (m >= 9 && m <= 11) return { name: '秋', flower: '🌼' };
	return { name: '冬', flower: '❄' };
}

export const byDateDesc = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf();

/** Plain text of a post body, for length checks and excerpts. */
export function plainText(post: Post): string {
	return (post.body ?? '')
		.replace(/<[^>]+>/g, '')
		.replace(/[#>*_`[\]()-]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Notes longer than this are clipped on the wall and get a "读完" link. */
export const NOTE_SHORT_LIMIT = 140;

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

	const widths = isReading ? [300, 330, 360] : [190, 230, 270];
	const width = widths[Math.floor(r('w') * widths.length)];

	let tilt = (r('t') * 2 - 1) * 6;
	if (Math.abs(tilt) < 1.2) tilt = tilt < 0 ? -1.2 - Math.abs(tilt) : 1.2 + tilt;

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
