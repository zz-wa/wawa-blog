// 绳子的画法。
// catmull()、noise()、buildRope()、pointAt() 四个函数逐行对应 public/admin/rope.html（编辑页）里的
// catmull / noise / build / pointAt，算法保持完全一致，网站上的绳子才会和编辑页里一模一样。
// 改这里之前先想清楚：改了算法，编辑页导出的配置在网站上就会画出不一样的绳子。
// 绳子在构建时算好，输出成 <path> 的 d，浏览器里不再计算。

export interface RopeBead {
	/** 沿绳子走的比例：0 是绳头，1 是绳尾 */
	s: number;
	/** 球钉颜色编号 0–4 */
	color: number;
}

export interface RopeConfig {
	version: number;
	/** 画布宽高（700 宽的坐标系） */
	width: number;
	height: number;
	/** 绳子经过的弯点 */
	points: [number, number][];
	/** 起伏的幅度，和 seed 一起决定起伏的样子 */
	wobble: number;
	seed: number;
	thickness: number;
	ropeColor: string;
	twist: boolean;
	beadSize: number;
	beads: RopeBead[];
}

interface CurvePoint {
	x: number;
	y: number;
	seg: number;
}

export interface RopePoint extends CurvePoint {
	/** 起伏之前（平滑曲线上）的位置 */
	bx: number;
	by: number;
}

export interface RopeSamples {
	pts: RopePoint[];
	/** 沿绳子累计的长度 */
	cum: number[];
	total: number;
}

export function catmull(pts: [number, number][]): CurvePoint[] {
	const out: CurvePoint[] = [];
	const n = pts.length;
	const P = [pts[0], ...pts, pts[n - 1]];
	for (let i = 1; i < P.length - 2; i++) {
		const p0 = P[i - 1];
		const p1 = P[i];
		const p2 = P[i + 1];
		const p3 = P[i + 2];
		for (let k = 0; k < 14; k++) {
			const t = k / 14;
			const t2 = t * t;
			const t3 = t2 * t;
			out.push({
				x:
					0.5 *
					(2 * p1[0] +
						(-p0[0] + p2[0]) * t +
						(2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
						(-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
				y:
					0.5 *
					(2 * p1[1] +
						(-p0[1] + p2[1]) * t +
						(2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
						(-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
				seg: i - 1,
			});
		}
	}
	out.push({ x: pts[n - 1][0], y: pts[n - 1][1], seg: n - 2 });
	return out;
}

export function noise(t: number, seed: number): number {
	return (
		(Math.sin(t * 0.9 + seed * 1.7) + 0.6 * Math.sin(t * 2.3 + seed * 3.1) + 0.35 * Math.sin(t * 5.1 + seed * 0.7)) / 1.95
	);
}

/** 编辑页里的 build()：先走平滑曲线，再沿法线按噪声起伏，两头逐渐收住（taper）。 */
export function buildRope(cfg: Pick<RopeConfig, 'points' | 'wobble' | 'seed'>): RopeSamples {
	const base = catmull(cfg.points);
	const len = [0];
	for (let i = 1; i < base.length; i++) {
		len[i] = len[i - 1] + Math.hypot(base[i].x - base[i - 1].x, base[i].y - base[i - 1].y);
	}
	const pts: RopePoint[] = base.map((p, i) => {
		const a = base[Math.max(0, i - 1)];
		const b = base[Math.min(base.length - 1, i + 1)];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const d = Math.hypot(dx, dy) || 1;
		const taper = Math.min(1, len[i] / 50, (len[len.length - 1] - len[i]) / 50);
		const o = cfg.wobble * noise(len[i] / 38, cfg.seed) * taper;
		return { x: p.x + (-dy / d) * o, y: p.y + (dx / d) * o, seg: p.seg, bx: p.x, by: p.y };
	});
	const cum = [0];
	for (let i = 1; i < pts.length; i++) {
		cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
	}
	return { pts, cum, total: cum[cum.length - 1] };
}

/** 编辑页里的 pointAt()：绳子上走了 s（0–1）的那个点。 */
export function pointAt(samples: RopeSamples, s: number): { x: number; y: number } {
	const L = samples.cum;
	const P = samples.pts;
	const t = s * samples.total;
	let lo = 0;
	let hi = L.length - 1;
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (L[m] <= t) lo = m;
		else hi = m;
	}
	const f = (t - L[lo]) / (L[hi] - L[lo] || 1);
	return { x: P[lo].x + (P[hi].x - P[lo].x) * f, y: P[lo].y + (P[hi].y - P[lo].y) * f };
}

/** 绳子的 <path d="…">（编辑页里的画法：折线连起所有采样点，保留一位小数）。 */
export function ropePathD(samples: RopeSamples): string {
	const P = samples.pts;
	let d = `M${P[0].x.toFixed(1)} ${P[0].y.toFixed(1)}`;
	for (let i = 1; i < P.length; i++) d += `L${P[i].x.toFixed(1)} ${P[i].y.toFixed(1)}`;
	return d;
}

/** 麻绳纹理：同一条路径再叠一层虚线，虚线长度是粗细的 0.45 倍，间隔 1.05 倍。 */
export function twistDash(thickness: number): string {
	return `${(thickness * 0.45).toFixed(2)} ${(thickness * 1.05).toFixed(2)}`;
}

/** 两头的线头：每头三根短线（编辑页里 k = -1, 0, 1），返回每根的 d。 */
export function frayPaths(samples: RopeSamples): string[] {
	const P = samples.pts;
	const a = P[0];
	const b = P[3];
	const c = P[P.length - 1];
	const e = P[P.length - 4];
	const out: string[] = [];
	for (const [from, toward] of [
		[a, b],
		[c, e],
	]) {
		for (let k = -1; k <= 1; k++) {
			const ang = Math.atan2(toward.y - from.y, toward.x - from.x) + Math.PI + k * 0.45;
			out.push(`M${from.x} ${from.y}l${(Math.cos(ang) * 9).toFixed(1)} ${(Math.sin(ang) * 9).toFixed(1)}`);
		}
	}
	return out;
}

/** 球钉颜色：每种有 [亮, 主色, 暗] 三个色（渐变用），见 DESIGN.md「首页更新：结绳记事」。 */
export const BEAD_COLORS: [string, string, string][] = [
	['#D9BFBD', '#C8A6A4', '#A98481'], // 灰粉
	['#B5C4D1', '#9DAFBF', '#7C90A3'], // 雾蓝
	['#BCC9B6', '#A5B59E', '#86987F'], // 鼠尾草绿
	['#DCCBA8', '#CDB78F', '#AE9A70'], // 燕麦黄
	['#C6B8CA', '#B3A2B8', '#92819A'], // 藕紫
];
