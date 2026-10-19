// 生成分享图 public/og.png（1200×630）：浅绿底，居中是站点标题的矢量图，旁边一只蝴蝶，没有别的文字。
// 用法：node scripts/make-og.mjs     标题或蝴蝶图换了之后重新跑一次。
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const BG = '#F2F6E6';
const INK = '#2C3823';

// 站点标题是 fill="currentColor" 的矢量图，单独渲染时要给它一个具体的颜色
const titleSvg = readFileSync('src/assets/site-title.svg', 'utf8').replace(/currentColor/g, INK);
const titleWidth = 720;
const title = await sharp(Buffer.from(titleSvg), { density: 300 }).resize({ width: titleWidth }).png().toBuffer();
const titleMeta = await sharp(title).metadata();

const butterflyHeight = 230;
const butterfly = await sharp('src/assets/deco/butterfly-blue-pink.png')
	.resize({ height: butterflyHeight })
	.png()
	.toBuffer();
const butterflyMeta = await sharp(butterfly).metadata();

const gap = 36;
const groupWidth = titleMeta.width + gap + butterflyMeta.width;
const left = Math.round((W - groupWidth) / 2);

await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
	.composite([
		{ input: title, left, top: Math.round((H - titleMeta.height) / 2) + 18 },
		{ input: butterfly, left: left + titleMeta.width + gap, top: Math.round((H - butterflyMeta.height) / 2) - 24 },
	])
	.png({ compressionLevel: 9 })
	.toFile('public/og.png');

console.log(`public/og.png ${W}×${H}`);
