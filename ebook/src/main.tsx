/// <reference path="../../public/common.ts" />

import { createRoot } from 'react-dom/client';
import { groupifyAll } from './group';
import { getSerialized, Htmlifier } from './storage';
import View from './View';

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

const least = 4;

function main({ fid }: z.infer<typeof findedObjType>) {
	const serializedPromise = getSerialized(fid, least, async () => {
		const pandocAsync = new PandocAsync({
			url: new URL('/public/lib/pandoc.wasm', location.toString()),
			errListeners: [n => panic(getError('pandoc 出问题了，说', n))],
		});
		const content = await getContent(fid);
		const groupedBook = groupifyAll(content.blocks, least);
		return [groupedBook, new Htmlifier(pandocAsync, content)];
	});
	createRoot(gid('view_div', 'div')).render(<View serializedPromise={serializedPromise} />);
}

