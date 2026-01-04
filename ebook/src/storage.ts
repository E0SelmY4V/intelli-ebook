/// <reference path="../../public/common.ts" />

import PandocJSON = PandocTypes.PandocJSON;
import Block = PandocTypes.Block;
import Plain = PandocTypes.Plain;

import { GroupedBook } from './group';
import { get, set } from 'idb-keyval';

/**把 pandoc 变成 HTML 的 */
export class Htmlifier {
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

export const Page = z.object({
	part: z.literal('Page'),
	html: z.string(),
});
export type Page = z.infer<typeof Page>;
export const Group = z.object({
	part: z.literal('Group'),
	sum: Page,
	get content() {
		return z.array(z.tuple([z.string(), Serialized]));
	},
});
export type Group = z.infer<typeof Group>;
export const Serialized = z.union([Page, Group]);
export type Serialized = z.infer<typeof Serialized>;

export function serialize(groupedBook: GroupedBook, htmlifier: Htmlifier): Serialized {
	if (Array.isArray(groupedBook)) return { part: 'Page', html: htmlifier.trans(groupedBook) };
	const { sum, content } = groupedBook;
	return {
		part: 'Group',
		sum: { part: 'Page', html: htmlifier.trans(sum) },
		content: content.map(([header, body]) => [
			htmlifier.trans({ t: 'Plain', c: header.c[2] } satisfies Plain),
			serialize(body, htmlifier),
		]),
	};
}

function getKey(fid: string, least: number): IDBValidKey {
	return [fid, least];
}

export async function getSerialized(
	fid: string,
	least: number,
	orElse: () => Promise<Parameters<typeof serialize>>,
): Promise<Serialized> {
	const storaged = Serialized.safeParse(await get(getKey(fid, least)));
	if (storaged.success) return storaged.data;
	console.log('no storaged');
	const serialized = serialize(...await orElse());
	await set(getKey(fid, least), serialized);
	return serialized;
}

