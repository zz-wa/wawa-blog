# wawa.blog

wawa 的碎碎念：碎碎念和读书分享，挂在一条细麻绳上。Astro 做的纯静态网站，推送到 `main` 之后 Cloudflare 自动构建、上线。

所有颜色、字体、版式的决定都在 [`DESIGN.md`](./DESIGN.md)，改样式之前先看它。

## 本地运行

```sh
npm install
npm run dev      # 本地预览，打开 http://localhost:4321
npm run build    # 构建到 dist/（和 Cloudflare 上跑的一样，上线前先跑一遍确认没报错）
```

> 改了依赖（`npm install` / `npm uninstall`）之后，要用 npm 10 重新生成 `package-lock.json`，不然 Cloudflare 上构建会失败：
> `npx npm@10.9.2 install`，再 `rm -rf node_modules && npx npm@10.9.2 ci && npm run build` 确认一下。

## 写新文章

在 `src/content/posts/` 里新建一个 `.md` 文件，文件名就是网址（`2026-11-02-xxx.md` → `/notes/2026-11-02-xxx/`）。文件开头这样写：

```md
---
date: 2026-11-02T20:00:00+08:00   # 发布时间，必填
type: note                         # note = 碎碎念，reading = 读书，必填
title: "可选的标题"                 # 有标题的文章，首页只显示标题和开头约 40 个字
author: "可选，读书摘抄写作者"
source: bluesky                    # 可选，原来发在哪里，页面上不显示
cover: ./xxx.jpg                   # 可选，配图（图片放在文章旁边）
coverAlt: 配图的文字说明
---

正文。行末的反斜杠 \ 是换行。

![图片说明](./xxx.jpg)
```

- 文章里的图片放在文章旁边，用相对路径 `./xxx.jpg`，Astro 会自动转成 WebP、出几档尺寸。**不要**放进 `public/`，放进去就不会被优化。
- 想用“小声嘀咕”（桂花点）：文件后缀改成 `.mdx`，正文里写 `<Whisper>要嘀咕的话</Whisper>`。
- 没有标题、不超过 60 字的碎碎念，在首页的便利贴上完整显示；再长的像有标题的一样，只显示开头约 40 个字。

## 首页的绳子（结绳记事）

首页的便利贴挂在一条弯曲的绳子上。绳子的走向、每张便利贴挂在哪里、球钉用什么颜色，都由 `src/data/rope.json` 决定。这个文件**不要手改**，用编辑页拖出来：

1. 打开编辑页：**`https://wawa.blog/admin/rope.html`**（本地预览是 `http://localhost:4321/admin/rope.html`）。
   这个页面没有任何链接指向它，也不在 sitemap 里，页面里写了 `noindex`，自己记住地址就行。
2. 拖动调整：
   - 拖黄色的圆点 = 改绳子的弯（双击绳子加一个弯点，选中后按 Delete 删掉）
   - 拖球钉 = 改便利贴挂的位置（选中球钉后按左右方向键可以微调）
   - 右边面板里可以改绳子的粗细、起伏、球钉大小和颜色，“换一种起伏”会换一个种子，“便利贴均匀分布”会把球钉重新排匀
3. 点 **“导出配置”**，内容会复制到剪贴板（也显示在下面的文本框里）。
4. 把复制的内容**整个覆盖**到仓库里的 `src/data/rope.json`。
5. `npm run build` 看一眼没报错，提交并推送到 `main`，几分钟后网站上就是新的绳子。

说明：

- 编辑页是纯静态的，**不会**改动网站的任何东西，只负责生成配置，所以不需要登录。编辑页会把没导出的修改记在浏览器里（localStorage），换一台电脑要重新来或者用“导入配置”粘贴。
- 一根绳子挂 `rope.json` 里 `beads` 那么多张便利贴（现在是 9 张）。文章多于这个数时，更早的会放到下一页（`/2/`、`/3/` …），用同一根绳子。想让一页挂得更多，就在编辑页里把球钉加到更多（目前编辑页里球钉数量等于它自带的示例文章数 9，要加的话需要改编辑页，不是改网站）。
- 手机（屏幕宽度小于 600px）不用这条蛇形绳子，会自动换成一条竖直、轻微弯曲的绳子，便利贴左右交替挂着；起伏用同样的算法和种子。所以在编辑页里只需要照顾宽屏的样子。
- 绳子的画法在 `src/lib/rope.ts`，和编辑页里的算法逐行对应，两边必须保持一致，不然编辑页里的样子和网站上不一样。

## 其他会用到的

- **分享图**：`public/og.png`（1200×630），标题或蝴蝶图换了之后运行 `node scripts/make-og.mjs` 重新生成。
- **标题**：“wawa 的碎碎念”是用手写字体画成的矢量图 `src/assets/site-title.svg`，要改标题文字用 `scripts/make-title-svg.py`（需要先 `pip install fonttools`，命令写在脚本开头）。
- **缓存**：`public/_headers` 给 `/_astro/`、`/fonts/`、`/images/` 设了长缓存。字体文件名是固定的，以后换字体就改文件名（比如加 `-v2`），不然访客的浏览器会一直用旧的。
- **字体瘦身**：完整字体在 `font-src/pingfang-satuo.ttf`（不发布）；网站用的是只留下文章和页面里用到的字的 `public/fonts/pingfang-satuo-v1.woff2`（约 270 KB）。**每次新增或修改文章之后**重新生成一次，不然新字会退回楷体：
  ```sh
  pip install fonttools brotli      # 只需要装一次
  node scripts/subset-font.mjs
  ```
  重新生成后把脚本里的 `v1` 改成 `v2`（同时改 `global.css` 和 `BaseHead.astro` 里的文件名），访客的浏览器才会下载新的。
- **Google Search Console**：要自己去提交 `https://wawa.blog/sitemap-index.xml`。

## 目录

```
public/            原样复制到网站上的文件（瘦身后的字体、分享图、robots.txt、编辑页 admin/rope.html）
font-src/          完整的原字体和用到的字表（不发布到网站上）
src/content/posts/ 文章和文章里的图片
src/data/rope.json 绳子的配置（用编辑页导出，不要手改）
src/lib/rope.ts    绳子的算法
src/components/    RopeTimeline（首页的绳子）、PhotoWall（照片墙）、Whisper（小声嘀咕）等
src/pages/         首页（带分页）、/notes/、/reading/、RSS
src/assets/        会被 Astro 优化的图片（蝴蝶、标题）
scripts/           生成分享图、标题矢量图的小脚本
DESIGN.md          设计说明
```
