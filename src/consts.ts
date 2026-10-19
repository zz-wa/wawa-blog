// 全站文字都集中在这里，改这里就行。

export const SITE_TITLE = 'wawa';
export const SITE_NAME = 'wawa 的碎碎念';
export const SITE_DESCRIPTION = 'hi 这里是 wawa，分享日常碎碎念和最近在读的书。';

// 首页打招呼
export const GREETING = 'hi 这里是wawa 随便看叭～';
export const INTRO = '分享日常碎碎念。';

// 首页那张用胶带贴着的便利贴：label 写“最近在读”或“最近在做”
export const NOW = {
	label: '最近在读',
	text: '《皮囊》蔡崇达',
};

// 不挂在绳子上、单独放在首页两边空白处的几条（id = 文件名去掉 .md；side = right 右边 / left 左边 / hero 标题下面的空白处，横着），同一边的按这里的顺序从上往下排
export const STANDALONE_POSTS = [
	{ id: '2025-08-03-li-juan-xie-a-xie', side: 'right' },
	{ id: '2025-10-21-gui-hua', side: 'hero' },
] as const;
