// 手写字体瘦身：只留下网站用到的字，输出 woff2 到 public/fonts/。
// 用法：node scripts/subset-font.mjs        （需要 pip install fonttools brotli，命令写在 README 里）
// 新增、修改文章之后重新运行一次，不然新字会退回楷体。
// 原字体（完整）放在 font-src/，不会被网站发布出去。
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const SOURCE = 'font-src/pingfang-satuo.ttf';
const OUT = 'public/fonts/pingfang-satuo-v2.woff2'; // 以后重新生成就把 v1 改成 v2，访客浏览器才会更新
const SCAN = ['src', 'public/admin'];
const EXT = new Set(['.md', '.mdx', '.astro', '.ts', '.json', '.html', '.mjs']);

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) yield* walk(p);
		else if (EXT.has(extname(p))) yield p;
	}
}

const chars = new Set();
// 基本拉丁字符 + 常用标点（全角、中文引号、省略号、破折号等）
for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCodePoint(c));
for (const c of '，。、；：？！“”‘’（）《》〈〉【】—…·～「」『』￥％＋－＝×÷→←↑↓· ') chars.add(c);

for (const dir of SCAN) {
	for (const file of walk(dir)) {
		for (const ch of readFileSync(file, 'utf8')) {
			const cp = ch.codePointAt(0);
			// 汉字、全角标点、日常用到的符号；英文字母已经全收了
			if ((cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xff00 && cp <= 0xffef) || (cp >= 0x2010 && cp <= 0x206f)) chars.add(ch);
		}
	}
}

mkdirSync('public/fonts', { recursive: true });
const textFile = 'font-src/used-chars.txt';
writeFileSync(textFile, [...chars].join(''));
execFileSync(
	'pyftsubset',
	[SOURCE, `--text-file=${textFile}`, '--flavor=woff2', `--output-file=${OUT}`, '--layout-features=*', '--no-hinting', '--desubroutinize'],
	{ stdio: 'inherit' },
);
console.log(`${chars.size} 个字 → ${OUT}（${(statSync(OUT).size / 1024).toFixed(0)} KB）`);
