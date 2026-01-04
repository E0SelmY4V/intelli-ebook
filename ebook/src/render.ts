/// <reference path="../../public/common.ts" />

import { Serialized } from './storage';

interface PageHandle {
	open(): void;
	close(): void;
}

/**图片文件的位置 */
const imgFolder = '/api/upload/files/';
/**
 * 隐藏一个元素
 * @param ele 要被操作的元素
 */
function hide(ele: HTMLElement) {
	ele.hidden = true;
	ele.style.display = 'none';
}
/**
 * 显示一个元素
 * @param ele 要被操作的元素
 */
function show(ele: HTMLElement) {
	ele.hidden = false;
	ele.style.display = '';
}

/**
 * 得到内容 show_body
 * @param blocks 内容的 Pandoc
 */
function geleBody(html: string): HTMLDivElement {
	const div = gele('div', {
		className: 'show_body show_body_text typobox',
	});
	hide(div);
	div.innerHTML = `<div class="typo">
		${html.replaceAll('src="', `src="${imgFolder}`)}
	</div>`;
	return div;
}
/**
 * 递归得到 show_body
 * @param groupedBook 分好的组
 */
function geleGrouped(
	serialized: Serialized,
	nodes: HTMLElement[],
): PageHandle {
	if (serialized.part === 'Page') {
		const body = geleBody(serialized.html);
		hide(body);
		nodes.push(body);
		return {
			open: () => show(body),
			close: () => hide(body),
		};
	}
	const { sum, content } = serialized;
	const sumBody = geleGrouped(sum, nodes);
	if (content.length === 0) return sumBody;
	let showing = sumBody;
	const menu = gele('div', {
		nodes: content.flatMap(([header, body]) => {
			const { open, close } = geleGrouped(body, nodes);
			const handle: PageHandle = {
				open() {
					headerEle.classList.add('show_header_clicked');
					open();
				},
				close() {
					headerEle.classList.remove('show_header_clicked');
					close();
				},
			};
			const headerEle = gele('div', {
				innerHTML: header,
				className: 'show_header',
				onclick() {
					if (showing !== handle) {
						showing.close();
						handle.open();
						showing = handle;
					} else {
						handle.close();
						sumBody.open();
						showing = sumBody;
					}
				},
			});
			return [headerEle, gele('hr')];
		}),
		className: 'show_body show_body_header_box',
	});
	hide(menu);
	nodes.push(menu);
	return {
		open() {
			show(menu);
			showing.open();
		},
		close() {
			hide(menu);
			showing.close();
		},
	};
}

/**构建主元素 */
export function render(serialized: Serialized) {
	const nodes: HTMLElement[] = [];
	const handle = geleGrouped(serialized, nodes);
	handle.open();
	return nodes;
}

