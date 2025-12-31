/// <reference path="../../public/common.ts" />

import Block = PandocTypes.Block;
import Header = PandocTypes.Header;
import PandocJSON = PandocTypes.PandocJSON;
import Plain = PandocTypes.Plain;

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
	/**解析 File 用的*/
	protected static decoder = new TextDecoder('utf-8');
	/**图片文件的位置 */
	static readonly imgFolder = '/api/upload/files/';
	/**被分组后的文章 */
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
	private getPandocJSON(this: this, blocks: Block[]): PandocJSON {
		return {
			blocks,
			'pandoc-api-version': this.content['pandoc-api-version'],
			meta: {},
		};
	}
	/**
	 * 把 pandoc 变成 HTML
	 * @param blocks pandoc 内容
	 * @returns 得到的 html
	 */
	protected pandocToHtml(this: this, blocks: Block[]): string {
		return Renderer.decoder.decode(this.pandoc.parseSync(
			'-f json -t html --mathjax',
			JSON.stringify(this.getPandocJSON(blocks)),
		).data);
	}
	/**
	 * 隐藏一个元素
	 * @param ele 要被操作的元素
	 */
	protected hide(ele: HTMLElement) {
		ele.hidden = true;
		ele.style.display = 'none';
	}
	/**
	 * 显示一个元素
	 * @param ele 要被操作的元素
	 */
	protected show(ele: HTMLElement) {
		ele.hidden = false;
		ele.style.display = '';
	}
	/**
	 * 得到 show_body ，给内容或者标题和内容 div
	 */
	protected geleBody(this: this, ...[blocks, ele]: [Block[]] | [HTMLDivElement, HTMLDivElement]): HTMLDivElement {
		const div = gele('div', {
			className: ele
				? 'show_body show_body_grouped'
				: 'show_body show_body_text',
		});
		this.hide(div);
		if (Array.isArray(blocks)) {
			div.innerHTML = this
				.pandocToHtml(blocks)
				.replaceAll('src="', `src="${Renderer.imgFolder}`);
		} else {
			div.appendChild(blocks);
			div.appendChild(ele!);
		}
		return div;
	}
	/**
	 * 得到 show_header
	 * @param header pandoc 格式的标题
	 */
	protected geleHeader(this: this, header: Header): HTMLDivElement {
		const innerHTML = this.pandocToHtml([{ t: 'Plain', c: header.c[2] } satisfies Plain]);
		return gele('div', {
			innerHTML,
			className: 'show_header',
		});
	}
	/**
	 * 递归得到 show_body
	 * @param groupedBook 分好的组
	 */
	protected geleGrouped(this: this, groupedBook: GroupedBook): HTMLDivElement {
		if (Array.isArray(groupedBook)) return this.geleBody(groupedBook);
		const { sum, content } = groupedBook;
		const sumEle = this.geleBody(sum);
		const map = new Map(
			content
				.entries()
				.map(([header, body]) => [this.geleHeader(header), this.geleGrouped(body)]),
		);
		let clicked: ReturnType<Renderer['geleHeader']> | null = null;
		map.forEach((body, header) => {
			header.onclick = () => {
				const clickedBody = clicked ? map.get(clicked) ?? panic(Error()) : sumEle;
				clicked?.classList.remove('show_header_clicked');
				if (clicked === header) {
					clicked = null;
					this.hide(body);
					this.show(sumEle);
				} else {
					clicked = header;
					this.hide(clickedBody);
					this.show(body);
					header.classList.add('show_header_clicked');
				}
			};
		});
		this.show(sumEle);
		return this.geleBody(
			gele('div', {
				nodes: map.keys().flatMap(v => [v, gele('hr')]),
				className: map.size ? 'show_header_box' : '',
			}),
			gele('div', {
				nodes: [sumEle, ...map.values()],
				className: 'show_body_box',
			}),
		);
	}
	/**构建主元素 */
	build(): HTMLDivElement {
		const div = this.geleGrouped(this.groupedBook);
		this.show(div);
		return div;
	}
}

