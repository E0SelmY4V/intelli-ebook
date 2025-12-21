/// <reference path="../../public/common.ts" />

import Block = PandocTypes.Block;
import Header = PandocTypes.Header;
import PandocJSON = PandocTypes.PandocJSON;

/**
 * 给块按照 `level` 级标题分组
 * @param blocks 一堆文档块
 * @param level 当前分到多少级标题
 * @returns `sum` 是这堆文档块开头不属于任何标题的内容， `groups` 是每个标题及对应的内容
 */
function groupify(blocks: Block[], level: number) {
	const sum: Block[] = [];
	let grouping: Block[] | null = null;
	const groups: [Header, Block[]][] = [];
	for (const block of blocks) {
		if (block.t !== 'Header' || block.c[0] > level) {
			(grouping ?? sum).push(block);
			continue;
		}
		if (block.c[0] < level) panic(getError('解析等级小于内容等级', level, block, blocks));
		grouping = [];
		groups.push([block, grouping]);
	}
	return { sum, groups };
}

/**分完组的书 */
export type GroupedBook = Grouped | Block[];
/**被拆分的部分 */
export interface Grouped {
	/**最前头不属于任何标题的内容 */
	sum: Block[];
	/**之后的每级标题及内容 */
	content: Map<Header, GroupedBook>;
}
/**
 * 分组整个文章
 * @param blocks 文章的一堆块
 * @param least 最少分到第几级标题
 * @param levelNow 当前分到的标题
 */
export function groupifyAll(blocks: Block[], least: number, levelNow = 2): GroupedBook {
	if (levelNow > least) return blocks;
	const { sum, groups } = groupify(blocks, levelNow);
	return {
		sum,
		content: new Map(groups.map(
			([header, blocks]) => [header, groupifyAll(blocks, least, levelNow + 1)],
		)),
	};
}

/**页面文章渲染器 */
export class Renderer {
	protected static decoder = new TextDecoder('utf-8');
	protected readonly groupedBook: GroupedBook;
	/**
	 * 分组整个文章
	 * @param pandoc 初始化过的 pandoc 类
	 * @param content 文章的 PandocJSON
	 * @param least 最少分到第几级标题
	 */
	constructor(
		protected readonly pandoc: Pandoc,
		protected readonly content: PandocJSON,
		protected readonly least: number,
	) {
		this.groupedBook = groupifyAll(content.blocks, least);
	}
	protected getPandocJSON(this: this, blocks: Block[]): PandocJSON {
		return {
			blocks,
			'pandoc-api-version': this.content['pandoc-api-version'],
			meta: {},
		};
	}
	protected pandocToHtml(this: this, blocks: Block[]): string {
		return Renderer.decoder.decode(this.pandoc.parseSync(
			'-f json -t html --mathjax',
			JSON.stringify(this.getPandocJSON(blocks)),
		).data);
	}
	protected geleBody(this: this, ...[blocks, ele]: [Block[]] | [HTMLDivElement, HTMLDivElement]): HTMLDivElement {
		const div = gele('div', {
			className: 'show_body',
			hidden: true,
		});
		if (Array.isArray(blocks)) {
			div.innerHTML = this.pandocToHtml(blocks);
		} else {
			div.appendChild(blocks);
			div.appendChild(ele!);
		}
		return div;
	}
	protected geleHeader(this: this, header: Header): HTMLDivElement {
		const innerHTML = this.pandocToHtml([header]);
		return gele('div', {
			innerHTML,
			className: 'show_header',
		});
	}
	protected geleGrouped(this: this, groupedBook: GroupedBook): HTMLDivElement {
		if (Array.isArray(groupedBook)) return this.geleBody(groupedBook);
		const { sum, content } = groupedBook;
		const sumEle = this.geleBody(sum);
		sumEle.hidden = false;
		const bodyEles = [sumEle];
		const headerEles: HTMLDivElement[] = [];
		content.forEach((body, header) => {
			const headerEle = this.geleHeader(header);
			const bodyEle = this.geleGrouped(body);
			headerEle.onclick = () => {
				bodyEles.forEach(n => n.hidden = true);
				bodyEle.hidden = false;
			};
			headerEles.push(headerEle);
			bodyEles.push(bodyEle);
		});
		return this.geleBody(
			gele('div', {
				nodes: headerEles,
				className: 'show_header_box',
			}),
			gele('div', {
				nodes: bodyEles,
				className: 'show_body_box',
			}),
		);
	}
	/**构建主元素 */
	build(): HTMLDivElement {
		const div = this.geleGrouped(this.groupedBook);
		div.hidden = false;
		return div;
	}
}

