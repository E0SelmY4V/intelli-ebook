/// <reference path="../../public/common.ts" />

import { Renderer } from './docproc';

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
	finded: ['main', render],
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
async function render({ fid }: z.infer<typeof findedObjType>) {
	const content = await getContent(fid);
	const pandoc = new Pandoc(
		forceReq('/public/lib/pandoc.wasm'),
		{ err: msg => console.error(msg) },
	);
	await pandoc.init();
	const rootBody = new Renderer(pandoc, content, 4).build();
	gid('view_div', 'div').appendChild(rootBody);
	// @ts-ignore
	MathJax.startup.promise.then(() => MathJax.typeset([rootBody]));
}

