/// <reference path="../../public/common.ts" />

import Block = PandocTypes.Block;
import Header = PandocTypes.Header;
import PandocJSON = PandocTypes.PandocJSON;
import Plain = PandocTypes.Plain;

import { groupifyAll, GroupedBook } from './group';

/**把 pandoc 变成 HTML 的 */
class Htmlifier {
	/**解析 File 用的*/
	protected static decoder = new TextDecoder('utf-8');
	constructor(
		/**Pandoc 实例 */
		protected readonly pandoc: Pandoc,
		/**用于元数据的 Pandoc 内容整体 */
		protected readonly content: PandocJSON,
	) { }
	/**
	 * 给 Pandoc 块添加元数据，包装为完整 Pandoc JSON
	 * @param blocks Pandoc 块
	 * @returns 完整的 Pandoc JSON
	 */
	wrap(this: this, blocks: Block[]): PandocJSON {
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
	trans(this: this, blocks: Block[] | Block): string {
		return Htmlifier.decoder.decode(this.pandoc.parseSync(
			'-f json -t html --mathjax',
			JSON.stringify(this.wrap(Array.isArray(blocks) ? blocks : [blocks])),
		).data);
	}
}

interface PageHandle {
	open(): void;
	close(): void;
}

/**页面文章渲染器 */
class Renderer {
	/**图片文件的位置 */
	static readonly imgFolder = '/api/upload/files/';
	/**
	 * 分组整个文章
	 * @param pandoc 初始化过的 pandoc 类
	 * @param content 文章的 PandocJSON
	 * @param least 最少分到第几级标题
	 */
	constructor(
		/**被分组后的文章 */
		protected readonly groupedBook: GroupedBook,
		/**转换器 */
		protected readonly htmlifier: Htmlifier,
	) { }
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
	 * 得到内容 show_body
	 * @param blocks 内容的 Pandoc
	 */
	protected geleBody(this: this, blocks: Block[]): HTMLDivElement {
		const div = gele('div', {
			className: 'show_body show_body_text typobox',
		});
		this.hide(div);
		div.innerHTML = `<div class="typo">
			${this
				.htmlifier
				.trans(blocks)
				.replaceAll('src="', `src="${Renderer.imgFolder}`)}
		</div>`;
		return div;
	}
	/**
	 * 得到 show_header
	 * @param header pandoc 格式的标题
	 */
	protected geleHeader(this: this, header: Header, onclick: () => void): HTMLDivElement {
		const innerHTML = this.htmlifier.trans({ t: 'Plain', c: header.c[2] } satisfies Plain);
		return gele('div', {
			innerHTML,
			className: 'show_header',
			onclick,
		});
	}
	/**
	 * 递归得到 show_body
	 * @param groupedBook 分好的组
	 */
	protected geleGrouped(
		this: this,
		groupedBook: GroupedBook,
		nodes: HTMLElement[],
		preHandle?: PageHandle,
	): PageHandle {
		if (Array.isArray(groupedBook)) {
			const body = this.geleBody(groupedBook);
			this.hide(body);
			nodes.push(body);
			return {
				open: () => {
					preHandle?.open();
					this.show(body);
				},
				close: () => {
					preHandle?.close();
					this.hide(body);
				},
			};
		}
		const { sum, content } = groupedBook;
		const sumBody = this.geleGrouped(sum, nodes);
		if (content.length === 0) return sumBody;
		let showing = sumBody;
		const menu = gele('div', {
			nodes: content
				.flatMap(([header, body]) => {
					const handle = this.geleGrouped(body, nodes, {
						open: () => headerEle.classList.add('show_header_clicked'),
						close: () => headerEle.classList.remove('show_header_clicked'),
					});
					const headerEle = this.geleHeader(header, () => {
						if (showing !== handle) {
							showing.close();
							handle.open();
							showing = handle;
						} else {
							handle.close();
							sumBody.open();
							showing = sumBody;
						}
					});
					return [headerEle, gele('hr')];
				}),
			className: 'show_body show_body_header_box',
		});
		this.hide(menu);
		nodes.push(menu);
		return {
			open: () => {
				this.show(menu);
				showing.open();
			},
			close: () => {
				this.hide(menu);
				showing.close();
			},
		};
	}
	/**构建主元素 */
	build(): HTMLElement[] {
		const nodes: HTMLElement[] = [];
		const handle = this.geleGrouped(this.groupedBook, nodes);
		handle.open();
		return nodes;
	}
}

export function render(pandoc: Pandoc, content: PandocJSON, least: number) {
	const groupedBook = groupifyAll(content.blocks, least);
	const renderer = new Renderer(groupedBook, new Htmlifier(pandoc, content));
	return renderer.build();
}

