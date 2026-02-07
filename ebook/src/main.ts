/// <reference path="../../public/common.ts" />

import { groupifyAll } from './group';
import render from './render';
import { getSerialized, Htmlifier } from './storage';

const findedObjType = z.object({
	id: z.string(),
	uid: z.string(),
	update_time: z.string(),
	fid: z.string(),
});

initCallbackHandler({
	start: [noForm, () => {
		const cid = query.get('cid') ?? panic(Error('不知道用户要看什么章节'));
		gid('find_cid_input', 'input').value = cid;
		gid('find_submit_input', 'input').click();
	}],
	finded: ['main', main],
}, {
	finded: [findedObjType],
});

/**
 * 获取文章 PandocJSON
 * @param fid 文章的文件 id
 */
async function getContent(fid: string) {
	const res = await forceReq(`/api/upload/files/${fid}/index.json`);
	const json = await res.json().catch(panicable('文章 json 解析失败'));
	return panicable(
		() => PandocTypes.pandocJsonSchema.parse(json),
		'文章 json 不符合 schema',
		json,
	);
}

async function renderMath(eles: HTMLElement[], groupSize = 10, timeMs = 0) {
	// @ts-ignore
	await MathJax.startup.promise;
	let now = -1;
	const grouped: HTMLElement[][] = [];
	eles.forEach((n, i) => {
		const idx = Math.trunc(i / groupSize);
		if (now !== idx) {
			now = idx;
			grouped.push([]);
		}
		grouped.at(-1)?.push(n);
	});
	for (const group of grouped.reverse()) {
		await timeout(timeMs);
		// @ts-ignore
		MathJax.typeset(group);
	}
}

const least = 4;

async function main({ fid }: z.infer<typeof findedObjType>) {
	const serialized = await getSerialized(fid, least, async () => {
		const pandocAsync = new PandocAsync({
			url: new URL('/public/lib/pandoc.wasm', location.toString()),
			errListeners: [n => panic(getError('pandoc 出问题了，说', n))],
		});
		const content = await getContent(fid);
		const groupedBook = groupifyAll(content.blocks, least);
		return [groupedBook, new Htmlifier(pandocAsync, content)];
	});
	const box = gid('view_div', 'div');
	render(box, serialized);
	renderMath(
		Array.from(box
			.children)
			.filter(n => n.className.includes('show_body_text'))
			.flatMap(n => Array.from(n.querySelectorAll('.math'))),
	);
}

